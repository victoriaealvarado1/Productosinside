/* ============================================================
   Gestión Inside — Lógica (v1.1: Calendario de Publicación)
   Vanilla JS, sin build. Persiste en localStorage.
   ============================================================ */

const KEY = "gestion_inside_v2_0";
const HOY = "2026-07-04"; // fecha de referencia de la operación
// Riesgo: publica en <=2 días y el cliente aún no aprueba
const HOY_MAS_2 = (() => { const d = new Date(HOY + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 2); return d.toISOString().slice(0, 10); })();

const UI = {
  view: "calendario",
  mode: "interno",            // interno | cliente
  calView: "grid",            // grid | lista
  gestTab: "pend",            // pend | mensual
  gestMes: SEED.meta.mesActual,
  gestGrupo: "",              // drill-down dentro de la gestión mensual
  pendGroupCliente: "persona",// persona | lista
  pendGroupInside: "area",    // area | persona | lista
  month: SEED.meta.mesActual,
  filtros: { region: [], campana: "", canal: "", formato: "", estado: "", aprobacion: "", responsable: "", q: "" },
  showBacklog: false,         // panel "Por asignar fecha" desplegable (oculto por defecto)
  soloMias: false,            // en modo cliente: solo lo que apruebo yo
  clienteId: "nico",          // "quién soy" cuando entro como cliente
  editId: null,
};

let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw);
      // Migración suave: si faltan bloques nuevos, tomarlos de la semilla
      ["pendientes", "matrices", "masterdoc", "aprendizajes", "areas"].forEach((k) => { if (!db[k]) db[k] = JSON.parse(JSON.stringify(SEED[k])); });
      return db;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(SEED));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }

/* ---------- Lookups ---------- */
const region = (id) => DB.regiones.find((r) => r.id === id);
const campana = (id) => DB.campanas.find((c) => c.id === id);
const estado = (id) => DB.estados.find((e) => e.id === id);
const aprob = (id) => DB.aprobaciones.find((a) => a.id === id);
const persona = (id) => DB.personas.find((p) => p.id === id);
const inside = () => DB.personas.filter((p) => p.lado === "agencia");
const clientes = () => DB.personas.filter((p) => p.lado === "cliente");
const nombre = (id) => { const p = persona(id); return p ? p.nombre : "—"; };

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const monthLabel = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MESES[m - 1]} ${y}`; };
function shiftMonth(ym, d) { let [y, m] = ym.split("-").map(Number); m += d; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } return `${y}-${String(m).padStart(2, "0")}`; }
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Filtrado ---------- */
function applyFilters(list) {
  const f = UI.filtros;
  let l = list
    .filter((p) => !f.region.length || f.region.includes(p.regionId))
    .filter((p) => !f.campana || p.campanaId === f.campana)
    .filter((p) => !f.canal || p.canal === f.canal)
    .filter((p) => !f.formato || p.formato === f.formato)
    .filter((p) => !f.estado || p.estado === f.estado)
    .filter((p) => !f.aprobacion || p.aprobacion === f.aprobacion)
    .filter((p) => !f.responsable || p.responsable === f.responsable);
  if (f.q) {
    const q = f.q.toLowerCase();
    l = l.filter((p) => {
      const c = campana(p.campanaId);
      const texto = [c ? c.nombre : "", p.notas, p.formato, p.canal, nombre(p.responsable), nombre(p.aprobador), (p.paises || []).join(" ")].join(" ").toLowerCase();
      return texto.includes(q);
    });
  }
  if (UI.mode === "cliente" && UI.soloMias) l = l.filter((p) => p.aprobador === UI.clienteId);
  return l;
}
// Piezas CON fecha, del mes visible
function piezasVisibles() {
  return applyFilters(DB.piezas.filter((p) => p.fecha && p.mes === UI.month))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.canal.localeCompare(b.canal));
}
// Piezas SIN fecha (backlog "por asignar fecha") — no dependen del mes
function backlogPiezas() {
  return applyFilters(DB.piezas.filter((p) => !p.fecha))
    .sort((a, b) => a.campanaId.localeCompare(b.campanaId) || a.canal.localeCompare(b.canal));
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === UI.view));
  document.querySelectorAll("#modePill button").forEach((b) => b.classList.toggle("active", b.dataset.mode === UI.mode));

  // Información general es solo interna
  const navInfo = document.querySelector('.nav-item[data-view="info"]');
  if (navInfo) navInfo.style.display = UI.mode === "cliente" ? "none" : "";
  if (UI.mode === "cliente" && UI.view === "info") UI.view = "calendario";

  const titles = {
    calendario: ["Calendario de Publicación", monthLabel(UI.month) + " · Payless"],
    gestion: ["Gestión", UI.mode === "cliente" ? "Lo que Inside necesita de Payless" : "Pendientes y gestión mensual · Payless"],
    info: ["Información general de la cuenta", "Masterdoc, brief y aprendizajes · Payless"],
    estructura: ["Estructura de cuenta", "Territorios, campañas y quién aprueba qué"],
    roadmap: ["Roadmap", "Lo que viene"],
  };
  document.getElementById("pageTitle").textContent = titles[UI.view][0];
  document.getElementById("pageSub").textContent = titles[UI.view][1];

  const c = document.getElementById("content");
  if (UI.view === "calendario") c.innerHTML = viewCalendario();
  else if (UI.view === "gestion") c.innerHTML = viewGestion();
  else if (UI.view === "info") c.innerHTML = viewInfo();
  else if (UI.view === "estructura") c.innerHTML = viewEstructura();
  else c.innerHTML = viewRoadmap();
  wireContent();
}

/* ---------- KPIs ---------- */
function kpis() {
  const ps = DB.piezas.filter((p) => p.mes === UI.month);
  const total = ps.length;
  const pend = ps.filter((p) => p.aprobacion === "pendiente").length;
  const aprobadas = ps.filter((p) => p.aprobacion === "aprobado").length;
  const publicadas = ps.filter((p) => p.estado === "publicado").length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const card = (n, l, color, val) => `<div class="kpi"><div class="n">${n}</div><div class="l">${l}</div><div class="bar"><i style="width:${val}%;background:${color}"></i></div></div>`;
  return `<div class="kpis">
    ${card(total, "Publicaciones del mes", "#6D28D9", 100)}
    ${card(pend, "Pendientes de aprobación", "#F59E0B", pct(pend))}
    ${card(aprobadas, "Aprobadas por el cliente", "#16A34A", pct(aprobadas))}
    ${card(publicadas, "Ya publicadas", "#0D9488", pct(publicadas))}
  </div>`;
}

/* ---------- Vista Calendario ---------- */
function viewCalendario() {
  const interno = UI.mode === "interno";
  let note = "";
  if (!interno) {
    const mias = DB.piezas.filter((p) => p.mes === UI.month && p.aprobador === UI.clienteId && p.aprobacion === "pendiente").length;
    note = `<div class="pill-note cli-note">
      👁️ <b>Modo Cliente</b> — estás como <b>${esc(nombre(UI.clienteId))}</b>.
      Puedes <b>aprobar o pedir ajustes</b> en cada publicación (no editar el contenido).
      ${mias > 0
        ? `<button class="link-btn" id="verPendientes">Tienes ${mias} pendiente${mias === 1 ? "" : "s"} de tu aprobación → verlas</button>`
        : `No tienes aprobaciones pendientes este mes ✓`}
      <select id="quienSoy" style="margin-left:8px">${clientes().map((p) => `<option value="${p.id}" ${UI.clienteId === p.id ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select>
    </div>`;
  }
  return `
  ${kpis()}
  ${note}
  <div class="toolbar">
    <div class="monthnav"><button id="mPrev">‹</button><span class="m">${monthLabel(UI.month)}</span><button id="mNext">›</button></div>
    <div class="grp">
      <select id="fCampana">${opt("Todas las campañas", DB.campanas, UI.filtros.campana)}</select>
      <select id="fCanal">${optS("Todos los canales", DB.canales, UI.filtros.canal)}</select>
      <select id="fFormato">${optS("Todos los formatos", DB.formatos, UI.filtros.formato)}</select>
      <select id="fEstado">${opt("Toda la producción", DB.estados, UI.filtros.estado)}</select>
      <select id="fAprob">${opt("Toda aprobación", DB.aprobaciones, UI.filtros.aprobacion)}</select>
      <select id="fResp">${opt("Todos los responsables", inside(), UI.filtros.responsable)}</select>
      <input type="search" id="fBusca" placeholder="🔍 Buscar…" value="${esc(UI.filtros.q)}" style="width:130px"/>
      ${Object.values(UI.filtros).some((v) => Array.isArray(v) ? v.length : v) ? `<button class="btn sm ghost" id="btnLimpiar" title="Quitar todos los filtros">✕ Limpiar</button>` : ""}
    </div>
    <div class="spacer"></div>
    ${!interno ? `<label class="chkmine"><input type="checkbox" id="soloMias" ${UI.soloMias ? "checked" : ""}/> Solo lo que apruebo yo</label>` : ""}
    <button class="btn ${UI.showBacklog ? "active" : ""}" id="btnBacklog" title="Piezas que existen pero aún no tienen día de publicación">🗂️ Por asignar fecha <span class="cnt-inline">${DB.piezas.filter((p) => !p.fecha).length}</span></button>
    <div class="viewtoggle">
      <button data-cal="grid" class="${UI.calView === "grid" ? "active" : ""}">📅 Calendario</button>
      <button data-cal="lista" class="${UI.calView === "lista" ? "active" : ""}">☰ Gestión (lista)</button>
    </div>
    ${interno ? `<button class="btn" id="btnDup" title="Copiar todas las publicaciones de este mes al siguiente">⧉ Duplicar mes</button>` : ""}
    ${interno ? `<button class="btn primary" id="btnNew">＋ Agregar publicación</button>` : ""}
  </div>
  <div class="reg-legend">
    ${DB.regiones.map((r) => {
      const on = UI.filtros.region.includes(r.id);
      return `<button class="reg-chip ${on ? "on" : ""}" data-regchip="${r.id}" title="Clic para ver solo esta región (puedes elegir varias)"><i style="background:${r.color}"></i>${esc(r.nombre)}</button>`;
    }).join("")}
    ${UI.filtros.region.length ? `<button class="reg-chip clear" data-regclear="1">✕ Todas</button>` : ""}
    <span class="legend-note">Fondo = región · borde izq. = producción · ✓/⏳/✕ = aprobación · 🔴 en riesgo · ⚠️ atrasada</span>
  </div>
  ${UI.calView === "grid"
      ? (UI.showBacklog ? `<div class="cal-layout">${calGrid()}${backlogPanel(interno)}</div>` : calGrid())
      : calLista(interno)}
  `;
}

