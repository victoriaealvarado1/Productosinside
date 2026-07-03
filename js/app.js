/* ============================================================
   Gestión Inside — Lógica de la app (v1: Calendario)
   Vanilla JS, sin build. Persiste en localStorage.
   ============================================================ */

const KEY = "gestion_inside_v1";

/* ---------- Estado ---------- */
const UI = {
  view: "calendario",
  mode: "interno", // interno | cliente
  calView: "grid", // grid | lista
  month: SEED.meta.mesActual, // "YYYY-MM"
  filtros: { region: "", campana: "", estado: "", responsable: "" },
  editId: null,
};

let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(SEED));
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {}
}

/* ---------- Lookups ---------- */
const region = (id) => DB.regiones.find((r) => r.id === id);
const campana = (id) => DB.campanas.find((c) => c.id === id);
const estado = (id) => DB.estados.find((e) => e.id === id);
const persona = (id) => DB.personas.find((p) => p.id === id);

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}
function shiftMonth(ym, delta) {
  let [y, m] = ym.split("-").map(Number);
  m += delta;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  return `${y}-${String(m).padStart(2, "0")}`;
}
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Filtrado ---------- */
function piezasDelMes() {
  const f = UI.filtros;
  return DB.piezas
    .filter((p) => p.mes === UI.month)
    .filter((p) => !f.region || p.regionId === f.region)
    .filter((p) => !f.campana || p.campanaId === f.campana)
    .filter((p) => !f.estado || p.estado === f.estado)
    .filter((p) => !f.responsable || p.responsable === f.responsable)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ============================================================
   RENDER — router
   ============================================================ */
function render() {
  document.querySelectorAll(".nav-item[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === UI.view)
  );
  document.querySelectorAll("#modePill button").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === UI.mode)
  );

  const titles = {
    calendario: ["Calendario de Publicación", monthLabel(UI.month) + " · Payless"],
    estructura: ["Estructura de cuenta", "Territorios, campañas y equipo"],
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
  const publicadas = ps.filter((p) => p.estado === "publicado").length;
  const enDiseno = ps.filter((p) => p.estado === "diseno" || p.estado === "briefing").length;
  const porAprobar = ps.filter((p) =>
    Object.values(p.aprobaciones || {}).some((a) => a === "pendiente")
  ).length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const card = (n, l, color, val) =>
    `<div class="kpi"><div class="n">${n}</div><div class="l">${l}</div>
      <div class="bar"><i style="width:${val}%;background:${color}"></i></div></div>`;
  return `<div class="kpis">
    ${card(total, "Piezas del mes", "#6D28D9", 100)}
    ${card(publicadas, "Publicadas", "#16A34A", pct(publicadas))}
    ${card(enDiseno, "En diseño / briefing", "#3B82F6", pct(enDiseno))}
    ${card(porAprobar, "Con aprobación pendiente", "#F59E0B", pct(porAprobar))}
  </div>`;
}

/* ---------- Vista Calendario ---------- */
function viewCalendario() {
  const interno = UI.mode === "interno";
  const note = interno
    ? ""
    : `<div class="pill-note cli-note">👁️ <b>Modo Cliente:</b> vista de solo lectura. Aquí el cliente ve el estado de cada pieza y su aprobación por país, sin poder editar. En v2 podrá aprobar directamente desde acá.</div>`;

  return `
  ${kpis()}
  ${note}
  <div class="toolbar">
    <div class="monthnav">
      <button id="mPrev">‹</button>
      <span class="m">${monthLabel(UI.month)}</span>
      <button id="mNext">›</button>
    </div>
    <div class="grp">
      <select id="fRegion">${optRegion(UI.filtros.region)}</select>
      <select id="fCampana">${optCampana(UI.filtros.campana)}</select>
      <select id="fEstado">${optEstado(UI.filtros.estado)}</select>
      <select id="fResp">${optResp(UI.filtros.responsable)}</select>
    </div>
    <div class="spacer"></div>
    <div class="viewtoggle">
      <button data-cal="grid" class="${UI.calView === "grid" ? "active" : ""}">📅 Calendario</button>
      <button data-cal="lista" class="${UI.calView === "lista" ? "active" : ""}">☰ Lista</button>
    </div>
    ${interno ? `<button class="btn" id="btnDup" title="Copiar todas las piezas de este mes al siguiente">⧉ Duplicar mes</button>` : ""}
    ${interno ? `<button class="btn primary" id="btnNew">＋ Nueva pieza</button>` : ""}
  </div>
  <div class="reg-legend">
    ${DB.regiones.map((r) => `<span><i style="background:${r.color}"></i>${esc(r.nombre)}</span>`).join("")}
    <span style="margin-left:auto;color:var(--muted);font-weight:500">El color del borde de cada pieza = estado</span>
  </div>
  ${UI.calView === "grid" ? calGrid() : calLista()}
  `;
}

