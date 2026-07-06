/* ============================================================
   Gestión Inside — Lógica (v1.1: Calendario de Publicación)
   Vanilla JS, sin build. Persiste en localStorage.
   ============================================================ */

const KEY = "gestion_inside_v2_4";
// Fecha real del día (la trazabilidad siempre registra la fecha verdadera)
const HOY = new Date().toISOString().slice(0, 10);
const MES_ACTUAL = HOY.slice(0, 7);
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
  pendGroupInside: "lista",   // lista | area | persona (la asignación interna es opcional)
  pendVer: "",                // "ver como": filtra pendientes a una persona
  pendQ: "",                  // búsqueda de texto en pendientes
  pendVencidos: false,        // mostrar solo vencidos
  pendChooser: null,          // {pendId, area} — elegir persona al soltar en un área
  pendVista: (() => { try { return localStorage.getItem("gi_pend_vista") || "equipos"; } catch (e) { return "equipos"; } })(), // equipos | tablero | tabla | calendario
  pendLado: "",               // filtro: "" | cliente | inside
  pendArea: "",               // filtro por área del equipo Inside
  pendCat: "",                // filtro por categoría de tarea
  pendSort: { col: "limite", dir: 1 },
  pendCalMes: MES_ACTUAL,     // mes de la vista calendario de pendientes
  pendCalHechos: false,       // ver completados en el calendario de pendientes
  pendHechoOpen: false,       // columna "Hecho" del tablero expandida
  quickAdd: null,             // {lado, titulo, estadoPreset, limitePreset} — panel de creación rápida
  qaLado: "cliente",          // último lado usado al crear rápido
  pendRealizados: false,      // sección "✅ Realizados" (pendientes completados)
  month: SEED.meta.mesActual,
  filtros: { region: [], campana: "", canal: "", formato: "", estado: "", aprobacion: "", responsable: "", q: "" },
  showBacklog: false,         // panel "Por asignar fecha" desplegable (oculto por defecto)
  soloMias: false,            // en modo cliente: solo lo que apruebo yo
  clienteId: "nico",          // "quién soy" cuando entro como cliente
  editId: null,
};

let DB = load();

function load() {
  let db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      db = JSON.parse(raw);
      // Migración suave: si faltan bloques nuevos, tomarlos de la semilla
      ["pendientes", "matrices", "masterdoc", "aprendizajes", "areas"].forEach((k) => { if (!db[k]) db[k] = JSON.parse(JSON.stringify(SEED[k])); });
    }
  } catch (e) {}
  if (!db) db = JSON.parse(JSON.stringify(SEED));
  // Migración: estado de flujo, prioridad y proyecto de cada pendiente
  db.pendientes.forEach((x) => {
    if (!x.prioridad) x.prioridad = "media";
    if (x.proyecto == null) x.proyecto = "";
    if (x.estado) return;
    if (x.hecho) x.estado = "hecho";
    else if (x.faltaInfo || x.bloqueadoPor) x.estado = "en_espera";
    else if (x.historial && x.historial.length > 1) x.estado = "en_curso";
    else x.estado = "por_hacer";
  });
  // Migración: áreas del equipo alineadas al cuadro de estatus (desde la semilla)
  db.areas = JSON.parse(JSON.stringify(SEED.areas));
  db.personas.forEach((p) => {
    const s = SEED.personas.find((sp) => sp.id === p.id);
    if (s && s.area) { p.area = s.area; p.rol = s.rol; }
  });
  SEED.personas.forEach((sp) => { if (!db.personas.some((p) => p.id === sp.id)) db.personas.push(JSON.parse(JSON.stringify(sp))); });
  return db;
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

// Estados de flujo de un pendiente (columnas del tablero)
const PEND_ESTADOS = {
  por_hacer: { nombre: "Por hacer", color: "#94A3B8" },
  en_curso: { nombre: "En curso", color: "#3B82F6" },
  en_espera: { nombre: "En espera", color: "#F59E0B" },
  hecho: { nombre: "Hecho", color: "#16A34A" },
};
const PEND_CATS = ["Accesos", "Editables", "Inputs", "Contenido", "Diseño", "Matrices", "Gestión", "Equipo", "Creatividad"];

// Prioridades (del cuadro de estatus)
const PRIORIDADES = {
  alta: { nombre: "🔴 Alta", color: "#DC2626" },
  media: { nombre: "🟠 Media", color: "#F59E0B" },
  baja: { nombre: "🟢 Baja", color: "#16A34A" },
};

// Semáforo de cumplimiento: en plazo / en riesgo / en retraso
function cumplimiento(x) {
  if (x.hecho) return "plazo";
  if (x.limite && x.limite < HOY) return "retraso";
  if ((x.limite && x.limite <= HOY_MAS_2) || x.bloqueadoPor || x.faltaInfo) return "riesgo";
  return "plazo";
}
const CUMPLIMIENTO = {
  plazo: { nombre: "En plazo", color: "#16A34A" },
  riesgo: { nombre: "En riesgo", color: "#F59E0B" },
  retraso: { nombre: "En retraso", color: "#DC2626" },
};

// Días sin movimiento (sin eventos nuevos en el historial)
function sinMovimiento(x) {
  if (x.hecho) return 0;
  const f = ultimaAct(x);
  if (!f) return 0;
  const n = Math.round((new Date(HOY) - new Date(f)) / 86400000);
  return n >= 4 ? n : 0;
}

const diasVencido = (x) => {
  if (!x.limite || x.hecho || x.limite >= HOY) return 0;
  return Math.round((new Date(HOY) - new Date(x.limite)) / 86400000);
};
const ultimaAct = (x) => (x.historial && x.historial.length ? x.historial[x.historial.length - 1].fecha : "");

// Desbloqueo en cascada al completar un pendiente que bloqueaba a otros
function desbloquearCascada(x) {
  let n = 0;
  DB.pendientes.forEach((y) => {
    if (y.bloqueadoPor === x.id && !y.hecho) {
      y.bloqueadoPor = "";
      (y.historial = y.historial || []).push({ fecha: HOY, texto: `🔓 Desbloqueado: se completó "${x.titulo.slice(0, 40)}"` });
      n++;
    }
  });
  return n;
}

// Cambiar el estado de flujo (sincroniza `hecho` y escribe la trazabilidad)
function setEstadoPend(x, estado) {
  if (x.estado === estado) return 0;
  const textos = { por_hacer: "🔁 Devuelto a Por hacer", en_curso: "▶️ En curso", en_espera: "⏸️ En espera", hecho: "✅ Completado" };
  const eraHecho = x.hecho;
  x.estado = estado;
  x.hecho = estado === "hecho";
  (x.historial = x.historial || []).push({ fecha: HOY, texto: eraHecho && estado !== "hecho" ? "🔄 Reabierto" : textos[estado] });
  return x.hecho ? desbloquearCascada(x) : 0;
}
const matriz = (id) => DB.matrices.find((m) => m.id === id);
const matrizLabel = (m) => `${m.grupo}${m.sub ? " · " + m.sub : ""} · ${m.region}`;
const pendDeMatriz = (mid) => DB.pendientes.filter((p) => p.matrizId === mid);
const DOC_ESTADOS = {
  pendiente: { nombre: "Pendiente", color: "#F59E0B" },
  proceso: { nombre: "En proceso", color: "#3B82F6" },
  entregado: { nombre: "Entregado", color: "#16A34A" },
};

// Pendientes automáticos derivados del calendario (siempre del mes en curso real)
function pendAuto() {
  const delMes = DB.piezas.filter((p) => p.mes === MES_ACTUAL || !p.fecha);
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
  const tabs = [["pend", "📋 Gestión general"], ["mensual", `🗂️ Gestión ${monthLabel(UI.gestMes)}`]];
  return `
    <div class="gest-tabs">${tabs.map(([id, l]) => `<button class="gest-tab ${UI.gestTab === id ? "active" : ""}" data-gtab="${id}">${l}</button>`).join("")}</div>
    ${UI.gestTab === "pend" ? gestDash() : gestMensual()}`;
}