/* ---------- Panel "Por asignar fecha" (backlog sin fecha) ---------- */
function backlogPanel(interno) {
  const list = backlogPiezas();
  const total = DB.piezas.filter((p) => !p.fecha).length;
  const cards = list.length
    ? list.map((p) => bchipHTML(p, interno)).join("")
    : (total ? `<div class="backlog-empty">Hay ${total} pieza${total > 1 ? "s" : ""} sin fecha, pero los filtros activos las ocultan.</div>` : `<div class="backlog-empty">Sin piezas por asignar fecha 🎉</div>`);
  return `<aside class="backlog" ${interno ? 'data-drop=""' : ""}>
    <div class="backlog-head">
      <span>🗂️ Por asignar fecha <span class="cnt">${list.length < total ? `${list.length} de ${total}` : total}</span></span>
      <span>
        ${interno ? `<button class="ico-btn" id="btnNewBacklog" title="Agregar pieza sin fecha">＋</button>` : ""}
        <button class="ico-btn" id="btnCloseBacklog" title="Ocultar panel">✕</button>
      </span>
    </div>
    <p class="backlog-hint">${interno ? "Arrastra una tarjeta a un día para asignarle fecha. Suelta aquí para quitarle la fecha." : "Piezas que aún no tienen fecha de publicación."}</p>
    <div class="backlog-list">${cards}</div>
  </aside>`;
}

function bchipHTML(p, interno) {
  const r = region(p.regionId);
  const drag = interno ? `draggable="true" data-pieza="${p.id}"` : "";
  const c = campana(p.campanaId);
  return `<div class="bchip${interno ? " draggable" : ""}" data-open="${p.id}" ${drag} style="border-left-color:${r ? r.color : "#64748B"}">
    <div class="bc-top"><span class="cico">${FORMATO_ICONO[p.formato] || "•"}</span><b>${esc(c ? c.nombre : "")}</b>${aprobMark(p)}</div>
    <div class="bc-meta"><span class="canal-badge c-${p.canal}">${esc(CANAL_ICONO[p.canal] || "")}</span> ${esc(p.formato)} · ${esc(r ? r.nombre : "")}</div>
  </div>`;
}

// Pieza con fecha vencida y aún no publicada
const atrasada = (p) => p.fecha && p.fecha < HOY && p.estado !== "publicado";
// Pieza que publica en <=2 días sin aprobación del cliente: EN RIESGO de no salir
const enRiesgo = (p) => p.fecha && p.fecha >= HOY && p.fecha <= HOY_MAS_2 && p.aprobacion !== "aprobado" && p.estado !== "publicado";

function aprobMark(p) {
  if (p.aprobacion === "aprobado") return `<span class="amark ok" title="Aprobado por ${esc(nombre(p.aprobador))}">✓</span>`;
  if (p.aprobacion === "rechazado") return `<span class="amark no" title="Con ajustes (${esc(nombre(p.aprobador))})">✕</span>`;
  return `<span class="amark wait" title="Pendiente de ${esc(nombre(p.aprobador))}">⏳</span>`;
}

function chipHTML(p) {
  const r = region(p.regionId), e = estado(p.estado);
  const ico = FORMATO_ICONO[p.formato] || "•";
  const drag = UI.mode === "interno" ? `draggable="true" data-pieza="${p.id}"` : "";
  return `<span class="chip${UI.mode === "interno" ? " draggable" : ""}" data-open="${p.id}" ${drag} title="${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")} · ${esc(p.canal)} · ${esc(p.formato)} · ${esc(r ? r.nombre : "")}"
    style="background:${r ? r.color : "#64748B"};border-left-color:${e ? e.color : "#fff"}">
    <span class="cico">${ico}</span>${atrasada(p) ? '<span class="late" title="Atrasada: la fecha ya pasó y no está publicada">⚠️</span>' : ""}${enRiesgo(p) ? '<span class="late" title="En riesgo: publica en menos de 2 días y el cliente no ha aprobado">🔴</span>' : ""}${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")}
    <span class="cmeta">${esc(CANAL_ICONO[p.canal] || "")}·${esc(p.formato)}</span>${aprobMark(p)}</span>`;
}

function calGrid() {
  const [y, m] = UI.month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const startDow = (first.getUTCDay() + 6) % 7;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dimPrev = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const byDay = {};
  piezasVisibles().forEach((p) => { (byDay[p.fecha] = byDay[p.fecha] || []).push(p); });
  const today = HOY;
  const dow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let cells = "";
  const total = Math.ceil((startDow + dim) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const di = i - startDow + 1;
    let cls = "cal-cell", label, dateStr = "", other = false;
    if (di < 1) { other = true; label = dimPrev + di; }
    else if (di > dim) { other = true; label = di - dim; }
    else { label = di; dateStr = `${UI.month}-${String(di).padStart(2, "0")}`; }
    if (other) cls += " other";
    if (dateStr === today) cls += " today";
    const chips = (byDay[dateStr] || []).map(chipHTML).join("");
    const add = !other && UI.mode === "interno" ? `<button class="addday" data-add="${dateStr}" title="Agregar publicación">＋</button>` : "";
    const dropAttr = !other && UI.mode === "interno" ? `data-drop="${dateStr}"` : "";
    cells += `<div class="${cls}" ${dropAttr}>${add}<div class="dnum">${label}</div>${chips}</div>`;
  }
  return `<div class="calwrap"><div class="cal-head">${dow.map((d) => `<div>${d}</div>`).join("")}</div><div class="cal-grid">${cells}</div></div>`;
}

function paisesResumen(p) {
  const r = region(p.regionId);
  if (!r) return "—";
  if (p.paises.length === r.paises.length) return `Toda la región`;
  return p.paises.map(esc).join(", ");
}