function chipHTML(p) {
  const r = region(p.regionId);
  const e = estado(p.estado);
  return `<span class="chip" data-open="${p.id}" title="${esc(p.campana)} · ${esc(r ? r.nombre : "")} · ${esc(e ? e.nombre : "")}"
    style="background:${r ? r.color : "#64748B"};border-left-color:${e ? e.color : "#fff"}">
    ${esc(p.campana)} <span class="fmt">· ${esc(p.formato)}</span></span>`;
}

function calGrid() {
  const [y, m] = UI.month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const startDow = (first.getUTCDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const daysPrev = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const piezas = piezasDelMes();
  const byDay = {};
  piezas.forEach((p) => { (byDay[p.fecha] = byDay[p.fecha] || []).push(p); });

  const todayStr = "2026-07-03"; // fecha de referencia del proyecto
  const dow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let cells = "";
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const dayIdx = i - startDow + 1;
    let cls = "cal-cell", label, dateStr = "", other = false;
    if (dayIdx < 1) { other = true; label = daysPrev + dayIdx; }
    else if (dayIdx > daysInMonth) { other = true; label = dayIdx - daysInMonth; }
    else {
      label = dayIdx;
      dateStr = `${UI.month}-${String(dayIdx).padStart(2, "0")}`;
    }
    if (other) cls += " other";
    if (dateStr === todayStr) cls += " today";
    const chips = (byDay[dateStr] || []).map(chipHTML).join("");
    const addBtn = !other && UI.mode === "interno" ? `<button class="addday" data-add="${dateStr}">＋</button>` : "";
    cells += `<div class="${cls}">${addBtn}<div class="dnum">${label}</div>${chips}</div>`;
  }
  return `<div class="calwrap">
    <div class="cal-head">${dow.map((d) => `<div>${d}</div>`).join("")}</div>
    <div class="cal-grid">${cells}</div>
  </div>`;
}

