/* ============================================================
   Gestión Inside — Lógica (v1.1: Calendario de Publicación)
   Vanilla JS, sin build. Persiste en localStorage.
   ============================================================ */

const KEY = "gestion_inside_v1_1";

const UI = {
  view: "calendario",
  mode: "interno",            // interno | cliente
  calView: "grid",            // grid | lista
  month: SEED.meta.mesActual,
  filtros: { region: "", campana: "", canal: "", formato: "", estado: "", aprobacion: "" },
  soloMias: false,            // en modo cliente: solo lo que apruebo yo
  clienteId: "nico",          // "quién soy" cuando entro como cliente
  editId: null,
};

let DB = load();

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
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
function piezasVisibles() {
  const f = UI.filtros;
  let list = DB.piezas
    .filter((p) => p.mes === UI.month)
    .filter((p) => !f.region || p.regionId === f.region)
    .filter((p) => !f.campana || p.campanaId === f.campana)
    .filter((p) => !f.canal || p.canal === f.canal)
    .filter((p) => !f.formato || p.formato === f.formato)
    .filter((p) => !f.estado || p.estado === f.estado)
    .filter((p) => !f.aprobacion || p.aprobacion === f.aprobacion);
  if (UI.mode === "cliente" && UI.soloMias) list = list.filter((p) => p.aprobador === UI.clienteId);
  return list.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.canal.localeCompare(b.canal));
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === UI.view));
  document.querySelectorAll("#modePill button").forEach((b) => b.classList.toggle("active", b.dataset.mode === UI.mode));

  const titles = {
    calendario: ["Calendario de Publicación", monthLabel(UI.month) + " · Payless"],
    estructura: ["Estructura de cuenta", "Territorios, campañas y quién aprueba qué"],
    roadmap: ["Roadmap", "Lo que viene en la v2"],
  };
  document.getElementById("pageTitle").textContent = titles[UI.view][0];
  document.getElementById("pageSub").textContent = titles[UI.view][1];

  const c = document.getElementById("content");
  if (UI.view === "calendario") c.innerHTML = viewCalendario();
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
      Tienes <b>${mias}</b> pendiente${mias === 1 ? "" : "s"} de tu aprobación.
      <select id="quienSoy" style="margin-left:8px">${clientes().map((p) => `<option value="${p.id}" ${UI.clienteId === p.id ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select>
    </div>`;
  }
  return `
  ${kpis()}
  ${note}
  <div class="toolbar">
    <div class="monthnav"><button id="mPrev">‹</button><span class="m">${monthLabel(UI.month)}</span><button id="mNext">›</button></div>
    <div class="grp">
      <select id="fRegion">${opt("Todas las regiones", DB.regiones, UI.filtros.region)}</select>
      <select id="fCampana">${opt("Todas las campañas", DB.campanas, UI.filtros.campana)}</select>
      <select id="fCanal">${optS("Todos los canales", DB.canales, UI.filtros.canal)}</select>
      <select id="fFormato">${optS("Todos los formatos", DB.formatos, UI.filtros.formato)}</select>
      <select id="fEstado">${opt("Toda la producción", DB.estados, UI.filtros.estado)}</select>
      <select id="fAprob">${opt("Toda aprobación", DB.aprobaciones, UI.filtros.aprobacion)}</select>
    </div>
    <div class="spacer"></div>
    ${!interno ? `<label class="chkmine"><input type="checkbox" id="soloMias" ${UI.soloMias ? "checked" : ""}/> Solo lo que apruebo yo</label>` : ""}
    <div class="viewtoggle">
      <button data-cal="grid" class="${UI.calView === "grid" ? "active" : ""}">📅 Calendario</button>
      <button data-cal="lista" class="${UI.calView === "lista" ? "active" : ""}">☰ Gestión (lista)</button>
    </div>
    ${interno ? `<button class="btn" id="btnDup" title="Copiar todas las publicaciones de este mes al siguiente">⧉ Duplicar mes</button>` : ""}
    ${interno ? `<button class="btn primary" id="btnNew">＋ Agregar publicación</button>` : ""}
  </div>
  <div class="reg-legend">
    ${DB.regiones.map((r) => `<span><i style="background:${r.color}"></i>${esc(r.nombre)}</span>`).join("")}
    <span class="legend-note">Fondo = región · borde izquierdo = producción · ✓/⏳/✕ = aprobación cliente</span>
  </div>
  ${UI.calView === "grid" ? calGrid() : calLista(interno)}
  `;
}

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
    <span class="cico">${ico}</span>${esc(campana(p.campanaId) ? campana(p.campanaId).nombre : "")}
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
  const today = "2026-07-03";
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
  const piezas = piezasVisibles();
  if (!piezas.length) return emptyState(interno);
  const rows = piezas.map((p) => {
    const r = region(p.regionId), e = estado(p.estado), a = aprob(p.aprobacion);
    const acc = interno
      ? `<button class="ico-btn" data-open="${p.id}" title="Editar">✏️</button><button class="ico-btn danger" data-del="${p.id}" title="Eliminar">🗑️</button>`
      : `<button class="ico-btn" data-open="${p.id}" title="Ver / aprobar">👁️</button>`;
    return `<tr>
      <td class="nowrap">${esc(fechaCorta(p.fecha))}</td>
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
    const n = DB.piezas.filter((x) => x.mes === UI.month && x.aprobador === p.id).length;
    return `<div class="card"><h4>${esc(p.nombre)}</h4><p>${esc(p.rol)} · Payless</p><span class="tag cli">Cliente · aprueba ${n}</span></div>`;
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
      <div><label class="fld">Fecha de publicación</label><input type="date" id="mFecha" value="${esc(draft.fecha)}" ${ro} style="width:100%"/></div>
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
    <div><label class="fld">Link de la pieza / editable (Drive, Frame…)</label><input type="url" id="mLink" value="${esc(draft.link)}" placeholder="https://..." ${ro} style="width:100%"/></div>
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
  const f = fecha || `${UI.month}-01`;
  const r = DB.regiones[0];
  return {
    id: null, fecha: f, mes: f.slice(0, 7), marca: "Payless",
    campanaId: DB.campanas[0].id, regionId: r.id, canal: DB.canales[0], formato: DB.formatos[0],
    estado: "briefing", responsable: inside()[0].id, aprobador: clientes()[0].id,
    aprobacion: "pendiente", comentarioCliente: "", paises: r.paises.slice(), link: "", notas: "",
  };
}
function closeModal() { document.getElementById("overlay").classList.remove("open"); UI.editId = null; }

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
      draft.fecha = document.getElementById("mFecha").value;
      draft.mes = draft.fecha.slice(0, 7);
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
}

function wireContent() {
  document.querySelectorAll("[data-open]").forEach((el) => el.onclick = () => openModal(el.dataset.open));
  document.querySelectorAll("[data-del]").forEach((el) => el.onclick = (e) => { e.stopPropagation(); const id = el.dataset.del; if (confirm("¿Eliminar esta publicación?")) { DB.piezas = DB.piezas.filter((x) => x.id !== id); save(); render(); } });
  document.querySelectorAll("[data-add]").forEach((el) => el.onclick = (e) => { e.stopPropagation(); openModal(null, el.dataset.add); });

  const bind = (id, fn, ev = "onclick") => { const el = document.getElementById(id); if (el) el[ev] = fn; };
  bind("btnNew", () => openModal(null));
  bind("btnNew2", () => openModal(null));
  bind("mPrev", () => { UI.month = shiftMonth(UI.month, -1); render(); });
  bind("mNext", () => { UI.month = shiftMonth(UI.month, 1); render(); });
  bind("btnDup", duplicarMes);
  bind("soloMias", () => { UI.soloMias = document.getElementById("soloMias").checked; render(); }, "onchange");
  bind("quienSoy", () => { UI.clienteId = document.getElementById("quienSoy").value; render(); }, "onchange");

  document.querySelectorAll("[data-cal]").forEach((b) => b.onclick = () => { UI.calView = b.dataset.cal; render(); });
  const chg = (id, key) => { const el = document.getElementById(id); if (el) el.onchange = () => { UI.filtros[key] = el.value; render(); }; };
  chg("fRegion", "region"); chg("fCampana", "campana"); chg("fCanal", "canal");
  chg("fFormato", "formato"); chg("fEstado", "estado"); chg("fAprob", "aprobacion");

  if (UI.mode === "interno" && UI.calView === "grid") wireDragDrop();
}

/* Arrastrar publicaciones entre días (estilo Trello) — solo modo Interno */
function wireDragDrop() {
  let arrastrando = null;

  document.querySelectorAll('.chip[draggable="true"]').forEach((chip) => {
    chip.addEventListener("dragstart", (e) => {
      arrastrando = chip.dataset.pieza;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", arrastrando);
      requestAnimationFrame(() => chip.classList.add("dragging"));
    });
    chip.addEventListener("dragend", () => {
      arrastrando = null;
      document.querySelectorAll(".chip.dragging").forEach((c) => c.classList.remove("dragging"));
      document.querySelectorAll(".cal-cell.drop-hover").forEach((c) => c.classList.remove("drop-hover"));
    });
  });

  document.querySelectorAll(".cal-cell[data-drop]").forEach((cell) => {
    cell.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; cell.classList.add("drop-hover"); });
    cell.addEventListener("dragleave", () => cell.classList.remove("drop-hover"));
    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      cell.classList.remove("drop-hover");
      const id = e.dataTransfer.getData("text/plain") || arrastrando;
      const nuevaFecha = cell.dataset.drop;
      const p = DB.piezas.find((x) => x.id === id);
      if (!p || !nuevaFecha || p.fecha === nuevaFecha) return;
      p.fecha = nuevaFecha;
      p.mes = nuevaFecha.slice(0, 7);
      save();
      render();
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
}

/* ---------- Nav global ---------- */
document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.onclick = () => { UI.view = b.dataset.view; render(); });
document.querySelectorAll("#modePill button").forEach((b) => b.onclick = () => { UI.mode = b.dataset.mode; UI.soloMias = false; render(); });
document.getElementById("modalClose").onclick = closeModal;
document.getElementById("overlay").onclick = (e) => { if (e.target.id === "overlay") closeModal(); };
document.getElementById("btnReset").onclick = () => { if (confirm("¿Reiniciar a los datos del kick off? Se perderán tus cambios en este navegador.")) { DB = JSON.parse(JSON.stringify(SEED)); save(); UI.month = SEED.meta.mesActual; render(); } };

render();