function calLista(interno) {
  const sinFecha = backlogPiezas();
  const conFecha = piezasVisibles();
  const piezas = [...sinFecha, ...conFecha];
  if (!piezas.length) return emptyState(interno);
  const rows = piezas.map((p) => {
    const r = region(p.regionId), e = estado(p.estado), a = aprob(p.aprobacion);
    const acc = interno
      ? `<button class="ico-btn" data-open="${p.id}" title="Editar">✏️</button><button class="ico-btn danger" data-del="${p.id}" title="Eliminar">🗑️</button>`
      : `<button class="ico-btn" data-open="${p.id}" title="Ver / aprobar">👁️</button>`;
    return `<tr class="${p.fecha ? "" : "sin-fecha"}">
      <td class="nowrap ${atrasada(p) || enRiesgo(p) ? "late-cell" : ""}">${p.fecha ? (atrasada(p) ? "⚠️ " : enRiesgo(p) ? "🔴 " : "") + esc(fechaCorta(p.fecha)) : '<span class="tag-sf">Sin fecha</span>'}</td>
      <td><span class="canal-badge c-${p.canal}">${esc(CANAL_ICONO[p.canal])}</span></td>
      <td><span class="fmt-cell">${FORMATO_ICONO[p.formato] || ""} ${esc(p.formato)}</span></td>
      <td><b>${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")}</b></td>
      <td><span class="badge soft"><span class="dot" style="background:${r ? r.color : "#999"}"></span>${esc(r ? r.nombre : "")}</span><div class="paises">${esc(paisesResumen(p))}</div></td>
      <td><span class="badge" style="background:${e ? e.color + "22" : "#eee"};color:${e ? e.color : "#333"}">${esc(e ? e.nombre : "")}</span></td>
      <td>${esc(nombre(p.responsable))}</td>
      <td><span class="appr ${p.aprobacion}">${esc(a ? a.nombre : "")}</span><div class="paises">${esc(nombre(p.aprobador))}</div></td>
      <td>${p.link ? `<a class="lk" href="${esc(p.link)}" target="_blank" rel="noopener">Abrir ↗</a>` : `<span class="nolink">—</span>`}</td>
      <td class="acc">${acc}</td>
    </tr>`;
  }).join("");
  return `<table class="tbl"><thead><tr>
    <th>Fecha</th><th>Canal</th><th>Formato</th><th>Campaña</th><th>Región / países</th><th>Producción</th><th>Publica (Inside)</th><th>Aprobación cliente</th><th>Link</th><th></th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

const fechaCorta = (f) => { const [, m, d] = f.split("-").map(Number); return `${d} ${MESES[m - 1].slice(0, 3).toLowerCase()}`; };
function emptyState(interno) {
  return `<div class="calwrap"><div class="empty"><div class="big">🗓️</div>
    <p>No hay publicaciones para este mes con los filtros aplicados.</p>
    ${interno ? `<button class="btn primary" id="btnNew2">＋ Agregar la primera publicación</button>` : ""}</div></div>`;
}

/* ---------- Opciones de selects ---------- */
function opt(all, arr, sel) { return `<option value="">${all}</option>` + arr.map((x) => `<option value="${x.id}" ${sel === x.id ? "selected" : ""}>${esc(x.nombre)}</option>`).join(""); }
function optS(all, arr, sel) { return `<option value="">${all}</option>` + arr.map((x) => `<option value="${esc(x)}" ${sel === x ? "selected" : ""}>${esc(x)}</option>`).join(""); }

/* ---------- Estructura ---------- */
function viewEstructura() {
  const regs = DB.regiones.map((r) => `<div class="card">
    <h4><span class="sw" style="background:${r.color}"></span>${esc(r.nombre)}</h4>
    <p>${r.paises.map(esc).join(" · ")}</p><span class="tag">${r.paises.length} países</span></div>`).join("");
  const camps = DB.campanas.map((c) => `<div class="card"><h4>${esc(c.nombre)}</h4>
    <p>${DB.piezas.filter((p) => p.campanaId === c.id && p.mes === UI.month).length} publicaciones este mes</p></div>`).join("");
  const ins = inside().map((p) => `<div class="card"><h4>${esc(p.nombre)}</h4><p>${esc(p.rol)} · Inside</p><span class="tag">Agencia · publica</span></div>`).join("");
  const cli = clientes().map((p) => {
    const n = DB.piezas.filter((x) => x.aprobador === p.id && (x.mes === UI.month || !x.fecha)).length;
    const pend = DB.piezas.filter((x) => x.aprobador === p.id && (x.mes === UI.month || !x.fecha) && x.aprobacion === "pendiente").length;
    return `<div class="card"><h4>${esc(p.nombre)}</h4><p>${esc(p.rol)} · Payless</p><span class="tag cli">Cliente · aprueba ${n}${pend ? ` · ${pend} pendiente${pend > 1 ? "s" : ""}` : ""}</span></div>`;
  }).join("");
  return `
    <div class="pill-note">Base compartida del calendario. <b>Inside publica</b>, <b>el cliente aprueba</b>. En la v2 se expande al árbol de matrices (Orgánica, Ecommerce/WhatsApp, Campañas) y a los inputs con legales por país.</div>
    <div class="section-title">Territorios</div><div class="cards">${regs}</div>
    <div class="section-title mt">Campañas de julio</div><div class="cards">${camps}</div>
    <div class="section-title mt">Equipo Inside (responsables de publicación)</div><div class="cards">${ins}</div>
    <div class="section-title mt">Contactos Payless (aprueban)</div><div class="cards">${cli}</div>`;
}

function viewRoadmap() {
  return `<div class="pill-note">La v1 (este calendario) es la base. Cada tarjeta es un módulo de la v2, ligado a un dolor concreto de la operación con Payless.</div>
    <div class="cards">${ROADMAP_V2.map((r) => `<div class="card"><h4>${esc(r.titulo)}</h4><p>${esc(r.desc)}</p><span class="tag">Resuelve: ${esc(r.dolor)}</span></div>`).join("")}</div>`;
}

/* ============================================================
   GESTIÓN — dashboard de pendientes, proyectos, masterdoc
   ============================================================ */
const P_ESTADOS = {
  activo: { nombre: "Activo", color: "#16A34A" },
  esperando: { nombre: "Esperando al cliente", color: "#F59E0B" },
  standby: { nombre: "En standby", color: "#94A3B8" },
  briefing: { nombre: "Briefing", color: "#3B82F6" },
  seguimiento: { nombre: "Seguimiento (medios)", color: "#64748B" },
  cerrado: { nombre: "Cerrado", color: "#0D9488" },
  descartado: { nombre: "Fuera de alcance", color: "#94A3B8" },
};
const GRUPOS_MES = ["Matriz Malls", "Matriz Pauta", "Matriz ATL", "Matriz Orgánica", "Campañas"];
const matriz = (id) => DB.matrices.find((m) => m.id === id);
const matrizLabel = (m) => `${m.grupo}${m.sub ? " · " + m.sub : ""} · ${m.region}`;
const pendDeMatriz = (mid) => DB.pendientes.filter((p) => p.matrizId === mid);
const DOC_ESTADOS = {
  pendiente: { nombre: "Pendiente", color: "#F59E0B" },
  proceso: { nombre: "En proceso", color: "#3B82F6" },
  entregado: { nombre: "Entregado", color: "#16A34A" },
};

// Pendientes automáticos derivados del calendario
function pendAuto() {
  const delMes = DB.piezas.filter((p) => p.mes === UI.month || !p.fecha);
  const porAprobador = {};
  delMes.filter((p) => p.aprobacion === "pendiente").forEach((p) => {
    (porAprobador[p.aprobador] = porAprobador[p.aprobador] || []).push(p);
  });
  const ajustes = delMes.filter((p) => p.aprobacion === "rechazado");
  const riesgo = DB.piezas.filter(enRiesgo);
  return { porAprobador, ajustes, riesgo };
}

function viewGestion() {
  if (UI.mode === "cliente") return gestionCliente();
  const tabs = [["pend", "📋 Pendientes"], ["mensual", `🗂️ Gestión ${monthLabel(UI.gestMes)}`]];
  return `
    <div class="gest-tabs">${tabs.map(([id, l]) => `<button class="gest-tab ${UI.gestTab === id ? "active" : ""}" data-gtab="${id}">${l}</button>`).join("")}</div>
    ${UI.gestTab === "pend" ? gestDash() : gestMensual()}`;
}

/* ---- Dashboard de pendientes ---- */
function gestDash() {
  const auto = pendAuto();
  const man = DB.pendientes;
  const abiertos = (lado) => man.filter((x) => x.lado === lado && !x.hecho);
  const nCliente = abiertos("cliente").length + Object.keys(auto.porAprobador).length;
  const nInside = abiertos("inside").length + auto.ajustes.length;
  const vencidos = man.filter((x) => !x.hecho && x.limite && x.limite < HOY).length;
  const card = (n, l, color) => `<div class="kpi"><div class="n" style="color:${color}">${n}</div><div class="l">${l}</div></div>`;

  const alertas = auto.riesgo.length ? `
    <div class="riesgo-box">
      <b>🔴 En riesgo de no publicarse</b> — publican en ≤2 días y el cliente no ha aprobado:
      ${auto.riesgo.map((p) => `<button class="riesgo-item" data-openpieza="${p.id}">${esc(fechaCorta(p.fecha))} · ${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")} · ${esc(p.formato)} (${esc(nombre(p.aprobador))})</button>`).join("")}
    </div>` : "";

  return `
  <div class="kpis">
    ${card(nCliente, "Pendientes del cliente", "#F59E0B")}
    ${card(nInside, "Pendientes de Inside", "#6D28D9")}
    ${card(auto.riesgo.length, "Piezas en riesgo", "#DC2626")}
    ${card(vencidos, "Pendientes vencidos", "#DC2626")}
  </div>
  ${alertas}
  <div class="pend-cols">
    ${pendCol("cliente", "🏢 Debe el cliente (Payless)", auto)}
    ${pendCol("inside", "🏠 Debe Inside", auto)}
  </div>`;
}

/* Tarjeta de pendiente manual, con trazabilidad visible */
function manCard(x, draggable) {
  const m = x.matrizId ? matriz(x.matrizId) : null;
  const ultimo = x.historial && x.historial.length ? x.historial[x.historial.length - 1] : null;
  return `
    <div class="pend-card ${x.hecho ? "done" : ""}" ${draggable && !x.hecho ? `draggable="true" data-pmove="${x.id}"` : ""}>
      <label class="pend-check"><input type="checkbox" data-pdone="${x.id}" ${x.hecho ? "checked" : ""}/></label>
      <div class="pend-body">
        <div class="pt">${esc(x.titulo)}</div>
        <div class="pm">${esc(nombre(x.responsable))} · ${esc(x.area)}${x.limite ? ` · <span class="${!x.hecho && x.limite < HOY ? "late-cell" : ""}">límite ${esc(fechaCorta(x.limite))}</span>` : ""}${x.link ? ` · <a class="lk" href="${esc(x.link)}" target="_blank" rel="noopener">link ↗</a>` : ""}</div>
        ${x.faltaInfo && !x.hecho ? `<div class="falta-chip">⛔ Falta: ${esc(x.faltaInfo)}</div>` : ""}
        ${m ? `<div class="mx-chip" data-vermatriz="${m.id}">🗂️ ${esc(matrizLabel(m))}</div>` : ""}
        ${ultimo ? `<div class="pn hist">${esc(fechaCorta(ultimo.fecha))} · ${esc(ultimo.texto)}${x.historial.length > 1 ? ` <span class="hist-more">+${x.historial.length - 1} más</span>` : ""}</div>` : (x.notas ? `<div class="pn">${esc(x.notas)}</div>` : "")}
      </div>
      <span class="pend-acc"><button class="ico-btn" data-pedit="${x.id}" title="Ver historial / editar">✏️</button><button class="ico-btn danger" data-pdel="${x.id}" title="Eliminar">🗑️</button></span>
    </div>`;
}

function autoCardsDe(lado, auto, filtroPersona) {
  if (lado === "cliente") {
    return Object.entries(auto.porAprobador)
      .filter(([ap]) => !filtroPersona || ap === filtroPersona)
      .map(([ap, ps]) => `<div class="pend-card auto" data-verapro="${ap}">
        <div class="pt">✋ Aprobar ${ps.length} publicaci${ps.length === 1 ? "ón" : "ones"} <span class="auto-tag">auto</span></div>
        <div class="pm">${esc(nombre(ap))} · del calendario · clic para verlas</div>
      </div>`).join("");
  }
  return auto.ajustes
    .filter((p) => !filtroPersona || p.responsable === filtroPersona)
    .map((p) => `<div class="pend-card auto" data-openpieza="${p.id}">
      <div class="pt">🛠️ Aplicar ajustes: ${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")} · ${esc(p.formato)} <span class="auto-tag">auto</span></div>
      <div class="pm">${esc(nombre(p.responsable))} · ${p.comentarioCliente ? `"${esc(p.comentarioCliente)}"` : "sin comentario del cliente"}</div>
    </div>`).join("");
}

function pendCol(lado, titulo, auto) {
  const man = DB.pendientes.filter((x) => x.lado === lado);
  const abiertos = man.filter((x) => !x.hecho);
  const hechos = man.filter((x) => x.hecho);
  const nAuto = lado === "cliente" ? Object.keys(auto.porAprobador).length : auto.ajustes.length;
  const modo = lado === "cliente" ? UI.pendGroupCliente : UI.pendGroupInside;
  const modos = lado === "cliente" ? [["persona", "Por persona"], ["lista", "Lista"]] : [["area", "Por área"], ["persona", "Por persona"], ["lista", "Lista"]];

  let cuerpo = "";
  if (modo === "lista") {
    cuerpo = autoCardsDe(lado, auto) + abiertos.map((x) => manCard(x, false)).join("");
  } else if (modo === "persona") {
    const gente = (lado === "cliente" ? clientes() : inside());
    cuerpo = gente.map((pe) => {
      const suyos = abiertos.filter((x) => x.responsable === pe.id);
      const autos = autoCardsDe(lado, auto, pe.id);
      if (!suyos.length && !autos) return "";
      return `<div class="pend-grupo" data-asignap="${pe.id}">
        <div class="pg-head">👤 <b>${esc(pe.nombre)}</b> <span class="pg-rol">${esc(pe.rol)}</span> <span class="pg-cnt">${suyos.length + (autos ? 1 : 0)}</span></div>
        ${autos}${suyos.map((x) => manCard(x, true)).join("")}
      </div>`;
    }).join("");
  } else {
    // Por área (solo Inside): distribuir arrastrando entre áreas
    cuerpo = DB.areas.map((area) => {
      const equipo = inside().filter((pe) => pe.area === area);
      const ids = equipo.map((pe) => pe.id);
      const suyos = abiertos.filter((x) => ids.includes(x.responsable));
      const autos = auto.ajustes.filter((p) => ids.includes(p.responsable));
      if (!suyos.length && !autos.length && !["Cuentas", "Diseño"].includes(area)) return "";
      return `<div class="pend-grupo" data-asignarea="${esc(area)}">
        <div class="pg-head">${AREA_ICONO[area] || "📁"} <b>${esc(area)}</b> <span class="pg-rol">${equipo.map((pe) => esc(pe.nombre.split(" ")[0])).join(", ")}</span> <span class="pg-cnt">${suyos.length + autos.length}</span></div>
        ${autoCardsDe("inside", { ajustes: autos, porAprobador: {} })}${suyos.map((x) => manCard(x, true)).join("")}
        ${!suyos.length && !autos.length ? `<div class="pg-empty">Arrastra aquí un pendiente para asignarlo a ${esc(area)}</div>` : ""}
      </div>`;
    }).join("");
  }

  return `<div class="pend-col">
    <div class="pend-head">
      <span>${titulo} <span class="cnt">${abiertos.length + nAuto}</span></span>
      <span class="pend-head-acc">
        <span class="viewtoggle sm">${modos.map(([id, l]) => `<button data-pgmode="${lado}:${id}" class="${modo === id ? "active" : ""}">${l}</button>`).join("")}</span>
        <button class="btn sm" data-paddlado="${lado}">＋ Pendiente</button>
      </span>
    </div>
    ${cuerpo || `<div class="backlog-empty">Nada pendiente 🎉</div>`}
    ${hechos.length ? `<div class="pend-done-sep">Completados (${hechos.length})</div>${hechos.map((x) => manCard(x, false)).join("")}` : ""}
  </div>`;
}
const AREA_ICONO = { Cuentas: "💼", Diseño: "🎨", Audiovisual: "🎬", Creatividad: "💡", Community: "💬", Medios: "📈", Dirección: "🧭" };

/* ---- Gestión mensual: grupos → matrices → pendientes ---- */
function gestMensual() {
  const ms = DB.matrices.filter((m) => m.mes === UI.gestMes);
  const nav = `<div class="monthnav" style="margin-bottom:16px">
    <button id="gmPrev">‹</button><span class="m">Gestión ${monthLabel(UI.gestMes)}</span><button id="gmNext">›</button>
    <span class="spacer"></span>
    ${!UI.gestGrupo ? `<button class="btn primary" id="btnAddMx">＋ Agregar matriz</button>` : ""}
  </div>`;

  if (!ms.length) return `${nav}<div class="calwrap"><div class="empty"><div class="big">🗂️</div>
    <p>No hay matrices cargadas para ${monthLabel(UI.gestMes)}.</p>
    <button class="btn" id="btnDupMes">⧉ Duplicar estructura de ${monthLabel(shiftMonth(UI.gestMes, -1))}</button></div></div>`;

  // Nivel 1: los grandes grupos
  if (!UI.gestGrupo) {
    const cards = GRUPOS_MES.map((g) => {
      const mg = ms.filter((m) => m.grupo === g);
      if (!mg.length) return "";
      const avg = Math.round(mg.reduce((s, m) => s + m.avance, 0) / mg.length);
      const nPend = mg.reduce((s, m) => s + pendDeMatriz(m.id).filter((p) => !p.hecho).length, 0);
      const regiones = [...new Set(mg.map((m) => m.region))];
      return `<div class="card proy grupo-card" data-abregrupo="${esc(g)}">
        <h4>${esc(g)}</h4>
        <p class="proy-region">${mg.length} matri${mg.length === 1 ? "z" : "ces"} · ${regiones.map(esc).join(" · ")}</p>
        <div class="proy-bar"><i style="width:${avg}%;background:#6D28D9"></i></div>
        <div class="proy-meta"><b>${avg}%</b> promedio ${nPend ? `<span class="badge" style="background:#FEF3C7;color:#B45309">${nPend} pendiente${nPend > 1 ? "s" : ""}</span>` : `<span class="badge" style="background:#DCFCE7;color:#15803D">al día</span>`}</div>
        <p class="pm" style="margin-top:8px">Entrar para ver cada matriz →</p>
      </div>`;
    }).join("");
    return `${nav}
      <div class="pill-note">Las grandes acciones de ${monthLabel(UI.gestMes)}. Entra a cada grupo para ver sus matrices por región, su avance, su link y sus pendientes.</div>
      <div class="cards">${cards}</div>`;
  }

  // Nivel 2: matrices del grupo
  const mg = ms.filter((m) => m.grupo === UI.gestGrupo);
  const subs = [...new Set(mg.map((m) => m.sub))];
  const bloques = subs.map((sub) => {
    const lista = mg.filter((m) => m.sub === sub);
    return `${sub ? `<div class="section-title mt">${esc(UI.gestGrupo)} (${esc(sub)})</div>` : ""}
      <div class="cards">${lista.map(matrizCard).join("")}</div>`;
  }).join("");
  return `${nav}
    <button class="btn sm ghost" id="btnBackGrupo">← Volver a los grupos</button>
    <div class="section-title" style="margin-top:14px">${esc(UI.gestGrupo)} · ${monthLabel(UI.gestMes)}</div>
    ${bloques}`;
}

function matrizCard(m) {
  const e = P_ESTADOS[m.estado] || P_ESTADOS.activo;
  const pends = pendDeMatriz(m.id).filter((p) => !p.hecho);
  return `<div class="card proy ${["descartado", "seguimiento"].includes(m.estado) ? "off" : ""}">
    <div class="proy-top"><h4>${m.sub ? esc(m.sub) + " · " : ""}${esc(m.region)}</h4><button class="ico-btn" data-mxedit="${m.id}" title="Editar">✏️</button></div>
    <div class="proy-bar"><i style="width:${m.avance}%;background:${e.color}"></i></div>
    <div class="proy-meta"><span class="badge" style="background:${e.color}22;color:${e.color}">${esc(e.nombre)}</span> <b>${m.avance}%</b></div>
    <p class="pm" style="margin-top:8px">Inside: ${esc(nombre(m.responsable))} · Aprueba: ${esc(nombre(m.aprobador))}</p>
    ${m.notas ? `<p class="pn">${esc(m.notas)}</p>` : ""}
    ${m.link ? `<a class="lk" href="${esc(m.link)}" target="_blank" rel="noopener">Abrir matriz ↗</a>` : `<span class="nolink">sin link aún</span>`}
    <div class="mx-pends">
      ${pends.map((p) => `<div class="mx-pend" data-pedit="${p.id}">${p.lado === "cliente" ? "🏢" : "🏠"} ${esc(p.titulo)} <span class="pg-rol">${esc(nombre(p.responsable))}</span></div>`).join("") || `<div class="pg-empty" style="margin:0">Sin pendientes vinculados</div>`}
      <button class="btn sm ghost" data-paddmx="${m.id}">＋ Pendiente de esta matriz</button>
    </div>
  </div>`;
}

/* ---- Masterdoc ---- */
function gestMasterdoc() {
  const m = DB.masterdoc;
  const docRow = (d, i) => {
    const e = DOC_ESTADOS[d.estado] || DOC_ESTADOS.pendiente;
    return `<tr>
      <td><b>${esc(d.entregable)}</b>${d.nota ? `<div class="pn">${esc(d.nota)}</div>` : ""}</td>
      <td>${esc(d.responsable)}</td>
      <td><button class="badge doc-estado" data-doccycle="${i}" title="Clic para cambiar el estado" style="background:${e.color}22;color:${e.color};border:none;cursor:pointer">${esc(e.nombre)}</button></td>
      <td>${d.link ? `<a class="lk" href="${esc(d.link)}" target="_blank" rel="noopener">Abrir ↗</a>` : `<span class="nolink">—</span>`}</td>
      <td class="acc"><button class="ico-btn" data-docedit="${i}" title="Editar link/nota">✏️</button></td>
    </tr>`;
  };
  return `
  <div class="cards" style="margin-bottom:20px">
    <div class="card"><h4>Cliente</h4><p>${esc(m.ficha.cliente)} · gestión desde ${esc(m.ficha.inicio)}</p></div>
    <div class="card"><h4>Punto de contacto Inside</h4><p>${esc(m.ficha.contactoInside)}</p></div>
    <div class="card"><h4>Comunicación</h4><p>${esc(m.ficha.comunicacion)}</p></div>
  </div>
  <div class="section-title">Documentación base de la marca</div>
  <table class="tbl"><thead><tr><th>Entregable</th><th>Responsable</th><th>Estado</th><th>Link</th><th></th></tr></thead>
    <tbody>${m.documentacion.map(docRow).join("")}</tbody></table>
  <div class="section-title mt">Fechas clave del ciclo mensual</div>
  <div class="cards">${m.fechasClave.map((f) => `<div class="card"><h4>${esc(f.que)}</h4><p>${esc(f.cuando)}</p><span class="tag">${esc(f.quien)}</span></div>`).join("")}</div>
  <div class="section-title mt">Cuentas por país (Instagram)</div>
  <div class="pill-note">🔒 Por seguridad, aquí solo se listan los usuarios. Las contraseñas <b>no viven en esta herramienta</b>: muévanlas del Excel compartido a un gestor de contraseñas (1Password / Bitwarden).</div>
  <table class="tbl"><thead><tr><th>País</th><th>Cuenta</th></tr></thead>
    <tbody>${m.cuentas.map((c) => `<tr><td>${esc(c.pais)}</td><td><b>${esc(c.usuario)}</b></td></tr>`).join("")}</tbody></table>`;
}

/* ---- Gestión en modo Cliente: solo lo que Payless nos debe ---- */
function gestionCliente() {
  const auto = pendAuto();
  const man = DB.pendientes.filter((x) => x.lado === "cliente" && !x.hecho);
  const misAprob = auto.porAprobador[UI.clienteId] || [];
  const porPersona = clientes().map((pe) => {
    const suyos = man.filter((x) => x.responsable === pe.id);
    if (!suyos.length) return "";
    return `<div class="pend-grupo">
      <div class="pg-head">👤 <b>${esc(pe.nombre)}</b> <span class="pg-rol">${esc(pe.rol)}</span> <span class="pg-cnt">${suyos.length}</span></div>
      ${suyos.map((x) => `
      <div class="pend-card">
        <div class="pend-body">
          <div class="pt">${esc(x.titulo)}</div>
          <div class="pm">${esc(x.area)}${x.limite ? ` · <span class="${x.limite < HOY ? "late-cell" : ""}">límite ${esc(fechaCorta(x.limite))}</span>` : ""}</div>
          ${x.faltaInfo ? `<div class="falta-chip">⛔ Falta: ${esc(x.faltaInfo)}</div>` : ""}
          ${x.notas ? `<div class="pn">${esc(x.notas)}</div>` : ""}
        </div>
      </div>`).join("")}
    </div>`;
  }).join("");
  return `
  <div class="pill-note cli-note">👁️ <b>Modo Cliente</b> — esta lista es lo que Inside necesita de Payless para avanzar sin frenos, organizada por responsable.</div>
  ${misAprob.length ? `<div class="riesgo-box"><b>✋ Tienes ${misAprob.length} publicaci${misAprob.length === 1 ? "ón" : "ones"} por aprobar</b> — <button class="link-btn" data-verapro="${UI.clienteId}">verlas en el calendario</button></div>` : ""}
  <div class="pend-col" style="max-width:760px">
    <div class="pend-head"><span>Pendientes de Payless <span class="cnt">${man.length}</span></span></div>
    ${porPersona || `<div class="backlog-empty">Nada pendiente 🎉</div>`}
  </div>`;
}

/* ============================================================
   INFORMACIÓN GENERAL DE LA CUENTA (solo interno)
   ============================================================ */
function viewInfo() {
  const apts = [...DB.aprendizajes].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return `
  ${gestMasterdoc()}
  <div class="section-title mt">💡 Aprendizajes de la cuenta</div>
  <div class="pill-note">Lo que la cuenta nos va enseñando. Hoy se agregan a mano (y desde las reuniones); en la v3 se generarán automáticamente desde las transcripciones.</div>
  <div class="hist-add" style="max-width:760px;margin-bottom:14px">
    <input type="text" id="apNuevo" placeholder="Nuevo aprendizaje... (ej: 'al cliente no le gustan los fondos amarillos')" style="flex:1"/>
    <button class="btn primary sm" id="apAdd">＋ Agregar</button>
  </div>
  <div class="pend-col" style="max-width:760px">
    ${apts.map((a) => `
      <div class="pend-card">
        <div class="pend-body">
          <div class="pt">${esc(a.texto)}</div>
          <div class="pm">${esc(fechaCorta(a.fecha))}${a.fuente ? ` · ${esc(a.fuente)}` : ""}</div>
        </div>
        <span class="pend-acc"><button class="ico-btn danger" data-apdel="${a.id}" title="Eliminar">🗑️</button></span>
      </div>`).join("") || `<div class="backlog-empty">Aún no hay aprendizajes registrados</div>`}
  </div>`;
}

/* ---- Modales de gestión ---- */
function openPendModal(id, ladoPreset, matrizPreset) {
  const p = id ? DB.pendientes.find((x) => x.id === id)
    : { id: null, lado: ladoPreset || "cliente", titulo: "", responsable: ladoPreset === "inside" ? "vic" : "nico", area: "Gestión", limite: "", link: "", notas: "", hecho: false, historial: [], faltaInfo: "", matrizId: matrizPreset || "" };
  if (!p) return;
  if (!p.historial) p.historial = [];
  const personasDelLado = p.lado === "cliente" ? clientes() : inside();
  const mxDelMes = DB.matrices.filter((m) => m.mes === UI.gestMes);
  document.getElementById("modalTitle").textContent = id ? "Pendiente · trazabilidad" : "Nuevo pendiente";
  document.getElementById("modalBody").innerHTML = `
    <div><label class="fld">¿Qué falta?</label><input type="text" id="pTitulo" value="${esc(p.titulo)}" placeholder="Ej: enviar editables de..." style="width:100%"/></div>
    <div class="row2">
      <div><label class="fld">Lado</label><select id="pLado" style="width:100%"><option value="cliente" ${p.lado === "cliente" ? "selected" : ""}>Debe el cliente</option><option value="inside" ${p.lado === "inside" ? "selected" : ""}>Debe Inside</option></select></div>
      <div><label class="fld">Responsable</label><select id="pResp" style="width:100%">${personasDelLado.map((pe) => `<option value="${pe.id}" ${p.responsable === pe.id ? "selected" : ""}>${esc(pe.nombre)}${pe.lado === "agencia" ? " · " + esc(pe.area) : ""}</option>`).join("")}</select></div>
    </div>
    <div class="row2">
      <div><label class="fld">Categoría</label><select id="pArea" style="width:100%">${["Accesos", "Editables", "Inputs", "Contenido", "Diseño", "Matrices", "Gestión", "Equipo", "Creatividad"].map((a) => `<option ${p.area === a ? "selected" : ""}>${a}</option>`).join("")}</select></div>
      <div><label class="fld">Fecha límite (opcional)</label><input type="date" id="pLimite" value="${esc(p.limite)}" style="width:100%"/></div>
    </div>
    <div><label class="fld">Matriz vinculada (opcional)</label><select id="pMatriz" style="width:100%">
      <option value="">— Sin matriz —</option>
      ${mxDelMes.map((m) => `<option value="${m.id}" ${p.matrizId === m.id ? "selected" : ""}>${esc(matrizLabel(m))}</option>`).join("")}
    </select></div>
    <div><label class="fld">⛔ ¿Qué información falta para avanzar? (se muestra en rojo)</label><input type="text" id="pFalta" value="${esc(p.faltaInfo)}" placeholder="Ej: faltan los editables, falta el legal de Panamá..." style="width:100%"/></div>
    <div><label class="fld">Link (opcional)</label><input type="url" id="pLink" value="${esc(p.link)}" placeholder="https://..." style="width:100%"/></div>
    <div><label class="fld">Notas</label><textarea id="pNotas" rows="2" style="width:100%">${esc(p.notas)}</textarea></div>
    <div class="approval-box">
      <label class="fld">📜 Historial (trazabilidad)</label>
      <div class="hist-list">${p.historial.length
        ? p.historial.map((h) => `<div class="hist-item"><span class="hist-fecha">${esc(fechaCorta(h.fecha))}</span> ${esc(h.texto)}</div>`).join("")
        : `<div class="pg-empty" style="margin:0">Sin eventos aún</div>`}</div>
      <div class="hist-actions">
        <button type="button" class="btn sm" id="hSolicitado">📤 Solicitado hoy</button>
        <button type="button" class="btn sm" id="hEnviado">📬 Enviado hoy</button>
        <button type="button" class="btn sm" id="hRecibido">📥 Recibido hoy</button>
      </div>
      <div class="hist-add">
        <input type="text" id="hNota" placeholder="Agregar nota al historial (ej: 'pedido al diseñador por WhatsApp')" style="flex:1"/>
        <button type="button" class="btn sm" id="hAdd">＋</button>
      </div>
    </div>`;
  document.getElementById("modalFooter").innerHTML = `
    ${id ? `<button class="btn ghost" id="pDel" style="margin-right:auto;color:var(--danger)">Eliminar</button>` : ""}
    <button class="btn" id="mCancel">Cancelar</button><button class="btn primary" id="pSave">${id ? "Guardar" : "Crear pendiente"}</button>`;
  document.getElementById("overlay").classList.add("open");

  // Historial: acciones rápidas y notas libres (se pintan al guardar)
  const refreshHist = () => {
    document.querySelector(".hist-list").innerHTML = p.historial.length
      ? p.historial.map((h) => `<div class="hist-item"><span class="hist-fecha">${esc(fechaCorta(h.fecha))}</span> ${esc(h.texto)}</div>`).join("")
      : `<div class="pg-empty" style="margin:0">Sin eventos aún</div>`;
  };
  const addEv = (texto) => { p.historial.push({ fecha: HOY, texto }); refreshHist(); };
  document.getElementById("hSolicitado").onclick = () => addEv("📤 Solicitado");
  document.getElementById("hEnviado").onclick = () => addEv("📬 Enviado" + (p.lado === "inside" ? " al cliente" : ""));
  document.getElementById("hRecibido").onclick = () => addEv("📥 Recibido");
  document.getElementById("hAdd").onclick = () => {
    const t = document.getElementById("hNota").value.trim();
    if (t) { addEv("📝 " + t); document.getElementById("hNota").value = ""; }
  };

  document.getElementById("pLado").onchange = () => {
    const lado = document.getElementById("pLado").value;
    const lista = lado === "cliente" ? clientes() : inside();
    document.getElementById("pResp").innerHTML = lista.map((pe) => `<option value="${pe.id}">${esc(pe.nombre)}${pe.lado === "agencia" ? " · " + esc(pe.area) : ""}</option>`).join("");
  };
  document.getElementById("mCancel").onclick = closeModal;
  document.getElementById("pSave").onclick = () => {
    const t = document.getElementById("pTitulo").value.trim();
    if (!t) { document.getElementById("pTitulo").focus(); return; }
    p.titulo = t;
    p.lado = document.getElementById("pLado").value;
    p.responsable = document.getElementById("pResp").value;
    p.area = document.getElementById("pArea").value;
    p.limite = document.getElementById("pLimite").value;
    p.matrizId = document.getElementById("pMatriz").value;
    p.faltaInfo = document.getElementById("pFalta").value.trim();
    p.link = document.getElementById("pLink").value.trim();
    p.notas = document.getElementById("pNotas").value.trim();
    if (!p.id) { p.id = "pd_" + Date.now(); p.historial.unshift({ fecha: HOY, texto: "🏁 Creado" }); DB.pendientes.push(p); }
    save(); closeModal(); render(); toast(id ? "Pendiente actualizado ✓" : "Pendiente creado ✓");
  };
  const del = document.getElementById("pDel");
  if (del) del.onclick = () => { if (confirm("¿Eliminar este pendiente?")) { DB.pendientes = DB.pendientes.filter((x) => x.id !== p.id); save(); closeModal(); render(); } };
}

function openMatrizModal(id) {
  const p = id ? matriz(id) : { id: null, mes: UI.gestMes, grupo: UI.gestGrupo || GRUPOS_MES[0], sub: "", region: "", estado: "activo", avance: 0, responsable: "vic", aprobador: "nico", link: "", notas: "" };
  if (!p) return;
  document.getElementById("modalTitle").textContent = id ? "Editar matriz" : "Nueva matriz";
  document.getElementById("modalBody").innerHTML = `
    <div class="row2">
      <div><label class="fld">Grupo</label><select id="yGrupo" style="width:100%">${GRUPOS_MES.map((g) => `<option ${p.grupo === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></div>
      <div><label class="fld">Sub-matriz / campaña (opcional)</label><input type="text" id="ySub" value="${esc(p.sub)}" placeholder="Ej: ECOM, WA, PMAX, Tiendas" style="width:100%"/></div>
    </div>
    <div class="row2">
      <div><label class="fld">Región / alcance</label><input type="text" id="yRegion" value="${esc(p.region)}" placeholder="Ej: Centroamérica" style="width:100%"/></div>
      <div><label class="fld">Estado</label><select id="yEstado" style="width:100%">${Object.entries(P_ESTADOS).map(([k, v]) => `<option value="${k}" ${p.estado === k ? "selected" : ""}>${esc(v.nombre)}</option>`).join("")}</select></div>
    </div>
    <div><label class="fld">Avance: <b id="yAvanceVal">${p.avance}%</b></label><input type="range" id="yAvance" min="0" max="100" step="5" value="${p.avance}" style="width:100%"/></div>
    <div class="row2">
      <div><label class="fld">Responsable Inside</label><select id="yResp" style="width:100%">${inside().map((pe) => `<option value="${pe.id}" ${p.responsable === pe.id ? "selected" : ""}>${esc(pe.nombre)}</option>`).join("")}</select></div>
      <div><label class="fld">Aprueba (cliente)</label><select id="yApro" style="width:100%">${clientes().map((pe) => `<option value="${pe.id}" ${p.aprobador === pe.id ? "selected" : ""}>${esc(pe.nombre)}</option>`).join("")}</select></div>
    </div>
    <div><label class="fld">Link a la matriz / documento</label><input type="url" id="yLink" value="${esc(p.link)}" placeholder="https://..." style="width:100%"/></div>
    <div><label class="fld">Notas / estatus</label><textarea id="yNotas" rows="2" style="width:100%">${esc(p.notas)}</textarea></div>`;
  document.getElementById("modalFooter").innerHTML = `
    ${id ? `<button class="btn ghost" id="yDel" style="margin-right:auto;color:var(--danger)">Eliminar</button>` : ""}
    <button class="btn" id="mCancel">Cancelar</button><button class="btn primary" id="ySave">${id ? "Guardar" : "Crear matriz"}</button>`;
  document.getElementById("overlay").classList.add("open");

  document.getElementById("yAvance").oninput = () => { document.getElementById("yAvanceVal").textContent = document.getElementById("yAvance").value + "%"; };
  document.getElementById("mCancel").onclick = closeModal;
  document.getElementById("ySave").onclick = () => {
    p.grupo = document.getElementById("yGrupo").value;
    p.sub = document.getElementById("ySub").value.trim();
    p.region = document.getElementById("yRegion").value.trim();
    p.estado = document.getElementById("yEstado").value;
    p.avance = Number(document.getElementById("yAvance").value);
    p.responsable = document.getElementById("yResp").value;
    p.aprobador = document.getElementById("yApro").value;
    p.link = document.getElementById("yLink").value.trim();
    p.notas = document.getElementById("yNotas").value.trim();
    if (!p.id) { p.id = "mx_" + Date.now(); p.mes = UI.gestMes; DB.matrices.push(p); }
    save(); closeModal(); render(); toast("Matriz guardada ✓");
  };
  const del = document.getElementById("yDel");
  if (del) del.onclick = () => {
    if (confirm("¿Eliminar esta matriz? Sus pendientes vinculados quedan sueltos (no se borran).")) {
      DB.pendientes.forEach((x) => { if (x.matrizId === p.id) x.matrizId = ""; });
      DB.matrices = DB.matrices.filter((x) => x.id !== p.id);
      save(); closeModal(); render();
    }
  };
}

function openDocModal(i) {
  const d = DB.masterdoc.documentacion[i];
  if (!d) return;
  document.getElementById("modalTitle").textContent = d.entregable;
  document.getElementById("modalBody").innerHTML = `
    <div><label class="fld">Estado</label><select id="dEstado" style="width:100%">${Object.entries(DOC_ESTADOS).map(([k, v]) => `<option value="${k}" ${d.estado === k ? "selected" : ""}>${esc(v.nombre)}</option>`).join("")}</select></div>
    <div><label class="fld">Link</label><input type="url" id="dLink" value="${esc(d.link)}" placeholder="https://..." style="width:100%"/></div>
    <div><label class="fld">Nota</label><input type="text" id="dNota" value="${esc(d.nota)}" style="width:100%"/></div>`;
  document.getElementById("modalFooter").innerHTML = `<button class="btn" id="mCancel">Cancelar</button><button class="btn primary" id="dSave">Guardar</button>`;
  document.getElementById("overlay").classList.add("open");
  document.getElementById("mCancel").onclick = closeModal;
  document.getElementById("dSave").onclick = () => {
    d.estado = document.getElementById("dEstado").value;
    d.link = document.getElementById("dLink").value.trim();
    d.nota = document.getElementById("dNota").value.trim();
    save(); closeModal(); render(); toast("Masterdoc actualizado ✓");
  };
}

/* ============================================================
   MODAL
   ============================================================ */
function openModal(id, presetFecha) {
  UI.editId = id;
  const interno = UI.mode === "interno";
  const p = id ? DB.piezas.find((x) => x.id === id) : nuevaPieza(presetFecha);
  if (!p) return;
  const draft = JSON.parse(JSON.stringify(p)); // se edita en borrador, se aplica al guardar
  const ro = interno ? "" : "disabled";

  document.getElementById("modalTitle").textContent = !id ? "Nueva publicación" : (interno ? "Editar publicación" : "Publicación · aprobación");

  document.getElementById("modalBody").innerHTML = `
    <div class="row2">
      <div><label class="fld">Campaña</label><select id="mCampana" ${ro} style="width:100%">${DB.campanas.map((c) => `<option value="${c.id}" ${draft.campanaId === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></div>
      <div><label class="fld">Canal</label><select id="mCanal" ${ro} style="width:100%">${DB.canales.map((c) => `<option ${draft.canal === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
    </div>
    <div class="row2">
      <div><label class="fld">Formato</label><select id="mFormato" ${ro} style="width:100%">${DB.formatos.map((f) => `<option ${draft.formato === f ? "selected" : ""}>${FORMATO_ICONO[f] || ""} ${esc(f)}</option>`).join("")}</select></div>
      <div><label class="fld">Fecha de publicación</label>
        <input type="date" id="mFecha" value="${esc(draft.fecha)}" ${ro || (!draft.fecha ? "disabled" : "")} style="width:100%"/>
        <label class="mini-chk"><input type="checkbox" id="mSinFecha" ${!draft.fecha ? "checked" : ""} ${ro}/> Por asignar fecha (todavía sin día)</label>
      </div>
    </div>
    <div class="row2">
      <div><label class="fld">Región</label><select id="mRegion" ${ro} style="width:100%">${DB.regiones.map((r) => `<option value="${r.id}" ${draft.regionId === r.id ? "selected" : ""}>${esc(r.nombre)}</option>`).join("")}</select></div>
      <div><label class="fld">Producción (Inside)</label><select id="mEstado" ${ro} style="width:100%">${DB.estados.map((e) => `<option value="${e.id}" ${draft.estado === e.id ? "selected" : ""}>${esc(e.nombre)}</option>`).join("")}</select></div>
    </div>
    <div class="row2">
      <div><label class="fld">Responsable de publicación · Inside</label><select id="mResp" ${ro} style="width:100%">${inside().map((pe) => `<option value="${pe.id}" ${draft.responsable === pe.id ? "selected" : ""}>${esc(pe.nombre)}</option>`).join("")}</select></div>
      <div><label class="fld">Aprobación cliente · nombre</label><select id="mAprobador" ${ro} style="width:100%">${clientes().map((pe) => `<option value="${pe.id}" ${draft.aprobador === pe.id ? "selected" : ""}>${esc(pe.nombre)}</option>`).join("")}</select></div>
    </div>
    <div><label class="fld">Países objetivo</label><div class="paises-grid" id="mPaises">${paisesChecks(draft)}</div></div>
    <div><label class="fld">Link de la pieza / editable (Drive, Frame…) ${draft.link ? `<a class="lk" href="${esc(draft.link)}" target="_blank" rel="noopener" style="float:right">Abrir pieza ↗</a>` : ""}</label><input type="url" id="mLink" value="${esc(draft.link)}" placeholder="https://..." ${ro} style="width:100%"/></div>
    <div><label class="fld">Notas / legal / adaptación</label><textarea id="mNotas" rows="3" ${ro} style="width:100%">${esc(draft.notas)}</textarea></div>

    <div class="approval-box">
      <label class="fld">Aprobación del cliente${interno ? "" : ` · decides tú (${esc(nombre(UI.clienteId))})`}</label>
      <div class="seg big" id="mAprob">
        ${DB.aprobaciones.map((a) => `<button type="button" data-val="${a.id}" class="${draft.aprobacion === a.id ? "on " + a.id : ""}">${esc(a.nombre)}</button>`).join("")}
      </div>
      <label class="fld" style="margin-top:10px">Comentario del cliente</label>
      <textarea id="mComentario" rows="2" style="width:100%" placeholder="Ej: cambiar el legal de Honduras / aprobado tal cual...">${esc(draft.comentarioCliente)}</textarea>
    </div>
  `;

  const f = document.getElementById("modalFooter");
  if (interno) {
    f.innerHTML = `${id ? `<button class="btn ghost" id="mDelete" style="margin-right:auto;color:var(--danger)">Eliminar</button>` : ""}
      <button class="btn" id="mCancel">Cancelar</button>
      <button class="btn primary" id="mSave">${id ? "Guardar cambios" : "Crear publicación"}</button>`;
  } else {
    f.innerHTML = `<button class="btn" id="mCancel">Cerrar</button><button class="btn primary" id="mSave">Guardar aprobación</button>`;
  }

  document.getElementById("overlay").classList.add("open");
  wireModal(draft, interno, !!id);
}

function paisesChecks(draft) {
  const r = region(draft.regionId);
  if (!r) return "";
  const dis = UI.mode === "interno" ? "" : "disabled";
  return r.paises.map((pais) => {
    const on = draft.paises.includes(pais);
    return `<label class="pais-chk ${on ? "on" : ""}"><input type="checkbox" value="${esc(pais)}" ${on ? "checked" : ""} ${dis}/> ${esc(pais)}</label>`;
  }).join("");
}

function nuevaPieza(fecha) {
  const sinFecha = fecha === "SIN_FECHA";
  const f = sinFecha ? "" : (fecha || `${UI.month}-01`);
  const r = DB.regiones[0];
  return {
    id: null, fecha: f, mes: f ? f.slice(0, 7) : "", marca: "Payless",
    campanaId: DB.campanas[0].id, regionId: r.id, canal: DB.canales[0], formato: DB.formatos[0],
    estado: "briefing", responsable: inside()[0].id, aprobador: clientes()[0].id,
    aprobacion: "pendiente", comentarioCliente: "", paises: r.paises.slice(), link: "", notas: "",
  };
}
function closeModal() { document.getElementById("overlay").classList.remove("open"); UI.editId = null; }

/* Toast de confirmación */
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2200);
}

/* ============================================================
   WIRING
   ============================================================ */
function wireModal(draft, interno, existe) {
  document.getElementById("mCancel").onclick = closeModal;

  // Aprobación (operable siempre: interno registra, cliente decide)
  const bindAprob = () => document.querySelectorAll("#mAprob button").forEach((b) => b.onclick = () => {
    draft.aprobacion = b.dataset.val;
    document.querySelectorAll("#mAprob button").forEach((x) => x.className = x.dataset.val === draft.aprobacion ? "on " + draft.aprobacion : "");
  });
  bindAprob();

  if (interno) {
    const sf = document.getElementById("mSinFecha");
    const fechaInput = document.getElementById("mFecha");
    sf.onchange = () => {
      fechaInput.disabled = sf.checked;
      if (!sf.checked && !fechaInput.value) fechaInput.value = `${UI.month}-01`;
    };

    const regionSel = document.getElementById("mRegion");
    regionSel.onchange = () => {
      draft.regionId = regionSel.value;
      draft.paises = region(draft.regionId).paises.slice();
      document.getElementById("mPaises").innerHTML = paisesChecks(draft);
      bindPaises();
    };
    bindPaises();

    document.getElementById("mSave").onclick = () => {
      draft.campanaId = document.getElementById("mCampana").value;
      draft.canal = document.getElementById("mCanal").value;
      // el <option> muestra "🎬 Video"; normalizamos al nombre de formato limpio
      draft.formato = normalizaFormato(document.getElementById("mFormato").value);
      draft.regionId = document.getElementById("mRegion").value;
      // Si el checkbox está marcado O la fecha quedó vacía, va a "por asignar fecha"
      const fechaVal = document.getElementById("mFecha").value;
      if (document.getElementById("mSinFecha").checked || !fechaVal) { draft.fecha = ""; draft.mes = ""; }
      else { draft.fecha = fechaVal; draft.mes = fechaVal.slice(0, 7); }
      draft.estado = document.getElementById("mEstado").value;
      draft.responsable = document.getElementById("mResp").value;
      draft.aprobador = document.getElementById("mAprobador").value;
      draft.link = document.getElementById("mLink").value.trim();
      draft.notas = document.getElementById("mNotas").value.trim();
      draft.comentarioCliente = document.getElementById("mComentario").value.trim();
      draft.paises = [...document.querySelectorAll("#mPaises input:checked")].map((i) => i.value);
      if (!draft.paises.length) draft.paises = region(draft.regionId).paises.slice();
      commit(draft, existe);
    };
    const del = document.getElementById("mDelete");
    if (del) del.onclick = () => { if (confirm("¿Eliminar esta publicación?")) { DB.piezas = DB.piezas.filter((x) => x.id !== draft.id); save(); closeModal(); render(); } };
  } else {
    // Cliente: solo aprobación + comentario
    document.getElementById("mSave").onclick = () => {
      draft.comentarioCliente = document.getElementById("mComentario").value.trim();
      // Si pide ajustes sin decir cuáles, la agencia no sabrá qué corregir
      if (draft.aprobacion === "rechazado" && !draft.comentarioCliente) {
        document.getElementById("mComentario").focus();
        if (!confirm("Elegiste 'Con ajustes' pero no escribiste qué hay que cambiar.\n¿Guardar igual sin comentario?")) return;
      }
      commit(draft, existe);
    };
  }
}

function normalizaFormato(v) {
  return DB.formatos.find((f) => v.indexOf(f) !== -1) || DB.formatos[0];
}
function bindPaises() {
  document.querySelectorAll("#mPaises .pais-chk input").forEach((i) => i.onchange = () => i.parentElement.classList.toggle("on", i.checked));
}
function commit(draft, existe) {
  if (existe) {
    const i = DB.piezas.findIndex((x) => x.id === draft.id);
    if (i >= 0) DB.piezas[i] = draft;
  } else {
    draft.id = "pz_" + Date.now() + "_" + Math.abs(hashStr(draft.campanaId + draft.fecha + draft.canal));
    DB.piezas.push(draft);
  }
  save(); closeModal(); render();
  toast(UI.mode === "cliente" ? "Aprobación guardada ✓" : (existe ? "Cambios guardados ✓" : "Publicación creada ✓"));
}

function wireContent() {
  document.querySelectorAll("[data-open]").forEach((el) => el.onclick = () => openModal(el.dataset.open));
  document.querySelectorAll("[data-del]").forEach((el) => el.onclick = (e) => { e.stopPropagation(); const id = el.dataset.del; if (confirm("¿Eliminar esta publicación?")) { DB.piezas = DB.piezas.filter((x) => x.id !== id); save(); render(); } });
  document.querySelectorAll("[data-add]").forEach((el) => el.onclick = (e) => { e.stopPropagation(); openModal(null, el.dataset.add); });

  const bind = (id, fn, ev = "onclick") => { const el = document.getElementById(id); if (el) el[ev] = fn; };
  bind("btnNew", () => openModal(null));
  bind("btnNew2", () => openModal(null));
  bind("btnNewBacklog", () => openModal(null, "SIN_FECHA"));
  bind("btnBacklog", () => { UI.showBacklog = !UI.showBacklog; render(); });
  bind("btnCloseBacklog", () => { UI.showBacklog = false; render(); });
  bind("mPrev", () => { UI.month = shiftMonth(UI.month, -1); render(); });
  bind("mNext", () => { UI.month = shiftMonth(UI.month, 1); render(); });
  bind("btnDup", duplicarMes);
  bind("soloMias", () => { UI.soloMias = document.getElementById("soloMias").checked; render(); }, "onchange");
  bind("quienSoy", () => { UI.clienteId = document.getElementById("quienSoy").value; render(); }, "onchange");

  document.querySelectorAll("[data-cal]").forEach((b) => b.onclick = () => { UI.calView = b.dataset.cal; render(); });
  const chg = (id, key) => { const el = document.getElementById(id); if (el) el.onchange = () => { UI.filtros[key] = el.value; render(); }; };
  chg("fCampana", "campana"); chg("fCanal", "canal");
  chg("fFormato", "formato"); chg("fEstado", "estado"); chg("fAprob", "aprobacion");
  chg("fResp", "responsable");

  // — Gestión —
  document.querySelectorAll("[data-gtab]").forEach((b) => b.onclick = () => { UI.gestTab = b.dataset.gtab; render(); });
  document.querySelectorAll("[data-paddlado]").forEach((b) => b.onclick = () => openPendModal(null, b.dataset.paddlado));
  document.querySelectorAll("[data-pedit]").forEach((b) => b.onclick = () => openPendModal(b.dataset.pedit));
  document.querySelectorAll("[data-pdel]").forEach((b) => b.onclick = () => { if (confirm("¿Eliminar este pendiente?")) { DB.pendientes = DB.pendientes.filter((x) => x.id !== b.dataset.pdel); save(); render(); } });
  document.querySelectorAll("[data-pdone]").forEach((c) => c.onchange = () => {
    const x = DB.pendientes.find((y) => y.id === c.dataset.pdone);
    if (x) {
      x.hecho = c.checked;
      (x.historial = x.historial || []).push({ fecha: HOY, texto: x.hecho ? "✅ Completado" : "🔄 Reabierto" });
      save(); render(); toast(x.hecho ? "Pendiente completado ✓" : "Pendiente reabierto");
    }
  });
  document.querySelectorAll("[data-openpieza]").forEach((b) => b.onclick = () => openModal(b.dataset.openpieza));
  document.querySelectorAll("[data-verapro]").forEach((b) => b.onclick = () => {
    UI.view = "calendario"; UI.calView = "lista";
    UI.filtros.aprobacion = "pendiente"; UI.filtros.q = nombre(b.dataset.verapro);
    if (UI.mode === "cliente") UI.soloMias = true;
    render();
  });
  // Toggles de agrupación (por área / persona / lista)
  document.querySelectorAll("[data-pgmode]").forEach((b) => b.onclick = () => {
    const [lado, modo] = b.dataset.pgmode.split(":");
    if (lado === "cliente") UI.pendGroupCliente = modo; else UI.pendGroupInside = modo;
    render();
  });

  // Distribuir pendientes arrastrando entre grupos (persona o área)
  document.querySelectorAll('[data-pmove]').forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/pend", card.dataset.pmove);
      e.dataTransfer.effectAllowed = "move";
      requestAnimationFrame(() => card.classList.add("dragging"));
    });
    card.addEventListener("dragend", () => document.querySelectorAll(".dragging,.drop-hover").forEach((c) => c.classList.remove("dragging", "drop-hover")));
  });
  document.querySelectorAll("[data-asignap],[data-asignarea]").forEach((zone) => {
    zone.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("text/pend")) { e.preventDefault(); zone.classList.add("drop-hover"); } });
    zone.addEventListener("dragleave", (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("drop-hover"); });
    zone.addEventListener("drop", (e) => {
      const id = e.dataTransfer.getData("text/pend");
      if (!id) return;
      e.preventDefault(); zone.classList.remove("drop-hover");
      const x = DB.pendientes.find((y) => y.id === id);
      if (!x) return;
      if (zone.dataset.asignap) {
        if (x.responsable === zone.dataset.asignap) return;
        x.responsable = zone.dataset.asignap;
        (x.historial = x.historial || []).push({ fecha: HOY, texto: `👤 Reasignado a ${nombre(x.responsable)}` });
      } else {
        const area = zone.dataset.asignarea;
        const equipo = inside().filter((pe) => pe.area === area);
        if (!equipo.length || equipo.some((pe) => pe.id === x.responsable)) return;
        x.responsable = equipo[0].id;
        (x.historial = x.historial || []).push({ fecha: HOY, texto: `👤 Distribuido al área ${area} (${nombre(x.responsable)})` });
      }
      save(); render(); toast(`Asignado a ${nombre(x.responsable)} ✓`);
    });
  });

  // Gestión mensual
  bind("gmPrev", () => { UI.gestMes = shiftMonth(UI.gestMes, -1); UI.gestGrupo = ""; render(); });
  bind("gmNext", () => { UI.gestMes = shiftMonth(UI.gestMes, 1); UI.gestGrupo = ""; render(); });
  bind("btnBackGrupo", () => { UI.gestGrupo = ""; render(); });
  bind("btnAddMx", () => openMatrizModal(null));
  bind("btnDupMes", () => {
    const prev = shiftMonth(UI.gestMes, -1);
    const src = DB.matrices.filter((m) => m.mes === prev);
    if (!src.length) { alert(`No hay matrices en ${monthLabel(prev)} para duplicar.`); return; }
    src.forEach((m) => {
      const n = JSON.parse(JSON.stringify(m));
      n.id = "mx_" + Date.now() + "_" + Math.abs(hashStr(m.id + UI.gestMes));
      n.mes = UI.gestMes; n.avance = 0; n.estado = m.estado === "cerrado" ? "briefing" : m.estado; n.link = "";
      DB.matrices.push(n);
    });
    save(); render(); toast(`${src.length} matrices copiadas a ${monthLabel(UI.gestMes)} ✓`);
  });
  document.querySelectorAll("[data-abregrupo]").forEach((b) => b.onclick = () => { UI.gestGrupo = b.dataset.abregrupo; render(); });
  document.querySelectorAll("[data-mxedit]").forEach((b) => b.onclick = () => openMatrizModal(b.dataset.mxedit));
  document.querySelectorAll("[data-paddmx]").forEach((b) => b.onclick = () => openPendModal(null, "cliente", b.dataset.paddmx));
  document.querySelectorAll("[data-vermatriz]").forEach((b) => b.onclick = (e) => {
    e.stopPropagation();
    const m = matriz(b.dataset.vermatriz);
    if (m) { UI.view = "gestion"; UI.gestTab = "mensual"; UI.gestMes = m.mes; UI.gestGrupo = m.grupo; render(); }
  });

  // Aprendizajes (Información general)
  bind("apAdd", () => {
    const inp = document.getElementById("apNuevo");
    const t = inp.value.trim();
    if (!t) { inp.focus(); return; }
    DB.aprendizajes.push({ id: "ap_" + Date.now(), fecha: HOY, texto: t, fuente: "Manual" });
    save(); render(); toast("Aprendizaje guardado ✓");
  });
  document.querySelectorAll("[data-apdel]").forEach((b) => b.onclick = () => {
    if (confirm("¿Eliminar este aprendizaje?")) { DB.aprendizajes = DB.aprendizajes.filter((a) => a.id !== b.dataset.apdel); save(); render(); }
  });
  document.querySelectorAll("[data-doccycle]").forEach((b) => b.onclick = () => {
    const d = DB.masterdoc.documentacion[Number(b.dataset.doccycle)];
    const orden = ["pendiente", "proceso", "entregado"];
    d.estado = orden[(orden.indexOf(d.estado) + 1) % orden.length];
    save(); render();
  });
  document.querySelectorAll("[data-docedit]").forEach((b) => b.onclick = () => openDocModal(Number(b.dataset.docedit)));

  // Chips de región: multi-selección
  document.querySelectorAll("[data-regchip]").forEach((b) => b.onclick = () => {
    const id = b.dataset.regchip;
    const i = UI.filtros.region.indexOf(id);
    if (i >= 0) UI.filtros.region.splice(i, 1); else UI.filtros.region.push(id);
    render();
  });
  document.querySelectorAll("[data-regclear]").forEach((b) => b.onclick = () => { UI.filtros.region = []; render(); });

  // Búsqueda con re-render conservando el foco y el cursor
  const busca = document.getElementById("fBusca");
  if (busca) busca.oninput = () => {
    UI.filtros.q = busca.value;
    render();
    const nb = document.getElementById("fBusca");
    if (nb) { nb.focus(); nb.setSelectionRange(nb.value.length, nb.value.length); }
  };
  bind("btnLimpiar", () => { Object.keys(UI.filtros).forEach((k) => (UI.filtros[k] = Array.isArray(UI.filtros[k]) ? [] : "")); UI.soloMias = false; render(); });
  bind("verPendientes", () => { UI.soloMias = true; UI.filtros.aprobacion = "pendiente"; UI.calView = "lista"; render(); });

  if (UI.mode === "interno" && UI.calView === "grid") wireDragDrop();
}