/* ---- Dashboard de pendientes ---- */
function gestDash() {
  const auto = pendAuto();
  const man = DB.pendientes;
  const abiertosAll = man.filter((x) => !x.hecho);
  const card = (n, l, color, extra) => `<div class="kpi ${extra || ""}" ${extra ? `id="kpiVencidos" title="Clic para ver solo los vencidos"` : ""}><div class="n" style="color:${color}">${n}</div><div class="l">${l}</div></div>`;

  // Cumplimiento general (semáforo del cuadro de estatus)
  const cumpl = { plazo: 0, riesgo: 0, retraso: 0 };
  abiertosAll.forEach((x) => cumpl[cumplimiento(x)]++);

  // Contadores por área (+ "Respuesta del cliente" aparte, como en el Excel)
  const nRespCliente = abiertosAll.filter((x) => x.lado === "cliente").length;
  const nArea = (a) => abiertosAll.filter((x) => x.lado === "inside" && (persona(x.responsable) || {}).area === a).length;
  const areaStrip = `<div class="area-strip">
    <button class="area-chip cliente ${UI.pendLado === "cliente" && !UI.pendArea ? "on" : ""}" data-achip="cliente">✉️ Respuesta del cliente <b>${nRespCliente}</b></button>
    ${DB.areas.map((a) => `<button class="area-chip ${UI.pendArea === a ? "on" : ""}" data-achip="${esc(a)}">${AREA_ICONO[a] || "📁"} ${esc(a)} <b>${nArea(a)}</b></button>`).join("")}
  </div>`;

  // Bloqueados: causa cliente vs causa interna, con días de espera
  const bloqueados = abiertosAll.filter((x) => x.bloqueadoPor);
  const diasBloq = (x) => {
    const bl = DB.pendientes.find((y) => y.id === x.bloqueadoPor);
    const f = bl && bl.historial && bl.historial.length ? bl.historial[0].fecha : HOY;
    return Math.max(0, Math.round((new Date(HOY) - new Date(f)) / 86400000));
  };
  const bloqCard = (titulo, lista, clase) => `<div class="bloq-card ${clase}">
    <b>${titulo} (${lista.length})</b>
    ${lista.map((x) => { const bl = DB.pendientes.find((y) => y.id === x.bloqueadoPor); return `<div class="bloq-item" data-pedit="${x.id}">🔒 ${esc(x.titulo.slice(0, 42))} <span class="pg-rol">espera "${esc((bl || {}).titulo || "").slice(0, 30)}" hace ${diasBloq(x)} día${diasBloq(x) === 1 ? "" : "s"}</span></div>`; }).join("") || `<div class="pg-rol">Ninguno 🎉</div>`}
  </div>`;
  const bloqCli = bloqueados.filter((x) => { const bl = DB.pendientes.find((y) => y.id === x.bloqueadoPor); return bl && bl.lado === "cliente"; });
  const bloqInt = bloqueados.filter((x) => { const bl = DB.pendientes.find((y) => y.id === x.bloqueadoPor); return bl && bl.lado === "inside"; });

  // Carga de trabajo por responsable (solo interna, colapsable)
  const carga = inside().map((pe) => {
    const suyos = abiertosAll.filter((x) => x.responsable === pe.id);
    if (!suyos.length) return "";
    const c = { plazo: 0, riesgo: 0, retraso: 0 };
    suyos.forEach((x) => c[cumplimiento(x)]++);
    const seg = (k) => c[k] ? `<i style="flex:${c[k]};background:${CUMPLIMIENTO[k].color}" title="${CUMPLIMIENTO[k].nombre}: ${c[k]}"></i>` : "";
    return `<div class="carga-row"><span class="carga-nombre">${esc(pe.nombre.split(" ")[0])} <span class="pg-rol">${esc(pe.rol)}</span></span>
      <span class="carga-bar">${seg("retraso")}${seg("riesgo")}${seg("plazo")}</span><b>${suyos.length}</b></div>`;
  }).join("");
  const cargaBox = `<details class="carga-box"><summary>📊 Carga de trabajo por responsable (interno)</summary><div class="carga-list">${carga || `<div class="pg-rol">Sin tareas asignadas</div>`}</div></details>`;

  const alertas = auto.riesgo.length ? `
    <div class="riesgo-box">
      <b>🔴 En riesgo de no publicarse</b> — publican en ≤2 días y el cliente no ha aprobado:
      ${auto.riesgo.map((p) => `<button class="riesgo-item" data-openpieza="${p.id}">${esc(fechaCorta(p.fecha))} · ${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")} · ${esc(p.formato)} (${esc(nombre(p.aprobador))})</button>`).join("")}
    </div>` : "";

  // Contadores de filtros (respetan los demás filtros activos)
  const abiertosCon = (ignorar) => DB.pendientes.filter((x) => !x.hecho && pendVisible(x, ignorar));
  const nLado = (l) => abiertosCon("lado").filter((x) => x.lado === l).length;
  const nCat = (c) => abiertosCon("cat").filter((x) => x.area === c).length;
  const nF = nFiltrosActivos();

  const vistas = [["equipos", "👥 Equipos"], ["tablero", "🗂️ Tablero"], ["tabla", "☰ Tabla"], ["calendario", "📅 Calendario"]];
  const nAbiertosTot = DB.pendientes.filter((x) => !x.hecho && pendVisible(x)).length;
  const nHechosTot = DB.pendientes.filter((x) => x.hecho && pendVisible(x)).length;
  let cuerpo;
  if (UI.pendRealizados) cuerpo = pendRealizados();
  else if (UI.pendVista === "tablero") cuerpo = pendTablero();
  else if (UI.pendVista === "tabla") cuerpo = pendTabla();
  else if (UI.pendVista === "calendario") cuerpo = pendCalendario();
  else cuerpo = pendEquipos(auto);

  return `
  <div class="kpis">
    ${card(cumpl.plazo, "Tareas en plazo", "#16A34A")}
    ${card(cumpl.riesgo, "En riesgo", "#F59E0B")}
    ${card(cumpl.retraso, "En retraso", "#DC2626", "kpi-click" + (UI.pendVencidos ? " kpi-on" : ""))}
    ${card(auto.riesgo.length, "Piezas en riesgo (calendario)", "#DC2626")}
  </div>
  ${areaStrip}
  ${alertas}
  ${bloqueados.length ? `<div class="bloq-cols">${bloqCard("🏢 Bloqueados por el cliente", bloqCli, "cli")}${bloqCard("🏠 Bloqueados internos", bloqInt, "int")}</div>` : ""}
  ${cargaBox}
  <div class="toolbar" style="margin-bottom:14px">
    <div class="viewtoggle">${vistas.map(([id, l]) => `<button data-pvista="${id}" class="${!UI.pendRealizados && UI.pendVista === id ? "active" : ""}">${l}</button>`).join("")}</div>
    <div class="viewtoggle sm">
      <button data-phecho="0" class="${!UI.pendRealizados ? "active" : ""}">Abiertos (${nAbiertosTot})</button>
      <button data-phecho="1" class="${UI.pendRealizados ? "active" : ""}">✅ Realizados (${nHechosTot})</button>
    </div>
    <div class="viewtoggle sm">
      <button data-plado="" class="${!UI.pendLado ? "active" : ""}">Todos</button>
      <button data-plado="cliente" class="${UI.pendLado === "cliente" ? "active" : ""}">🏢 Payless (${nLado("cliente")})</button>
      <button data-plado="inside" class="${UI.pendLado === "inside" ? "active" : ""}">🏠 Inside (${nLado("inside")})</button>
    </div>
    <select id="pendCat">
      <option value="">🏷️ Todas las categorías</option>
      ${PEND_CATS.map((c) => `<option value="${c}" ${UI.pendCat === c ? "selected" : ""} ${!nCat(c) && UI.pendCat !== c ? "disabled" : ""}>${c} (${nCat(c)})</option>`).join("")}
    </select>
    <select id="pendVer" title="Filtrar a una sola persona">
      <option value="">👥 Ver a todos</option>
      <optgroup label="Inside">${inside().map((pe) => `<option value="${pe.id}" ${UI.pendVer === pe.id ? "selected" : ""}>${esc(pe.nombre)} · ${esc(pe.rol)}</option>`).join("")}</optgroup>
      <optgroup label="Cliente">${clientes().map((pe) => `<option value="${pe.id}" ${UI.pendVer === pe.id ? "selected" : ""}>${esc(pe.nombre)} · ${esc(pe.rol)}</option>`).join("")}</optgroup>
    </select>
    <input type="search" id="pendQ" placeholder="🔍 Buscar…" value="${esc(UI.pendQ)}" style="width:150px"/>
    ${nF ? `<button class="btn sm ghost" id="pendLimpiar">✕ Limpiar (${nF})</button>` : ""}
    <div class="spacer"></div>
    <button class="btn primary" id="btnQuickAdd">＋ Agregar pendiente</button>
    <button class="btn" id="btnCopiarEstatus" title="Arma el estatus (recibido/pendiente) listo para pegar en correo o WhatsApp">📋 Copiar estatus</button>
  </div>
  ${quickAddPanel()}
  ${cuerpo}`;
}

/* Sección "✅ Realizados": los completados, agrupados por fecha de cierre */
function fechaCompletado(x) {
  const evs = (x.historial || []).filter((h) => h.texto.includes("✅ Completado"));
  return evs.length ? evs[evs.length - 1].fecha : ultimaAct(x) || HOY;
}
function pendRealizados() {
  const hechos = DB.pendientes.filter((x) => x.hecho && pendVisible(x));
  if (!hechos.length) return `<div class="calwrap"><div class="empty"><div class="big">✅</div>
    <p>Aún no hay pendientes realizados${nFiltrosActivos() ? " con estos filtros" : ""}.</p>
    <p class="pm">Cuando marques el check de un pendiente, aparecerá aquí con su fecha de cierre.</p></div></div>`;
  const porFecha = {};
  hechos.forEach((x) => { const f = fechaCompletado(x); (porFecha[f] = porFecha[f] || []).push(x); });
  const dias = Object.keys(porFecha).sort((a, b) => b.localeCompare(a));
  return `
  <div class="pill-note">✅ <b>Pendientes realizados.</b> Desmarca el check de cualquiera para reabrirlo (vuelve a "Abiertos" con su evento 🔄 en el historial).</div>
  <div class="pend-col" style="max-width:860px">
    ${dias.map((f) => `
      <div class="pend-done-sep">✔️ ${esc(fechaCorta(f))} · ${porFecha[f].length} completado${porFecha[f].length > 1 ? "s" : ""}</div>
      ${porFecha[f].map((x) => manCard(x, false, true)).join("")}
    `).join("")}
  </div>`;
}

/* Vista Equipos (la distribución por columnas/áreas de siempre) */
function pendEquipos(auto) {
  const colC = !UI.pendLado || UI.pendLado === "cliente" ? pendCol("cliente", "🏢 Debe el cliente (Payless)", auto) : "";
  const colI = !UI.pendLado || UI.pendLado === "inside" ? pendCol("inside", "🏠 Debe Inside", auto) : "";
  return `<div class="pend-cols ${UI.pendLado ? "una" : ""}">${colC}${colI}</div>`;
}

/* Panel de creación rápida (popover global) */
function quickAddPanel() {
  const qa = UI.quickAdd;
  if (!qa) return "";
  const gente = qa.lado === "inside" ? inside() : clientes();
  const generico = qa.lado === "inside" ? "equipo" : "payless";
  const respSel = qa.resp && gente.some((p) => p.id === qa.resp) ? qa.resp : (gente.some((p) => p.id === generico) ? generico : gente[0].id);
  const rol = (persona(respSel) || {}).rol || "";
  return `<div class="qpanel">
    <div class="qp-row">
      <span class="viewtoggle"><button data-qalado="cliente" class="${qa.lado === "cliente" ? "active" : ""}">🏢 PAYLESS</button><button data-qalado="inside" class="${qa.lado === "inside" ? "active" : ""}">🏠 INSIDE</button></span>
      <select id="qpResp">${gente.map((pe) => `<option value="${pe.id}" ${respSel === pe.id ? "selected" : ""}>${esc(pe.nombre)} — ${esc(pe.rol)}</option>`).join("")}</select>
      <span class="pg-rol" id="qpRol">${esc(rol)}</span>
    </div>
    <div class="qp-row">
      <input type="text" id="qpTitulo" placeholder="¿Qué falta? (la tarea)" value="${esc(qa.titulo || "")}" style="flex:1"/>
      <select id="qpPrio">${Object.entries(PRIORIDADES).map(([k, v]) => `<option value="${k}" ${k === "media" ? "selected" : ""}>${v.nombre}</option>`).join("")}</select>
      <select id="qpCat">${PEND_CATS.map((c) => `<option ${c === (qa.cat || "Gestión") ? "selected" : ""}>${c}</option>`).join("")}</select>
      <input type="date" id="qpLim" value="${esc(qa.limitePreset || "")}" title="Límite (opcional)"/>
      <button class="btn primary" id="qpCrear">Crear</button>
      <button class="btn ghost sm" id="qpMas">Más opciones…</button>
      <button class="ico-btn" id="qpCerrar" title="Cerrar">✕</button>
    </div>
    ${qa.estadoPreset ? `<div class="pg-rol">Se creará en la columna "${PEND_ESTADOS[qa.estadoPreset].nombre}"</div>` : ""}
  </div>`;
}

/* Filtros del dashboard de pendientes */
function pendVisible(x, ignorar) {
  if (ignorar !== "lado" && UI.pendLado && x.lado !== UI.pendLado) return false;
  if (UI.pendArea && !(x.lado === "inside" && (persona(x.responsable) || {}).area === UI.pendArea)) return false;
  if (ignorar !== "cat" && UI.pendCat && x.area !== UI.pendCat) return false;
  if (UI.pendVer && x.responsable !== UI.pendVer) return false;
  if (UI.pendVencidos && !(x.limite && x.limite < HOY && !x.hecho)) return false;
  if (UI.pendQ) {
    const q = UI.pendQ.toLowerCase();
    const texto = [x.titulo, x.notas, x.faltaInfo, x.area, nombre(x.responsable)].join(" ").toLowerCase();
    if (!texto.includes(q)) return false;
  }
  return true;
}
const nFiltrosActivos = () => [UI.pendLado, UI.pendCat, UI.pendVer, UI.pendQ, UI.pendVencidos, UI.pendArea].filter(Boolean).length;
/* Orden: vencidos primero, luego por fecha límite, sin límite al final */
function ordenLimite(a, b) {
  return (a.limite || "9999-12-31").localeCompare(b.limite || "9999-12-31");
}

/* Genera el texto del estatus para correo / WhatsApp */
function textoEstatus() {
  const auto = pendAuto();
  const abiertosC = DB.pendientes.filter((x) => x.lado === "cliente" && !x.hecho).sort(ordenLimite);
  const abiertosI = DB.pendientes.filter((x) => x.lado === "inside" && !x.hecho).sort(ordenLimite);
  const hechos = DB.pendientes.filter((x) => x.hecho);
  const linea = (x) => `• ${x.prioridad === "alta" ? "🔴 " : ""}${x.proyecto ? `[${x.proyecto}] ` : ""}${x.titulo} — ${nombre(x.responsable)}${x.limite ? ` (límite ${fechaCorta(x.limite)})` : ""}${x.faltaInfo ? ` ⛔ ${x.faltaInfo}` : ""}`;
  let t = `ESTATUS PAYLESS · ${fechaCorta(HOY)}\n`;
  t += `\n🏢 PENDIENTE DE PAYLESS (${abiertosC.length}):\n${abiertosC.map(linea).join("\n") || "• Nada pendiente"}\n`;
  const aprob = Object.entries(auto.porAprobador);
  if (aprob.length) t += `\n✋ APROBACIONES PENDIENTES:\n${aprob.map(([ap, ps]) => `• ${nombre(ap)}: ${ps.length} publicaci${ps.length === 1 ? "ón" : "ones"}`).join("\n")}\n`;
  t += `\n🏠 EN CURSO POR INSIDE (${abiertosI.length}):\n${abiertosI.map(linea).join("\n") || "• Nada pendiente"}\n`;
  if (hechos.length) t += `\n✅ COMPLETADOS: ${hechos.length}\n${hechos.slice(-5).map((x) => `• ${x.titulo}`).join("\n")}\n`;
  return t;
}
function copiarEstatus() {
  const t = textoEstatus();
  const listo = () => toast("Estatus copiado — pégalo en correo o WhatsApp ✓");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(listo).catch(() => mostrarEstatus(t));
  } else mostrarEstatus(t);
}
function mostrarEstatus(t) {
  document.getElementById("modalTitle").textContent = "Estatus para copiar";
  document.getElementById("modalBody").innerHTML = `<textarea id="estatusTxt" rows="16" style="width:100%;font-family:ui-monospace,monospace;font-size:12.5px">${esc(t)}</textarea>`;
  document.getElementById("modalFooter").innerHTML = `<button class="btn" id="mCancel">Cerrar</button>`;
  document.getElementById("overlay").classList.add("open");
  document.getElementById("mCancel").onclick = closeModal;
  const ta = document.getElementById("estatusTxt");
  ta.focus(); ta.select();
}

/* Tarjeta de pendiente manual, con trazabilidad visible */
function manCard(x, draggable, showLado) {
  const m = x.matrizId ? matriz(x.matrizId) : null;
  const ultimo = x.historial && x.historial.length ? x.historial[x.historial.length - 1] : null;
  const dv = diasVencido(x);
  const cu = cumplimiento(x);
  const sm = sinMovimiento(x);
  const pr = PRIORIDADES[x.prioridad || "media"];
  return `
    <div class="pend-card prio-${x.prioridad || "media"} ${x.hecho ? "done" : ""}" ${draggable && !x.hecho ? `draggable="true" data-pmove="${x.id}"` : ""}>
      <label class="pend-check"><input type="checkbox" data-pdone="${x.id}" ${x.hecho ? "checked" : ""}/></label>
      <div class="pend-body">
        <div class="pt"><span class="cumpl-dot" style="background:${CUMPLIMIENTO[cu].color}" title="${CUMPLIMIENTO[cu].nombre}"></span>${showLado ? `<span class="lado-tag ${x.lado}">${x.lado === "cliente" ? "🏢" : "🏠"}</span> ` : ""}${esc(x.titulo)}${x.proyecto ? ` <span class="proy-tag">${esc(x.proyecto)}</span>` : ""}</div>
        <div class="pm">${esc(nombre(x.responsable))} · ${esc((persona(x.responsable) || {}).rol || "")} · ${esc(x.area)}${x.limite ? ` · <span class="${!x.hecho && x.limite < HOY ? "late-cell" : ""}">límite ${esc(fechaCorta(x.limite))}</span>` : ""}${dv ? ` · <span class="late-cell">⏰ hace ${dv} día${dv > 1 ? "s" : ""}</span>` : ""}${sm ? ` · <span class="sinmov" title="Sin ningún movimiento en el historial">💤 sin movimiento ${sm} días</span>` : ""}${x.link ? ` · <a class="lk" href="${esc(x.link)}" target="_blank" rel="noopener">link ↗</a>` : ""}</div>
        ${x.faltaInfo && !x.hecho ? `<div class="falta-chip">⛔ Falta: ${esc(x.faltaInfo)}</div>` : ""}
        ${x.bloqueadoPor && !x.hecho ? (() => { const bl = DB.pendientes.find((y) => y.id === x.bloqueadoPor); return bl && !bl.hecho ? `<div class="falta-chip">🔒 Bloqueado por: ${esc(bl.titulo.slice(0, 45))}</div>` : ""; })() : ""}
        ${m ? `<div class="mx-chip" data-vermatriz="${m.id}">🗂️ ${esc(matrizLabel(m))}</div>` : ""}
        ${ultimo ? `<div class="pn hist">${esc(fechaCorta(ultimo.fecha))} · ${esc(ultimo.texto)}${x.historial.length > 1 ? ` <span class="hist-more">+${x.historial.length - 1} más</span>` : ""}</div>` : (x.notas ? `<div class="pn">${esc(x.notas)}</div>` : "")}
      </div>
      <span class="pend-acc"><button class="ico-btn" data-pedit="${x.id}" title="Ver historial / editar">✏️</button><button class="ico-btn danger" data-pdel="${x.id}" title="Eliminar">🗑️</button></span>
    </div>`;
}

function autoCardsDe(lado, auto, filtroPersona) {
  const mesLbl = monthLabel(MES_ACTUAL).toLowerCase();
  if (lado === "cliente") {
    return Object.entries(auto.porAprobador)
      .filter(([ap]) => !filtroPersona || ap === filtroPersona)
      .map(([ap, ps]) => `<div class="pend-card auto" data-verapro="${ap}">
        <div class="pt">✋ Aprobar ${ps.length} publicaci${ps.length === 1 ? "ón" : "ones"} <span class="auto-tag">auto</span></div>
        <div class="pm">${esc(nombre(ap))} · del calendario de ${esc(mesLbl)} · clic para verlas</div>
      </div>`).join("");
  }
  return auto.ajustes
    .filter((p) => !filtroPersona || p.responsable === filtroPersona)
    .map((p) => `<div class="pend-card auto" data-openpieza="${p.id}">
      <div class="pt">🛠️ Aplicar ajustes: ${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")} · ${esc(p.formato)} <span class="auto-tag">auto</span></div>
      <div class="pm">${esc(nombre(p.responsable))} · calendario de ${esc(mesLbl)} · ${p.comentarioCliente ? `"${esc(p.comentarioCliente)}"` : "sin comentario del cliente"}</div>
    </div>`).join("");
}

/* Mini-menú al soltar en un área con varias personas: "¿a quién?" */
function chooserHTML(area) {
  if (!UI.pendChooser || UI.pendChooser.area !== area) return "";
  const x = DB.pendientes.find((y) => y.id === UI.pendChooser.pendId);
  if (!x) return "";
  return `<div class="chooser">¿A quién de ${esc(area)} va "<b>${esc(x.titulo.slice(0, 40))}</b>"?
    ${inside().filter((pe) => pe.area === area).map((pe) => `<button class="btn sm" data-eligep="${pe.id}">${esc(pe.nombre.split(" ")[0])}</button>`).join("")}
    <button class="btn sm ghost" data-eligep="">Cancelar</button></div>`;
}

function pendCol(lado, titulo, auto) {
  const man = DB.pendientes.filter((x) => x.lado === lado);
  const abiertos = man.filter((x) => !x.hecho && pendVisible(x)).sort(ordenLimite);
  const hechos = man.filter((x) => x.hecho && pendVisible(x));
  const nAuto = lado === "cliente" ? Object.keys(auto.porAprobador).length : auto.ajustes.length;
  const modo = lado === "cliente" ? UI.pendGroupCliente : UI.pendGroupInside;
  const modos = lado === "cliente" ? [["persona", "Por persona"], ["lista", "Lista"]] : [["area", "Por área"], ["persona", "Por persona"], ["lista", "Lista"]];
  const filtrando = UI.pendVer || UI.pendQ || UI.pendVencidos;

  let cuerpo = "";
  if (modo === "lista") {
    cuerpo = autoCardsDe(lado, auto, UI.pendVer) + abiertos.map((x) => manCard(x, false)).join("");
  } else if (modo === "persona") {
    // TODAS las personas del lado son zona de drop (las vacías, plegadas)
    const gente = (lado === "cliente" ? clientes() : inside());
    cuerpo = gente.map((pe) => {
      if (UI.pendVer && pe.id !== UI.pendVer) return "";
      const suyos = abiertos.filter((x) => x.responsable === pe.id);
      const autos = autoCardsDe(lado, auto, pe.id);
      const vacio = !suyos.length && !autos;
      if (vacio && filtrando) return "";
      return `<div class="pend-grupo ${vacio ? "vacio" : ""}" data-asignap="${pe.id}">
        <div class="pg-head">👤 <b>${esc(pe.nombre)}</b> <span class="pg-rol">${esc(pe.rol)}</span> <span class="pg-cnt">${suyos.length + (autos ? 1 : 0)}</span></div>
        ${autos}${suyos.map((x) => manCard(x, true)).join("")}
        ${vacio ? `<div class="pg-empty">Libre — arrastra aquí para asignarle</div>` : ""}
      </div>`;
    }).join("");
  } else {
    // Por área (solo Inside): TODAS las áreas visibles para distribuir
    cuerpo = DB.areas.map((area) => {
      const equipo = inside().filter((pe) => pe.area === area);
      const ids = equipo.map((pe) => pe.id);
      const suyos = abiertos.filter((x) => ids.includes(x.responsable));
      const autos = auto.ajustes.filter((p) => ids.includes(p.responsable) && (!UI.pendVer || p.responsable === UI.pendVer));
      const vacio = !suyos.length && !autos.length;
      if (vacio && filtrando) return "";
      return `<div class="pend-grupo ${vacio ? "vacio" : ""}" data-asignarea="${esc(area)}">
        <div class="pg-head">${AREA_ICONO[area] || "📁"} <b>${esc(area)}</b> <span class="pg-rol">${equipo.map((pe) => esc(pe.nombre.split(" ")[0] + " (" + pe.rol + ")")).join(" · ")}</span> <span class="pg-cnt">${suyos.length + autos.length}</span></div>
        ${chooserHTML(area)}
        ${autoCardsDe("inside", { ajustes: autos, porAprobador: {} })}${suyos.map((x) => manCard(x, true)).join("")}
        ${vacio ? `<div class="pg-empty">Arrastra aquí un pendiente para ${esc(area)}</div>` : ""}
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
    ${hechos.length ? `<button class="btn sm ghost" data-phecho="1" style="width:100%;margin-top:6px">✅ Ver ${hechos.length} realizado${hechos.length > 1 ? "s" : ""} →</button>` : ""}
  </div>`;
}
const AREA_ICONO = { "Gestión": "💼", "Contenidos": "💡", "Diseño": "🎨", "Edición": "🎬", "Medios": "📈", "Community": "💬" };

/* ---- Vista Tablero (kanban por estado de flujo) ---- */
function pendTablero() {
  const visibles = DB.pendientes.filter((x) => pendVisible(x));
  const cols = Object.entries(PEND_ESTADOS).map(([est, cfg]) => {
    let lista = visibles.filter((x) => (x.estado || "por_hacer") === est).sort(ordenLimite);
    const n = lista.length;
    let inner;
    if (est === "hecho") {
      inner = `<button class="btn sm ghost" id="kbVerHechos" style="width:100%">Ver ${n} realizado${n === 1 ? "" : "s"} →</button>
        <div class="pg-empty" style="margin-top:8px">Suelta aquí una tarjeta para completarla</div>`;
    } else {
      inner = lista.map((x) => manCard(x, true, true)).join("") ||
        `<div class="pg-empty">Nada aquí — arrastra una tarjeta o crea una con ＋</div>`;
    }
    return `<div class="kb-col" data-estadocol="${est}">
      <div class="kb-head"><span class="dot" style="background:${cfg.color}"></span> <b>${cfg.nombre}</b> <span class="pg-cnt">${n}</span>
        <button class="ico-btn" data-qcol="${est}" title="Crear aquí">＋</button></div>
      ${inner}
    </div>`;
  }).join("");
  return `<div class="kb-cols">${cols}</div>`;
}

/* ---- Vista Tabla (filas/columnas, orden por encabezado, quick-add) ---- */
function pendTabla() {
  // Los completados viven en "✅ Realizados"
  const visibles = DB.pendientes.filter((x) => !x.hecho && pendVisible(x));
  const s = UI.pendSort;
  const val = (x) => {
    switch (s.col) {
      case "titulo": return x.titulo.toLowerCase();
      case "proy": return (x.proyecto || "").toLowerCase();
      case "prio": return ["alta", "media", "baja"].indexOf(x.prioridad || "media");
      case "lado": return x.lado;
      case "resp": return nombre(x.responsable).toLowerCase();
      case "cat": return x.area;
      case "estado": return Object.keys(PEND_ESTADOS).indexOf(x.estado || "por_hacer");
      case "act": return ultimaAct(x) || "0000";
      default: return x.limite || "9999-12-31";
    }
  };
  const lista = visibles.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * s.dir);
  const th = (col, label) => `<th data-psort="${col}" class="sortable">${label}${s.col === col ? (s.dir === 1 ? " ▲" : " ▼") : ""}</th>`;
  const opciones = (lado, sel) => (lado === "inside" ? inside() : clientes()).map((pe) => `<option value="${pe.id}" ${sel === pe.id ? "selected" : ""}>${esc(pe.nombre)} — ${esc(pe.rol)}</option>`).join("");
  const filas = lista.map((x) => {
    const e = PEND_ESTADOS[x.estado || "por_hacer"];
    const dv = diasVencido(x);
    const u = x.historial && x.historial.length ? x.historial[x.historial.length - 1] : null;
    const prw = PRIORIDADES[x.prioridad || "media"];
    return `<tr class="${x.hecho ? "fila-hecha" : ""}">
      <td><input type="checkbox" data-pdone="${x.id}" ${x.hecho ? "checked" : ""}/></td>
      <td><input type="text" data-iproy="${x.id}" value="${esc(x.proyecto || "")}" placeholder="—" style="width:110px"/></td>
      <td class="tt" data-pedit="${x.id}"><b>${esc(x.titulo)}</b>
        ${x.faltaInfo && !x.hecho ? `<div class="paises" style="color:#B91C1C">⛔ ${esc(x.faltaInfo)}</div>` : ""}
        ${dv ? `<div class="paises" style="color:#B91C1C">⏰ Vencido hace ${dv} día${dv > 1 ? "s" : ""}</div>` : ""}</td>
      <td><select data-ilado="${x.id}"><option value="cliente" ${x.lado === "cliente" ? "selected" : ""}>🏢 Payless</option><option value="inside" ${x.lado === "inside" ? "selected" : ""}>🏠 Inside</option></select></td>
      <td><select data-iresp="${x.id}">${opciones(x.lado, x.responsable)}</select></td>
      <td><select data-iprio="${x.id}" style="color:${prw.color};font-weight:700">${Object.entries(PRIORIDADES).map(([k, v]) => `<option value="${k}" ${(x.prioridad || "media") === k ? "selected" : ""}>${v.nombre}</option>`).join("")}</select></td>
      <td><select data-iestado="${x.id}" style="color:${e.color};font-weight:700">${Object.entries(PEND_ESTADOS).map(([k, v]) => `<option value="${k}" ${(x.estado || "por_hacer") === k ? "selected" : ""}>${v.nombre}</option>`).join("")}</select></td>
      <td><input type="date" data-ilim="${x.id}" value="${esc(x.limite)}" class="${dv ? "late-cell" : ""}"/></td>
      <td><select data-icat="${x.id}">${PEND_CATS.map((c) => `<option ${x.area === c ? "selected" : ""}>${c}</option>`).join("")}</select></td>
      <td class="paises">${u ? `${esc(fechaCorta(u.fecha))} · ${esc(u.texto.slice(0, 26))}` : "—"}</td>
      <td>${x.link ? `<a class="lk" href="${esc(x.link)}" target="_blank" rel="noopener">Abrir ↗</a>` : `<span class="nolink">—</span>`}</td>
      <td class="acc"><button class="ico-btn" data-pedit="${x.id}">✏️</button><button class="ico-btn danger" data-pdel="${x.id}">🗑️</button></td>
    </tr>`;
  }).join("");
  const qaGente = UI.qaLado === "inside" ? inside() : clientes();
  return `<div style="overflow-x:auto"><table class="tbl pend-tabla"><thead><tr>
      <th></th>${th("proy", "Proyecto")}${th("titulo", "Tarea")}${th("lado", "Lado")}${th("resp", "Responsable")}${th("prio", "Prioridad")}${th("estado", "Estado")}${th("limite", "Límite")}${th("cat", "Categoría")}${th("act", "Última actividad")}<th>Link</th><th></th>
    </tr></thead><tbody>
    ${filas || `<tr><td colspan="12"><div class="backlog-empty">Sin resultados con estos filtros — <button class="link-btn" id="pendLimpiar2">✕ limpiar filtros</button></div></td></tr>`}
    <tr class="qadd"><td>＋</td><td></td>
      <td><input type="text" id="qaTitulo" placeholder="＋ Escribe el pendiente y pulsa Enter…" style="width:100%"/></td>
      <td><select id="qaLadoSel"><option value="cliente" ${UI.qaLado === "cliente" ? "selected" : ""}>🏢 Payless</option><option value="inside" ${UI.qaLado === "inside" ? "selected" : ""}>🏠 Inside</option></select></td>
      <td><select id="qaRespSel">${qaGente.map((pe) => `<option value="${pe.id}" ${pe.id === (UI.qaLado === "inside" ? "equipo" : "payless") ? "selected" : ""}>${esc(pe.nombre)} — ${esc(pe.rol)}</option>`).join("")}</select></td>
      <td colspan="8" class="paises">Enter crea · prioridad media · categoría Gestión · sin límite</td>
    </tr>
  </tbody></table></div>`;
}

/* ---- Vista Calendario de pendientes (por fecha límite) ---- */
function pendCalendario() {
  const [y, m] = UI.pendCalMes.split("-").map(Number);
  const startDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dimPrev = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const visibles = DB.pendientes.filter((x) => pendVisible(x) && (UI.pendCalHechos || !x.hecho));
  const byDay = {};
  visibles.filter((x) => x.limite).forEach((x) => { (byDay[x.limite] = byDay[x.limite] || []).push(x); });
  const sinLimite = visibles.filter((x) => !x.limite && !x.hecho);

  const pchip = (x) => {
    const dv = diasVencido(x);
    return `<span class="pchip ${x.lado} ${x.hecho ? "hecha" : ""} ${dv ? "vencida" : ""}" draggable="true" data-pcal="${x.id}" data-pedit="${x.id}"
      title="${esc(x.titulo)} · ${esc(nombre(x.responsable))}${dv ? ` · ⏰ vencido hace ${dv} día${dv > 1 ? "s" : ""}` : ""}">
      ${x.faltaInfo ? "⛔" : ""}${x.bloqueadoPor ? "🔒" : ""}${esc(nombre(x.responsable).split(" ")[0])} · ${esc(x.titulo.slice(0, 26))}</span>`;
  };

  const dow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let cells = "";
  const total = Math.ceil((startDow + dim) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const di = i - startDow + 1;
    let cls = "cal-cell", label, dateStr = "", other = false;
    if (di < 1) { other = true; label = dimPrev + di; }
    else if (di > dim) { other = true; label = di - dim; }
    else { label = di; dateStr = `${UI.pendCalMes}-${String(di).padStart(2, "0")}`; }
    if (other) cls += " other";
    if (dateStr === HOY) cls += " today";
    const del = byDay[dateStr] || [];
    const vencidosDia = dateStr && dateStr < HOY && del.some((x) => !x.hecho);
    const add = !other ? `<button class="addday" data-qdia="${dateStr}" title="Crear pendiente con este límite">＋</button>` : "";
    cells += `<div class="${cls}" ${!other ? `data-pdrop="${dateStr}"` : ""}>${add}<div class="dnum ${vencidosDia ? "late-cell" : ""}">${label}</div>${del.map(pchip).join("")}</div>`;
  }
  const hayEnMes = Object.keys(byDay).some((f) => f.startsWith(UI.pendCalMes));
  return `
  <div class="monthnav" style="margin-bottom:12px">
    <button id="pcPrev">‹</button><span class="m">${monthLabel(UI.pendCalMes)}</span><button id="pcNext">›</button>
    <label class="chkmine" style="margin-left:12px"><input type="checkbox" id="pcHechos" ${UI.pendCalHechos ? "checked" : ""}/> Ver completados</label>
  </div>
  <div class="cal-layout">
    <div class="calwrap">
      <div class="cal-head">${dow.map((d) => `<div>${d}</div>`).join("")}</div>
      <div class="cal-grid">${cells}</div>
      ${!hayEnMes ? `<div class="empty" style="padding:20px">Sin fechas límite en ${monthLabel(UI.pendCalMes).toLowerCase()} — los pendientes sin fecha están en la bandeja →</div>` : ""}
    </div>
    <aside class="backlog" data-pdrop="">
      <div class="backlog-head"><span>⏳ Sin fecha límite <span class="cnt">${sinLimite.length}</span></span></div>
      <p class="backlog-hint">Arrastra a un día para ponerle límite. Suelta aquí para quitárselo.</p>
      <div class="backlog-list">${sinLimite.map(pchip).join("") || `<div class="backlog-empty">Todo tiene fecha 🎉</div>`}</div>
    </aside>
  </div>`;
}

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
  // El grupo del cliente activo va primero y resaltado
  const ordenados = [...clientes()].sort((a, b) => (a.id === UI.clienteId ? -1 : 0) - (b.id === UI.clienteId ? -1 : 0));
  const visibles = UI.soloMias ? ordenados.filter((pe) => pe.id === UI.clienteId) : ordenados;
  const ultimoEv = (x) => x.historial && x.historial.length ? x.historial[x.historial.length - 1] : null;
  const porPersona = visibles.map((pe) => {
    const suyos = man.filter((x) => x.responsable === pe.id);
    if (!suyos.length) return "";
    const esYo = pe.id === UI.clienteId;
    return `<div class="pend-grupo ${esYo ? "yo" : ""}">
      <div class="pg-head">👤 <b>${esc(pe.nombre)}</b> ${esYo ? '<span class="auto-tag">tú</span>' : ""} <span class="pg-rol">${esc(pe.rol)}</span> <span class="pg-cnt">${suyos.length}</span></div>
      ${suyos.map((x) => {
        const u = ultimoEv(x);
        return `
      <div class="pend-card">
        <div class="pend-body">
          <div class="pt">${esc(x.titulo)}</div>
          <div class="pm">${esc(x.area)}${x.limite ? ` · <span class="${x.limite < HOY ? "late-cell" : ""}">límite ${esc(fechaCorta(x.limite))}</span>` : ""}</div>
          ${x.faltaInfo ? `<div class="falta-chip">⛔ Falta: ${esc(x.faltaInfo)}</div>` : ""}
          ${u ? `<div class="pn hist">${esc(fechaCorta(u.fecha))} · ${esc(u.texto)}</div>` : (x.notas ? `<div class="pn">${esc(x.notas)}</div>` : "")}
        </div>
        <span class="pend-acc">${esYo ? `<button class="btn sm" data-penvio="${x.id}" title="Avísale a Inside que ya lo enviaste">📬 Ya lo envié</button>` : ""}</span>
      </div>`;
      }).join("")}
    </div>`;
  }).join("");
  return `
  <div class="pill-note cli-note">👁️ <b>Modo Cliente</b> — estás como <b>${esc(nombre(UI.clienteId))}</b>.
    Esta lista es lo que Inside necesita de Payless, organizada por responsable.
    <select id="quienSoy" style="margin-left:8px">${clientes().map((p) => `<option value="${p.id}" ${UI.clienteId === p.id ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select>
    <label class="chkmine" style="margin-left:10px"><input type="checkbox" id="soloMias" ${UI.soloMias ? "checked" : ""}/> Solo lo mío</label>
  </div>
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
function openPendModal(id, ladoPreset, matrizPreset, extra) {
  extra = extra || {};
  const p = id ? DB.pendientes.find((x) => x.id === id)
    : { id: null, lado: ladoPreset || "cliente", titulo: extra.titulo || "", responsable: extra.responsable || (ladoPreset === "inside" ? "equipo" : "payless"), area: extra.area || "Gestión", limite: extra.limite || "", link: "", notas: "", hecho: false, historial: [], faltaInfo: "", matrizId: matrizPreset || "", bloqueadoPor: "", estado: extra.estado || "por_hacer" };
  if (!p) return;
  if (!p.historial) p.historial = [];
  // El historial se edita en borrador: si cancelas, no queda rastro
  const hist = p.historial.slice();
  const personasDelLado = p.lado === "cliente" ? clientes() : inside();
  // Matrices del mes en gestión + SIEMPRE la vinculada actual (aunque sea de otro mes)
  const mxOpciones = DB.matrices.filter((m) => m.mes === UI.gestMes);
  if (p.matrizId && !mxOpciones.some((m) => m.id === p.matrizId)) {
    const ligada = matriz(p.matrizId);
    if (ligada) mxOpciones.unshift(ligada);
  }
  const bloqueables = DB.pendientes.filter((y) => !y.hecho && y.id !== p.id);
  document.getElementById("modalTitle").textContent = id ? "Pendiente · trazabilidad" : "Nuevo pendiente";
  document.getElementById("modalBody").innerHTML = `
    <div><label class="fld">¿Qué falta?</label><input type="text" id="pTitulo" value="${esc(p.titulo)}" placeholder="Ej: enviar editables de..." style="width:100%"/></div>
    <div class="row2">
      <div><label class="fld">Lado</label><select id="pLado" style="width:100%"><option value="cliente" ${p.lado === "cliente" ? "selected" : ""}>Debe el cliente</option><option value="inside" ${p.lado === "inside" ? "selected" : ""}>Debe Inside</option></select></div>
      <div><label class="fld">Responsable</label><select id="pResp" style="width:100%">${personasDelLado.map((pe) => `<option value="${pe.id}" ${p.responsable === pe.id ? "selected" : ""}>${esc(pe.nombre)}${pe.lado === "agencia" ? " · " + esc(pe.area) : ""}</option>`).join("")}</select></div>
    </div>
    <div class="row2">
      <div><label class="fld">Categoría</label><select id="pArea" style="width:100%">${PEND_CATS.map((a) => `<option ${p.area === a ? "selected" : ""}>${a}</option>`).join("")}</select></div>
      <div><label class="fld">Fecha límite (opcional)</label><input type="date" id="pLimite" value="${esc(p.limite)}" style="width:100%"/></div>
    </div>
    <div class="row2">
      <div><label class="fld">Estado de flujo</label><select id="pEstado" style="width:100%">${Object.entries(PEND_ESTADOS).map(([k, v]) => `<option value="${k}" ${(p.estado || "por_hacer") === k ? "selected" : ""}>${v.nombre}</option>`).join("")}</select></div>
      <div><label class="fld">Prioridad</label><select id="pPrio" style="width:100%">${Object.entries(PRIORIDADES).map(([k, v]) => `<option value="${k}" ${(p.prioridad || "media") === k ? "selected" : ""}>${v.nombre}</option>`).join("")}</select></div>
    </div>
    <div><label class="fld">Proyecto (opcional, como en el cuadro de estatus)</label><input type="text" id="pProy" value="${esc(p.proyecto || "")}" placeholder="Ej: Liquidación, Accesos, Estrategia Payless..." style="width:100%"/></div>
    <div class="row2">
      <div><label class="fld">Matriz vinculada (opcional)</label><select id="pMatriz" style="width:100%">
        <option value="">— Sin matriz —</option>
        ${mxOpciones.map((m) => `<option value="${m.id}" ${p.matrizId === m.id ? "selected" : ""}>${esc(matrizLabel(m))}${m.mes !== UI.gestMes ? ` (${esc(monthLabel(m.mes))})` : ""}</option>`).join("")}
      </select></div>
      <div><label class="fld">🔒 Bloqueado por (opcional)</label><select id="pBloq" style="width:100%">
        <option value="">— Nada lo bloquea —</option>
        ${bloqueables.map((y) => `<option value="${y.id}" ${p.bloqueadoPor === y.id ? "selected" : ""}>${esc(y.titulo.slice(0, 50))}</option>`).join("")}
      </select></div>
    </div>
    <div><label class="fld">⛔ ¿Qué información falta para avanzar? (se muestra en rojo)</label><input type="text" id="pFalta" value="${esc(p.faltaInfo)}" placeholder="Ej: faltan los editables, falta el legal de Panamá..." style="width:100%"/></div>
    <div><label class="fld">Link (opcional)</label><input type="url" id="pLink" value="${esc(p.link)}" placeholder="https://..." style="width:100%"/></div>
    <div><label class="fld">Notas</label><textarea id="pNotas" rows="2" style="width:100%">${esc(p.notas)}</textarea></div>
    <div class="approval-box">
      <label class="fld">📜 Historial (trazabilidad) — se guarda al pulsar Guardar</label>
      <div class="hist-list">${hist.length
        ? hist.map((h) => `<div class="hist-item"><span class="hist-fecha">${esc(fechaCorta(h.fecha))}</span> ${esc(h.texto)}</div>`).join("")
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

  // Historial: acciones rápidas y notas libres sobre el BORRADOR (cancelar no deja rastro)
  const refreshHist = () => {
    document.querySelector(".hist-list").innerHTML = hist.length
      ? hist.map((h) => `<div class="hist-item"><span class="hist-fecha">${esc(fechaCorta(h.fecha))}</span> ${esc(h.texto)}</div>`).join("")
      : `<div class="pg-empty" style="margin:0">Sin eventos aún</div>`;
  };
  const addEv = (texto) => { hist.push({ fecha: HOY, texto }); refreshHist(); };
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
    const gen = lado === "inside" ? "equipo" : "payless";
    document.getElementById("pResp").innerHTML = lista.map((pe) => `<option value="${pe.id}" ${pe.id === gen ? "selected" : ""}>${esc(pe.nombre)}${pe.lado === "agencia" ? " · " + esc(pe.area) : ""}</option>`).join("");
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
    p.bloqueadoPor = document.getElementById("pBloq").value;
    p.faltaInfo = document.getElementById("pFalta").value.trim();
    p.prioridad = document.getElementById("pPrio").value;
    p.proyecto = document.getElementById("pProy").value.trim();
    p.link = document.getElementById("pLink").value.trim();
    p.notas = document.getElementById("pNotas").value.trim();
    p.historial = hist;
    const nuevoEstado = document.getElementById("pEstado").value;
    if (nuevoEstado !== (p.estado || "por_hacer")) setEstadoPend(p, nuevoEstado);
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
      const n = setEstadoPend(x, c.checked ? "hecho" : "en_curso");
      save(); render();
      toast(x.hecho ? (n ? `Completado ✓ · ${n} pendiente${n > 1 ? "s" : ""} desbloqueado${n > 1 ? "s" : ""} 🔓` : "Pendiente completado ✓") : "Pendiente reabierto");
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

  // Filtros del dashboard de pendientes
  bind("pendVer", () => { UI.pendVer = document.getElementById("pendVer").value; render(); }, "onchange");
  bind("pendCat", () => { UI.pendCat = document.getElementById("pendCat").value; render(); }, "onchange");
  const pq = document.getElementById("pendQ");
  if (pq) pq.oninput = () => {
    UI.pendQ = pq.value; render();
    const n = document.getElementById("pendQ");
    if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
  };
  const limpiarPend = () => { UI.pendVer = ""; UI.pendQ = ""; UI.pendVencidos = false; UI.pendLado = ""; UI.pendCat = ""; UI.pendArea = ""; render(); };
  bind("pendLimpiar", limpiarPend);
  bind("pendLimpiar2", limpiarPend);
  bind("kpiVencidos", () => { UI.pendVencidos = !UI.pendVencidos; render(); });
  bind("btnCopiarEstatus", copiarEstatus);

  // Selector de vista y filtro de lado
  document.querySelectorAll("[data-pvista]").forEach((b) => b.onclick = () => {
    UI.pendVista = b.dataset.pvista;
    UI.pendRealizados = false;
    try { localStorage.setItem("gi_pend_vista", UI.pendVista); } catch (e) {}
    render();
  });
  document.querySelectorAll("[data-phecho]").forEach((b) => b.onclick = () => { UI.pendRealizados = b.dataset.phecho === "1"; render(); });
  document.querySelectorAll("[data-plado]").forEach((b) => b.onclick = () => { UI.pendLado = b.dataset.plado; render(); });
  document.querySelectorAll("[data-achip]").forEach((b) => b.onclick = () => {
    const v = b.dataset.achip;
    if (v === "cliente") { const ya = UI.pendLado === "cliente" && !UI.pendArea; UI.pendLado = ya ? "" : "cliente"; UI.pendArea = ""; }
    else { const ya = UI.pendArea === v; UI.pendArea = ya ? "" : v; UI.pendLado = ya ? "" : "inside"; }
    render();
  });

  // — Creación rápida (popover global) —
  const crearPendiente = (campos) => {
    const p = {
      id: "pd_" + Date.now(), lado: campos.lado, titulo: campos.titulo,
      responsable: campos.responsable, area: campos.area || "Gestión",
      limite: campos.limite || "", link: "", notas: "", hecho: campos.estado === "hecho",
      historial: [{ fecha: HOY, texto: "🏁 Creado" }], faltaInfo: "", matrizId: "", bloqueadoPor: "",
      estado: campos.estado || "por_hacer", prioridad: campos.prioridad || "media", proyecto: campos.proyecto || "",
    };
    DB.pendientes.push(p);
    UI.qaLado = campos.lado;
    save(); render(); toast("Pendiente creado ✓");
  };
  bind("btnQuickAdd", () => { UI.quickAdd = UI.quickAdd ? null : { lado: UI.qaLado }; render(); if (UI.quickAdd) { const t = document.getElementById("qpTitulo"); if (t) t.focus(); } });
  document.querySelectorAll("[data-qalado]").forEach((b) => b.onclick = () => {
    if (!UI.quickAdd) return;
    UI.quickAdd.lado = b.dataset.qalado;
    UI.quickAdd.titulo = (document.getElementById("qpTitulo") || {}).value || "";
    UI.quickAdd.cat = (document.getElementById("qpCat") || {}).value || "";
    render();
    const t = document.getElementById("qpTitulo"); if (t) t.focus();
  });
  const qpResp = document.getElementById("qpResp");
  if (qpResp) qpResp.onchange = () => { const r = document.getElementById("qpRol"); if (r) r.textContent = (persona(qpResp.value) || {}).rol || ""; };
  const qpCrearFn = () => {
    const titulo = (document.getElementById("qpTitulo") || {}).value?.trim();
    if (!titulo) { const t = document.getElementById("qpTitulo"); if (t) t.focus(); return; }
    const qa = UI.quickAdd;
    crearPendiente({
      lado: qa.lado, titulo,
      responsable: document.getElementById("qpResp").value,
      area: document.getElementById("qpCat").value,
      limite: document.getElementById("qpLim").value,
      prioridad: document.getElementById("qpPrio").value,
      estado: qa.estadoPreset || "por_hacer",
    });
    UI.quickAdd = null; render();
  };
  bind("qpCrear", qpCrearFn);
  const qpTit = document.getElementById("qpTitulo");
  if (qpTit) qpTit.onkeydown = (e) => { if (e.key === "Enter") qpCrearFn(); };
  bind("qpCerrar", () => { UI.quickAdd = null; render(); });
  bind("qpMas", () => {
    const preset = {
      titulo: (document.getElementById("qpTitulo") || {}).value || "",
      area: (document.getElementById("qpCat") || {}).value || "Gestión",
      limite: (document.getElementById("qpLim") || {}).value || "",
      responsable: (document.getElementById("qpResp") || {}).value,
      estado: (UI.quickAdd || {}).estadoPreset,
    };
    const lado = (UI.quickAdd || {}).lado || "cliente";
    UI.quickAdd = null;
    openPendModal(null, lado, "", preset);
  });
  document.querySelectorAll("[data-qcol]").forEach((b) => b.onclick = () => { UI.quickAdd = { lado: UI.qaLado, estadoPreset: b.dataset.qcol }; render(); const t = document.getElementById("qpTitulo"); if (t) t.focus(); });
  document.querySelectorAll("[data-qdia]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); UI.quickAdd = { lado: UI.qaLado, limitePreset: b.dataset.qdia }; render(); const t = document.getElementById("qpTitulo"); if (t) t.focus(); });

  // — Tablero: arrastrar entre columnas de estado —
  bind("kbVerHechos", () => { UI.pendRealizados = true; render(); });
  document.querySelectorAll("[data-estadocol]").forEach((zone) => {
    zone.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("text/pend")) { e.preventDefault(); zone.classList.add("drop-hover"); } });
    zone.addEventListener("dragleave", (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("drop-hover"); });
    zone.addEventListener("drop", (e) => {
      const id = e.dataTransfer.getData("text/pend");
      if (!id) return;
      e.preventDefault(); zone.classList.remove("drop-hover");
      const x = DB.pendientes.find((y) => y.id === id);
      if (!x) return;
      const n = setEstadoPend(x, zone.dataset.estadocol);
      save(); render();
      toast(`${PEND_ESTADOS[zone.dataset.estadocol].nombre} ✓${n ? ` · ${n} desbloqueado${n > 1 ? "s" : ""} 🔓` : ""}`);
    });
  });

  // — Tabla: edición inline + orden + quick-add —
  document.querySelectorAll("[data-psort]").forEach((h) => h.onclick = () => {
    const col = h.dataset.psort;
    if (UI.pendSort.col === col) UI.pendSort.dir *= -1; else UI.pendSort = { col, dir: 1 };
    render();
  });
  const inline = (attr, fn) => document.querySelectorAll(`[${attr}]`).forEach((el) => el.onchange = () => {
    const x = DB.pendientes.find((y) => y.id === el.getAttribute(attr));
    if (x) { fn(x, el.value); save(); render(); }
  });
  inline("data-ilado", (x, v) => {
    x.lado = v; x.responsable = v === "inside" ? "equipo" : "payless";
    (x.historial = x.historial || []).push({ fecha: HOY, texto: `↔️ Cambiado a ${v === "inside" ? "Inside" : "Payless"} (${nombre(x.responsable)})` });
  });
  inline("data-iresp", (x, v) => { x.responsable = v; (x.historial = x.historial || []).push({ fecha: HOY, texto: `👤 Reasignado a ${nombre(v)}` }); });
  inline("data-icat", (x, v) => { x.area = v; });
  inline("data-iprio", (x, v) => { x.prioridad = v; (x.historial = x.historial || []).push({ fecha: HOY, texto: `🚩 Prioridad: ${PRIORIDADES[v].nombre}` }); });
  inline("data-iproy", (x, v) => { x.proyecto = v.trim(); });
  inline("data-iestado", (x, v) => { const n = setEstadoPend(x, v); if (n) toast(`${n} desbloqueado${n > 1 ? "s" : ""} 🔓`); });
  inline("data-ilim", (x, v) => { x.limite = v; (x.historial = x.historial || []).push({ fecha: HOY, texto: v ? `📅 Límite: ${fechaCorta(v)}` : "📅 Quedó sin fecha límite" }); });
  const qaT = document.getElementById("qaTitulo");
  if (qaT) qaT.onkeydown = (e) => {
    if (e.key !== "Enter") return;
    const titulo = qaT.value.trim();
    if (!titulo) return;
    crearPendiente({
      lado: document.getElementById("qaLadoSel").value, titulo,
      responsable: document.getElementById("qaRespSel").value, area: "Gestión",
    });
    const nt = document.getElementById("qaTitulo"); if (nt) nt.focus();
  };
  const qaLadoSel = document.getElementById("qaLadoSel");
  if (qaLadoSel) qaLadoSel.onchange = () => {
    UI.qaLado = qaLadoSel.value;
    const gente = UI.qaLado === "inside" ? inside() : clientes();
    document.getElementById("qaRespSel").innerHTML = gente.map((pe) => `<option value="${pe.id}">${esc(pe.nombre)} — ${esc(pe.rol)}</option>`).join("");
  };

  // — Calendario de pendientes: navegación y drag de límites —
  bind("pcPrev", () => { UI.pendCalMes = shiftMonth(UI.pendCalMes, -1); render(); });
  bind("pcNext", () => { UI.pendCalMes = shiftMonth(UI.pendCalMes, 1); render(); });
  bind("pcHechos", () => { UI.pendCalHechos = document.getElementById("pcHechos").checked; render(); }, "onchange");
  document.querySelectorAll("[data-pcal]").forEach((chip) => {
    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/pendcal", chip.dataset.pcal);
      e.dataTransfer.effectAllowed = "move";
      requestAnimationFrame(() => chip.classList.add("dragging"));
    });
    chip.addEventListener("dragend", () => document.querySelectorAll(".dragging,.drop-hover").forEach((c) => c.classList.remove("dragging", "drop-hover")));
  });
  document.querySelectorAll("[data-pdrop]").forEach((zone) => {
    zone.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("text/pendcal")) { e.preventDefault(); zone.classList.add("drop-hover"); } });
    zone.addEventListener("dragleave", (e) => { if (!zone.contains(e.relatedTarget)) zone.classList.remove("drop-hover"); });
    zone.addEventListener("drop", (e) => {
      const id = e.dataTransfer.getData("text/pendcal");
      if (!id) return;
      e.preventDefault(); zone.classList.remove("drop-hover");
      const x = DB.pendientes.find((y) => y.id === id);
      const f = zone.dataset.pdrop;
      if (!x || x.limite === f) return;
      x.limite = f;
      (x.historial = x.historial || []).push({ fecha: HOY, texto: f ? `📅 Límite movido al ${fechaCorta(f)}` : "📅 Quedó sin fecha límite" });
      save(); render();
      toast(f ? `Límite: ${fechaCorta(f)} ✓` : "Sin fecha límite ✓");
    });
  });

  // Cliente marca "ya lo envié" → evento en el historial (Inside confirma el recibido)
  document.querySelectorAll("[data-penvio]").forEach((b) => b.onclick = () => {
    const x = DB.pendientes.find((y) => y.id === b.dataset.penvio);
    if (!x) return;
    const nota = prompt(`¿Algún comentario para Inside sobre "${x.titulo.slice(0, 50)}"? (opcional)`) || "";
    (x.historial = x.historial || []).push({ fecha: HOY, texto: `📬 ${nombre(UI.clienteId)} (cliente) marcó como enviado${nota ? `: "${nota}"` : ""}` });
    save(); render(); toast("Aviso registrado — Inside confirmará el recibido ✓");
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
        // No cruzar columnas: un pendiente de Inside no puede caer en una persona del cliente (y viceversa)
        const destino = persona(zone.dataset.asignap);
        const ladoDestino = destino && destino.lado === "agencia" ? "inside" : "cliente";
        if (ladoDestino !== x.lado) { toast(`⚠️ Este pendiente es de ${x.lado === "inside" ? "Inside" : "el cliente"}; suéltalo en su columna`); return; }
        if (x.responsable === zone.dataset.asignap) return;
        x.responsable = zone.dataset.asignap;
        (x.historial = x.historial || []).push({ fecha: HOY, texto: `👤 Reasignado a ${nombre(x.responsable)}` });
        save(); render(); toast(`Asignado a ${nombre(x.responsable)} ✓`);
      } else {
        const area = zone.dataset.asignarea;
        if (x.lado !== "inside") { toast("⚠️ Los pendientes del cliente no se distribuyen por área"); return; }
        const equipo = inside().filter((pe) => pe.area === area);
        if (!equipo.length) return;
        if (equipo.length === 1) {
          if (x.responsable === equipo[0].id) return;
          x.responsable = equipo[0].id;
          (x.historial = x.historial || []).push({ fecha: HOY, texto: `👤 Distribuido al área ${area} (${nombre(x.responsable)})` });
          save(); render(); toast(`Asignado a ${nombre(x.responsable)} ✓`);
        } else {
          // Varias personas en el área: preguntar a quién
          UI.pendChooser = { pendId: x.id, area };
          render();
        }
      }
    });
  });

  // Elegir persona del área (mini-menú tras soltar)
  document.querySelectorAll("[data-eligep]").forEach((b) => b.onclick = () => {
    const ch = UI.pendChooser;
    UI.pendChooser = null;
    if (!ch || !b.dataset.eligep) { render(); return; }
    const x = DB.pendientes.find((y) => y.id === ch.pendId);
    if (x && x.responsable !== b.dataset.eligep) {
      x.responsable = b.dataset.eligep;
      (x.historial = x.historial || []).push({ fecha: HOY, texto: `👤 Distribuido al área ${ch.area} (${nombre(x.responsable)})` });
      save(); toast(`Asignado a ${nombre(x.responsable)} ✓`);
    }
    render();
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
