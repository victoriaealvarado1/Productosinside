/* Calendario Payless · capa de compatibilidad.
   La página se escribió para correr dentro de Claude y pide sus servicios con
   claude.use("db" | "user" | "assets" | "sample"). Fuera de Claude, esta capa ofrece
   la misma interfaz sobre Supabase (base de datos, tiempo real y login con Google)
   y sobre el servidor propio (archivos e IA). Debe cargarse antes que la página. */
(function () {
  "use strict";
  const CFG = window.__CFG || {};
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
  });

  /* ------------------------------------------------------------ sesión */
  const HASH_KEY = "cpay:hash";
  let miembro = null;

  function setCookie(token) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = token
      ? `sbat=${token}; Path=/; Max-Age=3600; SameSite=Lax${secure}`
      : `sbat=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
  async function token() {
    const { data } = await sb.auth.getSession();
    return data.session ? data.session.access_token : "";
  }
  sb.auth.onAuthStateChange((ev, session) => {
    setCookie(session ? session.access_token : "");
    if (ev === "SIGNED_OUT") location.reload();
  });

  function overlay(html) {
    let el = document.getElementById("cpayLogin");
    if (!html) { el && el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "cpayLogin";
      el.style.cssText = "position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:16px;background:var(--bg,#f6f4f1);font:14px/1.45 var(--f-body,system-ui,sans-serif);color:var(--ink,#1e1a16)";
      document.body.appendChild(el);
    }
    el.innerHTML = `<div style="width:min(420px,100%);background:var(--surface,#fff);border:1px solid var(--line,#e2dcd4);border-radius:14px;padding:28px 24px;display:flex;flex-direction:column;gap:14px;text-align:center;box-shadow:var(--shadow,none)">
      <div style="font:800 24px/1.1 var(--f-display,system-ui,sans-serif);letter-spacing:-.02em">Payless<span style="color:var(--accent,#ea5b0c)"> · </span>Calendario</div>${html}</div>`;
  }
  const btn = (id, label, primary) =>
    `<button id="${id}" style="border:1px solid ${primary ? "var(--accent,#ea5b0c)" : "var(--line,#e2dcd4)"};background:${primary ? "var(--accent,#ea5b0c)" : "var(--surface,#fff)"};color:${primary ? "var(--accent-ink,#fff)" : "inherit"};border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer">${label}</button>`;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function pedirLogin(msg) {
    overlay(`<p style="margin:0;color:var(--ink-2,#5a5148)">${msg || "Entra con la cuenta de Google que Inside autorizó."}</p>${btn("cpayGoogle", "Entrar con Google", true)}`);
    document.getElementById("cpayGoogle").onclick = async () => {
      try { if (location.hash) sessionStorage.setItem(HASH_KEY, location.hash); } catch (e) {}
      await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
    };
  }

  const domListo = new Promise(ok => {
    if (document.readyState !== "loading") ok(); else document.addEventListener("DOMContentLoaded", ok, { once: true });
  });

  const ready = (async () => {
    const { data } = await sb.auth.getSession();
    await domListo;
    if (!data.session) { pedirLogin(); return new Promise(() => {}); }
    setCookie(data.session.access_token);
    try {
      const h = sessionStorage.getItem(HASH_KEY);
      if (h && !location.hash) history.replaceState(null, "", location.pathname + location.search + h);
      sessionStorage.removeItem(HASH_KEY);
    } catch (e) {}
    const { data: filas, error } = await sb.rpc("yo");
    if (error || !filas || !filas.length) {
      overlay(`<p style="margin:0">La cuenta <b>${esc(data.session.user.email)}</b> no tiene acceso a este calendario.</p>
        <p style="margin:0;color:var(--ink-2,#5a5148)">Pide a Inside que la agregue, o entra con otra cuenta.</p>${btn("cpayOtra", "Usar otra cuenta")}`);
      document.getElementById("cpayOtra").onclick = () => sb.auth.signOut();
      return new Promise(() => {});
    }
    miembro = filas[0];
    overlay(null);
    return miembro;
  })();

  function fallo(error, fallback) {
    const st = error && (error.status || error.code);
    const code = error && error.code === "P0002" ? "not_found"
      : error && error.code === "42501" ? "permission_denied"
      : st === 413 || st === "413" ? "too_large"
      : fallback || "failed";
    return { code, message: (error && error.message) || code };
  }
  const limpio = v => JSON.parse(JSON.stringify(v === undefined ? {} : v));

  /* ------------------------------------------------------------ db */
  const colecciones = new Map();

  function snapshot(st) {
    const docs = [...st.map.entries()].map(([id, data]) => ({ id, exists: true, data: () => data, metadata: {} }));
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [] };
  }
  function emitir(st) {
    clearTimeout(st.timer);
    st.timer = setTimeout(() => { const s = snapshot(st); st.listeners.forEach(l => { try { l.cb(s); } catch (e) { console.error(e); } }); }, 40);
  }
  async function cargar(nombre) {
    const out = new Map();
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await sb.from("docs").select("id,data").eq("coleccion", nombre).order("id").range(desde, desde + 999);
      if (error) throw fallo(error);
      data.forEach(r => out.set(r.id, r.data));
      if (data.length < 1000) return out;
    }
  }
  async function recargarDoc(st, nombre, id) {
    const { data } = await sb.from("docs").select("data").eq("coleccion", nombre).eq("id", id).maybeSingle();
    if (data) st.map.set(id, data.data); else st.map.delete(id);
    emitir(st);
  }
  // Los borrados de Postgres no se pueden filtrar por columna: un solo canal para todos.
  let canalBorrados = null;
  function escucharBorrados() {
    if (canalBorrados) return;
    canalBorrados = sb.channel("docs-borrados")
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "docs" }, p => {
        const old = p.old || {}; const st = colecciones.get(old.coleccion);
        if (st && st.map.delete(old.id)) emitir(st);
      }).subscribe();
  }
  function coleccion(nombre) {
    let st = colecciones.get(nombre);
    if (st) return st;
    st = { map: new Map(), listeners: new Set(), cargada: false, timer: null };
    colecciones.set(nombre, st);
    escucharBorrados();
    const sincronizar = async () => {
      try { st.map = await cargar(nombre); st.cargada = true; emitir(st); }
      catch (e) { st.listeners.forEach(l => l.err && l.err(e)); }
    };
    sb.channel("docs-" + nombre)
      .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: "coleccion=eq." + nombre }, p => {
        if (p.eventType === "DELETE") return;
        const fila = p.new || {};
        if (!("data" in fila)) { recargarDoc(st, nombre, fila.id); return; } // fila muy grande: llega sin datos
        st.map.set(fila.id, fila.data); emitir(st);
      })
      .subscribe(estado => { if (estado === "SUBSCRIBED") sincronizar(); });
    return st;
  }
  function aplicarLocal(nombre, id, data) {
    const st = colecciones.get(nombre); if (!st) return;
    if (data === null) st.map.delete(id); else st.map.set(id, data);
    emitir(st);
  }
  function mezclar(base, patch) {
    const out = { ...(base || {}) };
    for (const [k, v] of Object.entries(patch)) {
      if (v && typeof v === "object" && !Array.isArray(v) && v.__delete__ === true) delete out[k]; else out[k] = v;
    }
    return out;
  }
  function docRef(nombre, id) {
    return {
      id,
      async get() {
        const { data, error } = await sb.from("docs").select("data").eq("coleccion", nombre).eq("id", id).maybeSingle();
        if (error) throw fallo(error);
        return { id, exists: !!data, data: () => (data ? data.data : undefined) };
      },
      async set(v) {
        const data = limpio(v);
        const { error } = await sb.from("docs").upsert({ coleccion: nombre, id, data });
        if (error) throw fallo(error);
        aplicarLocal(nombre, id, data);
      },
      async update(v) {
        const patch = limpio(v);
        const { error } = await sb.rpc("doc_update", { p_coleccion: nombre, p_id: id, p_patch: patch });
        if (error) throw fallo(error, "invalid_argument");
        const st = colecciones.get(nombre);
        if (st && st.map.has(id)) aplicarLocal(nombre, id, mezclar(st.map.get(id), patch));
      },
      async delete() {
        const { error } = await sb.from("docs").delete().eq("coleccion", nombre).eq("id", id);
        if (error) throw fallo(error);
        aplicarLocal(nombre, id, null);
      },
    };
  }
  const nuevoId = () => [...crypto.getRandomValues(new Uint8Array(10))].map(b => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
  const db = {
    collection(nombre) {
      return {
        doc: id => docRef(nombre, id || nuevoId()),
        async add(v) { const ref = docRef(nombre, nuevoId()); await ref.set(v); return ref; },
        async get() { return snapshot({ map: await cargar(nombre) }); },
        onSnapshot(cb, err) {
          const st = coleccion(nombre), l = { cb, err };
          st.listeners.add(l);
          if (st.cargada) setTimeout(() => cb(snapshot(st)), 0);
          return () => st.listeners.delete(l);
        },
      };
    },
    doc(ruta) {
      const i = String(ruta).indexOf("/");
      return docRef(ruta.slice(0, i), ruta.slice(i + 1));
    },
  };

  /* ------------------------------------------------------------ user */
  const perfilCache = new Map();
  const user = {
    async id() { return miembro.id; },
    async me() { return { id: miembro.id, name: miembro.nombre, email: miembro.email }; },
    async canEdit() { return miembro.rol === "inside"; },
    async can() { return true; },
    async isOwner() { return !!miembro.dueno; },
    async profiles(ids) {
      const faltan = [...new Set(ids)].filter(id => id && !perfilCache.has(id));
      if (faltan.length) {
        const { data } = await sb.rpc("perfiles", { ids: faltan });
        (data || []).forEach(p => perfilCache.set(p.id, { id: p.id, name: p.nombre, guest: p.rol === "cliente" }));
        faltan.forEach(id => { if (!perfilCache.has(id)) perfilCache.set(id, null); });
      }
      const out = {};
      ids.forEach(id => { const p = perfilCache.get(id); if (p) out[id] = p; });
      return out;
    },
    async search() { return []; },
  };

  /* ------------------------------------------------------------ assets (solo Inside) */
  async function api(ruta, init = {}) {
    const res = await fetch(ruta, { ...init, headers: { ...(init.headers || {}), Authorization: "Bearer " + (await token()) } });
    if (!res.ok) {
      let body = {}; try { body = await res.json(); } catch (e) {}
      throw { code: (body.error && body.error.code) || (res.status === 413 ? "too_large" : res.status === 429 ? "rate_limited" : "failed"),
              message: (body.error && body.error.message) || res.statusText };
    }
    return res;
  }
  const assets = {
    async upload(blob) {
      const res = await api("/api/assets", { method: "POST", headers: { "Content-Type": blob.type || "application/octet-stream" }, body: blob });
      return res.json();
    },
    async list() { return (await api("/api/assets")).json(); },
    async delete(id) { await api("/api/assets/" + encodeURIComponent(id), { method: "DELETE" }); },
  };

  /* ------------------------------------------------------------ sample (IA, solo Inside) */
  const aBase64 = blob => new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.onerror = () => mal(r.error);
    r.readAsDataURL(blob);
  });
  async function pedir(input, opts, json) {
    opts = opts || {};
    const lista = opts.images ? (typeof FileList !== "undefined" && opts.images instanceof FileList ? [...opts.images] : [].concat(opts.images)) : [];
    const images = await Promise.all(lista.slice(0, 5).map(async b => ({ media_type: b.type || "image/jpeg", data: await aBase64(b) })));
    const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
    let res;
    try {
      res = await api("/api/sample", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, images, tier: opts.modelTier || "default", json }),
        signal: opts.signal,
      });
    } catch (e) {
      if (e && e.name === "AbortError") throw { code: "cancelled", message: "cancelled" };
      throw e;
    }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "", text = "", fin = null;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const linea = buf.slice(0, i); buf = buf.slice(i + 1);
          if (!linea.trim()) continue;
          const m = JSON.parse(linea);
          if (m.d) { text += m.d; if (opts.onText) opts.onText({ text, delta: m.d }); }
          else if (m.error) throw { code: m.error.code, message: m.error.message, text };
          else if (m.done) fin = { text: m.text != null ? m.text : text, truncated: !!m.truncated };
        }
      }
    } catch (e) {
      if (e && e.name === "AbortError") throw { code: "cancelled", message: "cancelled", text };
      throw e;
    }
    if (!fin) throw { code: "failed", message: "La respuesta se cortó.", text };
    return fin;
  }
  function leerJSON(t) {
    let s = String(t || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    try { return JSON.parse(s); } catch (e) {}
    const a = s.search(/[\[{]/), b = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) {} }
    throw { code: "invalid_json", message: "La respuesta no vino en JSON." };
  }
  const sample = (input, opts) => pedir(input, opts, false);
  sample.json = async (input, opts) => leerJSON((await pedir(input, opts, true)).text);
  sample.limits = async () => ({ inputBytes: 400000, images: { maxCount: 5, maxBytes: 5 * 1024 * 1024, mediaTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] } });

  /* ------------------------------------------------------------ claude.use */
  const servicios = { db: () => db, user: () => user, assets: m => (m.rol === "inside" ? assets : null), sample: m => (m.rol === "inside" ? sample : null) };
  window.claude = Object.freeze({
    use(nombre) {
      return ready.then(m => (servicios[nombre] ? servicios[nombre](m) : null));
    },
  });
  window.cpaySalir = () => sb.auth.signOut();
})();