/* Arrastrar publicaciones entre días y hacia/desde el backlog — solo modo Interno */
function wireDragDrop() {
  let arrastrando = null;

  document.querySelectorAll('.chip[draggable="true"], .bchip[draggable="true"]').forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      arrastrando = card.dataset.pieza;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", arrastrando);
      requestAnimationFrame(() => card.classList.add("dragging"));
    });
    card.addEventListener("dragend", () => {
      arrastrando = null;
      document.querySelectorAll(".dragging").forEach((c) => c.classList.remove("dragging"));
      document.querySelectorAll(".drop-hover").forEach((c) => c.classList.remove("drop-hover"));
    });
  });

  // Zonas de destino: días del calendario (fecha) y el backlog (data-drop="" → quitar fecha)
  document.querySelectorAll("[data-drop]").forEach((zone) => {
    zone.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; zone.classList.add("drop-hover"); });
    zone.addEventListener("dragleave", (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("drop-hover"); });
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drop-hover");
      const id = e.dataTransfer.getData("text/plain") || arrastrando;
      const nuevaFecha = zone.dataset.drop; // "" para el backlog
      const p = DB.piezas.find((x) => x.id === id);
      if (!p || p.fecha === nuevaFecha) return;
      p.fecha = nuevaFecha;
      p.mes = nuevaFecha ? nuevaFecha.slice(0, 7) : "";
      save();
      render();
      toast(nuevaFecha ? `Movida al ${fechaCorta(nuevaFecha)} ✓` : "Enviada a 'Por asignar fecha' ✓");
    });
  });
}