function calLista() {
  const piezas = piezasDelMes();
  if (!piezas.length) return emptyState();
  const rows = piezas.map((p) => {
    const r = region(p.regionId), e = estado(p.estado), pe = persona(p.responsable);
    const apr = resumenAprob(p);
    return `<tr data-open="${p.id}">
      <td style="white-space:nowrap">${esc(fechaCorta(p.fecha))}</td>
      <td><b>${esc(p.campana)}</b></td>
      <td><span class="badge soft"><span class="dot" style="background:${r ? r.color : "#999"}"></span>${esc(r ? r.nombre : "")}</span></td>
      <td>${esc(p.formato)}</td>
      <td><span class="badge" style="background:${e ? e.color + "22" : "#eee"};color:${e ? e.color : "#333"}">${esc(e ? e.nombre : "")}</span></td>
      <td>${esc(pe ? pe.nombre : "—")}</td>
      <td>${apr}</td>
      <td>${p.link ? `<a class="lk" href="${esc(p.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Abrir ↗</a>` : `<span class="nolink">sin link</span>`}</td>
    </tr>`;
  }).join("");
  return `<table class="tbl"><thead><tr>
    <th>Fecha</th><th>Campaña</th><th>Región</th><th>Formato</th><th>Estado</th><th>Responsable</th><th>Aprobación</th><th>Link</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function resumenAprob(p) {
  const vals = Object.values(p.aprobaciones || {});
  if (!vals.length) return "—";
  const ap = vals.filter((v) => v === "aprobado").length;
  const re = vals.filter((v) => v === "rechazado").length;
  if (re) return `<span class="appr rechazado">${re} rechazo${re > 1 ? "s" : ""}</span>`;
  if (ap === vals.length) return `<span class="appr aprobado">Aprobado</span>`;
  return `<span class="appr pendiente">${ap}/${vals.length} países</span>`;
}

function fechaCorta(f) {
  const [, m, d] = f.split("-").map(Number);
  return `${d} ${MESES[m - 1].slice(0, 3).toLowerCase()}`;
}
function emptyState() {
  return `<div class="calwrap"><div class="empty"><div class="big">🗓️</div>
    <p>No hay piezas para este mes con los filtros aplicados.</p>
    ${UI.mode === "interno" ? `<button class="btn primary" id="btnNew2">＋ Crear la primera pieza</button>` : ""}
  </div></div>`;
}

/* ---------- Opciones de filtros ---------- */
function optRegion(sel) {
  return `<option value="">Todas las regiones</option>` +
    DB.regiones.map((r) => `<option value="${r.id}" ${sel === r.id ? "selected" : ""}>${esc(r.nombre)}</option>`).join("");
}
function optCampana(sel) {
  return `<option value="">Todas las campañas</option>` +
    DB.campanas.map((c) => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("");
}
function optEstado(sel) {
  return `<option value="">Todos los estados</option>` +
    DB.estados.map((e) => `<option value="${e.id}" ${sel === e.id ? "selected" : ""}>${esc(e.nombre)}</option>`).join("");
}
function optResp(sel) {
  return `<option value="">Todos los responsables</option>` +
    DB.personas.map((p) => `<option value="${p.id}" ${sel === p.id ? "selected" : ""}>${esc(p.nombre)}</option>`).join("");
}

/* ---------- Vista Estructura ---------- */
function viewEstructura() {
  const regs = DB.regiones.map((r) => `
    <div class="card">
      <h4><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${r.color};margin-right:6px"></span>${esc(r.nombre)}</h4>
      <p>${r.paises.map(esc).join(" · ")}</p>
      <span class="tag">${r.paises.length} países</span>
    </div>`).join("");
  const camps = DB.campanas.map((c) => `
    <div class="card"><h4>${esc(c.nombre)}</h4>
    <p>${DB.piezas.filter((p) => p.campanaId === c.id && p.mes === UI.month).length} piezas este mes</p></div>`).join("");
  const eq = DB.personas.map((p) => `
    <div class="card"><h4>${esc(p.nombre)}</h4><p>${esc(p.rol)} · ${p.lado === "agencia" ? "Inside" : "Payless"}</p>
    <span class="tag" style="${p.lado === "agencia" ? "" : "color:#2563EB;background:#EFF6FF"}">${p.lado === "agencia" ? "Agencia" : "Cliente"}</span></div>`).join("");

  return `
    <div class="pill-note">Esta pantalla es la <b>base compartida</b> del calendario. En la v2 se expande al árbol completo de matrices (Mall, Pauta y sus 4 submatrices, Orgánica) que levantamos en la reunión.</div>
    <div class="section-title">Territorios</div><div class="cards">${regs}</div>
    <div class="section-title" style="margin-top:26px">Campañas activas</div><div class="cards">${camps}</div>
    <div class="section-title" style="margin-top:26px">Equipo & contactos</div><div class="cards">${eq}</div>`;
}

/* ---------- Vista Roadmap ---------- */
function viewRoadmap() {
  const cards = ROADMAP_V2.map((r) => `
    <div class="card"><h4>${esc(r.titulo)}</h4><p>${esc(r.desc)}</p>
    <span class="tag">Resuelve: ${esc(r.dolor)}</span></div>`).join("");
  return `
    <div class="pill-note">La v1 (este calendario) es la base. Cada tarjeta de abajo es un módulo de la v2, ligado a un dolor concreto de la reunión con Payless.</div>
    <div class="cards">${cards}</div>`;
}

/* ============================================================
   MODAL — crear / editar / ver pieza
   ============================================================ */
function openModal(id, presetFecha) {
  UI.editId = id;
  const interno = UI.mode === "interno";
  const p = id ? DB.piezas.find((x) => x.id === id) : nuevaPieza(presetFecha);
  if (!p) return;
  const ro = interno ? "" : "disabled";

  document.getElementById("modalTitle").textContent = id
    ? (interno ? "Editar pieza" : "Detalle de pieza")
    : "Nueva pieza";

  const body = document.getElementById("modalBody");
  body.innerHTML = `
    <div class="row2">
      <div><label class="fld">Campaña</label>
        <select id="mCampana" ${ro} style="width:100%">
          ${DB.campanas.map((c) => `<option value="${c.id}" ${p.campanaId === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}
        </select></div>
      <div><label class="fld">Formato</label>
        <select id="mFormato" ${ro} style="width:100%">
          ${DB.formatos.map((f) => `<option ${p.formato === f ? "selected" : ""}>${esc(f)}</option>`).join("")}
        </select></div>
    </div>
    <div class="row2">
      <div><label class="fld">Región</label>
        <select id="mRegion" ${ro} style="width:100%">
          ${DB.regiones.map((r) => `<option value="${r.id}" ${p.regionId === r.id ? "selected" : ""}>${esc(r.nombre)}</option>`).join("")}
        </select></div>
      <div><label class="fld">Fecha</label>
        <input type="date" id="mFecha" value="${esc(p.fecha)}" ${ro} style="width:100%"/></div>
    </div>
    <div class="row2">
      <div><label class="fld">Estado</label>
        <select id="mEstado" ${ro} style="width:100%">
          ${DB.estados.map((e) => `<option value="${e.id}" ${p.estado === e.id ? "selected" : ""}>${esc(e.nombre)}</option>`).join("")}
        </select></div>
      <div><label class="fld">Responsable</label>
        <select id="mResp" ${ro} style="width:100%">
          ${DB.personas.map((pe) => `<option value="${pe.id}" ${p.responsable === pe.id ? "selected" : ""}>${esc(pe.nombre)}</option>`).join("")}
        </select></div>
    </div>
    <div><label class="fld">Link de la pieza (Drive, Frame, etc.)</label>
      <input type="url" id="mLink" value="${esc(p.link)}" placeholder="https://..." ${ro} style="width:100%"/></div>
    <div><label class="fld">Notas</label>
      <textarea id="mNotas" rows="2" ${ro} style="width:100%">${esc(p.notas)}</textarea></div>
    <div><label class="fld">Aprobación por país (${esc(region(p.regionId) ? region(p.regionId).nombre : "")})</label>
      <div class="appr-grid" id="mAprob">${aprobRows(p)}</div></div>
  `;

  const footer = document.getElementById("modalFooter");
  if (interno) {
    footer.innerHTML = `
      ${id ? `<button class="btn ghost" id="mDelete" style="margin-right:auto;color:var(--danger)">Eliminar</button>` : ""}
      <button class="btn" id="mCancel">Cancelar</button>
      <button class="btn primary" id="mSave">${id ? "Guardar cambios" : "Crear pieza"}</button>`;
  } else {
    footer.innerHTML = `<button class="btn" id="mCancel">Cerrar</button>`;
  }

  document.getElementById("overlay").classList.add("open");
  wireModal(p, interno);
}

function aprobRows(p) {
  const r = region(p.regionId);
  if (!r) return "";
  return r.paises.map((pais) => {
    const st = (p.aprobaciones && p.aprobaciones[pais]) || "pendiente";
    const seg = (val, lbl) => `<button type="button" data-pais="${esc(pais)}" data-val="${val}" class="${st === val ? "on " + val : ""}">${lbl}</button>`;
    return `<div class="appr-row"><span class="pais">${esc(pais)}</span>
      <div class="seg">${seg("pendiente", "Pendiente")}${seg("aprobado", "Aprobado")}${seg("rechazado", "Rechazado")}</div></div>`;
  }).join("");
}

function nuevaPieza(fecha) {
  const f = fecha || `${UI.month}-01`;
  const r = DB.regiones[0];
  const apr = {};
  r.paises.forEach((p) => (apr[p] = "pendiente"));
  return {
    id: null, fecha: f, mes: f.slice(0, 7), marca: "Payless",
    campana: DB.campanas[0].nombre, campanaId: DB.campanas[0].id,
    regionId: r.id, formato: DB.formatos[0], estado: "briefing",
    responsable: DB.personas[0].id, link: "", notas: "", aprobaciones: apr,
  };
}

function closeModal() {
  document.getElementById("overlay").classList.remove("open");
  UI.editId = null;
}

/* ============================================================
   WIRING — eventos
   ============================================================ */
function wireModal(pieza, interno) {
  document.getElementById("mCancel").onclick = closeModal;

  // recalcular países al cambiar región (solo interno)
  if (interno) {
    const regionSel = document.getElementById("mRegion");
    regionSel.onchange = () => {
      const r = region(regionSel.value);
      const nuevo = {};
      (r ? r.paises : []).forEach((pais) => (nuevo[pais] = "pendiente"));
      pieza.aprobaciones = nuevo;
      pieza.regionId = regionSel.value;
      document.getElementById("mAprob").innerHTML = aprobRows(pieza);
      bindAprob(pieza);
    };
    bindAprob(pieza);

    document.getElementById("mSave").onclick = () => {
      pieza.campanaId = document.getElementById("mCampana").value;
      pieza.campana = campana(pieza.campanaId).nombre;
      pieza.formato = document.getElementById("mFormato").value;
      pieza.regionId = document.getElementById("mRegion").value;
      pieza.fecha = document.getElementById("mFecha").value;
      pieza.mes = pieza.fecha.slice(0, 7);
      pieza.estado = document.getElementById("mEstado").value;
      pieza.responsable = document.getElementById("mResp").value;
      pieza.link = document.getElementById("mLink").value.trim();
      pieza.notas = document.getElementById("mNotas").value.trim();
      if (!pieza.id) {
        pieza.id = "pz_" + Date.now() + "_" + Math.floor(Math.abs(hashStr(pieza.campana + pieza.fecha)) % 9999);
        DB.piezas.push(pieza);
      }
      save();
      closeModal();
      render();
    };

    const del = document.getElementById("mDelete");
    if (del) del.onclick = () => {
      if (confirm("¿Eliminar esta pieza del calendario?")) {
        DB.piezas = DB.piezas.filter((x) => x.id !== pieza.id);
        save(); closeModal(); render();
      }
    };
  }
}

function bindAprob(pieza) {
  document.querySelectorAll("#mAprob .seg button").forEach((b) => {
    b.onclick = () => {
      pieza.aprobaciones[b.dataset.pais] = b.dataset.val;
      document.getElementById("mAprob").innerHTML = aprobRows(pieza);
      bindAprob(pieza);
    };
  });
}

function wireContent() {
  // abrir pieza (chips y filas)
  document.querySelectorAll("[data-open]").forEach((el) => {
    el.onclick = () => openModal(el.dataset.open);
  });
  // agregar en día
  document.querySelectorAll("[data-add]").forEach((el) => {
    el.onclick = (e) => { e.stopPropagation(); openModal(null, el.dataset.add); };
  });

  const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  bind("btnNew", () => openModal(null));
  bind("btnNew2", () => openModal(null));
  bind("mPrev", () => { UI.month = shiftMonth(UI.month, -1); render(); });
  bind("mNext", () => { UI.month = shiftMonth(UI.month, 1); render(); });
  bind("btnDup", duplicarMes);

  document.querySelectorAll("[data-cal]").forEach((b) => {
    b.onclick = () => { UI.calView = b.dataset.cal; render(); };
  });

  const chg = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.onchange = () => { UI.filtros[key] = el.value; render(); };
  };
  chg("fRegion", "region"); chg("fCampana", "campana");
  chg("fEstado", "estado"); chg("fResp", "responsable");
}

function duplicarMes() {
  const destino = shiftMonth(UI.month, 1);
  const origen = DB.piezas.filter((p) => p.mes === UI.month);
  if (!origen.length) { alert("No hay piezas en este mes para duplicar."); return; }
  const yaHay = DB.piezas.some((p) => p.mes === destino);
  if (yaHay && !confirm(`${monthLabel(destino)} ya tiene piezas. ¿Agregar igual las ${origen.length} de ${monthLabel(UI.month)}?`)) return;
  if (!yaHay && !confirm(`Copiar las ${origen.length} piezas de ${monthLabel(UI.month)} a ${monthLabel(destino)}? Los estados vuelven a "Briefing" y las aprobaciones a "Pendiente".`)) return;

  origen.forEach((p) => {
    const nueva = JSON.parse(JSON.stringify(p));
    const dia = p.fecha.slice(8);
    nueva.fecha = `${destino}-${dia}`;
    nueva.mes = destino;
    nueva.estado = "briefing";
    nueva.link = "";
    Object.keys(nueva.aprobaciones).forEach((k) => (nueva.aprobaciones[k] = "pendiente"));
    nueva.id = "pz_" + Date.now() + "_" + Math.abs(hashStr(nueva.campana + nueva.fecha + p.id));
    DB.piezas.push(nueva);
  });
  save();
  UI.month = destino;
  render();
}

/* ---------- Nav global ---------- */
document.querySelectorAll(".nav-item[data-view]").forEach((b) => {
  b.onclick = () => { UI.view = b.dataset.view; render(); };
});
document.querySelectorAll("#modePill button").forEach((b) => {
  b.onclick = () => { UI.mode = b.dataset.mode; render(); };
});
document.getElementById("modalClose").onclick = closeModal;
document.getElementById("overlay").onclick = (e) => { if (e.target.id === "overlay") closeModal(); };
document.getElementById("btnReset").onclick = () => {
  if (confirm("¿Reiniciar a los datos de demostración? Se perderán tus cambios en este navegador.")) {
    DB = JSON.parse(JSON.stringify(SEED));
    save(); UI.month = SEED.meta.mesActual; render();
  }
};

/* ---------- Init ---------- */
render();