function duplicarMes() {
  const dest = shiftMonth(UI.month, 1);
  const src = DB.piezas.filter((p) => p.mes === UI.month);
  if (!src.length) { alert("No hay publicaciones en este mes para duplicar."); return; }
  const hay = DB.piezas.some((p) => p.mes === dest);
  if (hay && !confirm(`${monthLabel(dest)} ya tiene publicaciones. ¿Agregar igual las ${src.length} de ${monthLabel(UI.month)}?`)) return;
  if (!hay && !confirm(`Copiar las ${src.length} publicaciones de ${monthLabel(UI.month)} a ${monthLabel(dest)}? Producción vuelve a "Briefing" y aprobación a "Pendiente".`)) return;
  src.forEach((p) => {
    const n = JSON.parse(JSON.stringify(p));
    n.fecha = `${dest}-${p.fecha.slice(8)}`; n.mes = dest; n.estado = "briefing"; n.aprobacion = "pendiente"; n.comentarioCliente = ""; n.link = "";
    n.id = "pz_" + Date.now() + "_" + Math.abs(hashStr(n.campanaId + n.fecha + n.canal + p.id));
    DB.piezas.push(n);
  });
  save(); UI.month = dest; render();
  toast(`${src.length} publicaciones copiadas a ${monthLabel(dest)} ✓`);
}

/* ---------- Nav global ---------- */
document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.onclick = () => { UI.view = b.dataset.view; render(); });
document.querySelectorAll("#modePill button").forEach((b) => b.onclick = () => { UI.mode = b.dataset.mode; UI.soloMias = false; render(); });
document.getElementById("modalClose").onclick = closeModal;
document.getElementById("overlay").onclick = (e) => { if (e.target.id === "overlay") closeModal(); };
document.getElementById("btnReset").onclick = () => { if (confirm("¿Restaurar los datos iniciales (kick off + matriz de Centroamérica)? Se perderán tus cambios en este navegador.")) { DB = JSON.parse(JSON.stringify(SEED)); save(); UI.month = SEED.meta.mesActual; render(); toast("Datos restaurados ✓"); } };

render();
