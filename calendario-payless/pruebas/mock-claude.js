/* Banco de pruebas: reemplaza los servicios de Claude (claude.use) para correr la página
   fuera de claude.ai. Datos en memoria, cargados desde datos.json (ver armar.mjs).
   Parámetros en la URL: ?rol=inside|cliente  ·  ?ia=si (respuestas de IA simuladas) */
(function () {
  const q = new URLSearchParams(location.search), rol = q.get("rol") || "inside";
  const data = new Map(), oyentes = [];
  const coll = n => { if (!data.has(n)) data.set(n, new Map()); return data.get(n); };
  const privada = n => n === "salud" || n === "direccion";
  const puede = n => rol === "inside" || !privada(n);
  const listo = fetch("datos.json").then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(seed => {
    for (const [n, docs] of Object.entries(seed)) for (const [id, d] of Object.entries(docs)) coll(n).set(id, d);
  });
  const snap = n => { const docs = puede(n) ? [...coll(n).entries()].map(([id, v]) => ({ id, exists: true, data: () => v, metadata: {} })) : []; return { docs, size: docs.length, empty: !docs.length, docChanges: () => [] }; };
  const avisar = n => setTimeout(() => oyentes.filter(l => l.n === n).forEach(l => l.cb(snap(n))), 5);
  const copia = v => JSON.parse(JSON.stringify(v));
  window.__escrituras = [];
  const ref = (n, id) => ({
    id,
    get: async () => { await listo; return { id, exists: puede(n) && coll(n).has(id), data: () => (puede(n) ? coll(n).get(id) : undefined) }; },
    set: async v => { await listo; if (!puede(n)) throw { code: "permission_denied" }; coll(n).set(id, copia(v)); window.__escrituras.push(["set", n, id]); avisar(n); },
    update: async v => {
      await listo; if (!puede(n) || !coll(n).has(id)) throw { code: "invalid_argument" };
      const d = { ...coll(n).get(id) };
      for (const [k, x] of Object.entries(copia(v))) { if (x && x.__delete__) delete d[k]; else d[k] = x; }
      coll(n).set(id, d); window.__escrituras.push(["update", n, id]); avisar(n);
    },
    delete: async () => { await listo; if (!puede(n)) throw { code: "permission_denied" }; coll(n).delete(id); window.__escrituras.push(["delete", n, id]); avisar(n); },
  });
  const nuevoId = () => Math.random().toString(36).slice(2, 14);
  const db = {
    collection: n => ({
      doc: id => ref(n, id || nuevoId()),
      add: async v => { const r = ref(n, nuevoId()); await r.set(v); return r; },
      onSnapshot: (cb, err) => { oyentes.push({ n, cb }); listo.then(() => setTimeout(() => cb(snap(n)), 5)); return () => {}; },
    }),
    doc: p => { const i = p.indexOf("/"); return ref(p.slice(0, i), p.slice(i + 1)); },
  };
  const yo = rol === "inside" ? { id: "u_prueba_inside", name: "Prueba Inside" } : { id: "u_prueba_cliente", name: "Prueba Cliente" };
  const user = {
    id: async () => yo.id, me: async () => yo, canEdit: async () => rol === "inside", can: async () => true, isOwner: async () => rol === "inside",
    profiles: async ids => Object.fromEntries(ids.map(i => [i, { id: i, guest: rol !== "inside" && i === yo.id, name: i === yo.id ? yo.name : "Persona " + String(i).slice(-4) }])),
  };
  let subidas = 0;
  const assets = { upload: async b => { subidas++; return { id: "prueba" + subidas, url: "/_blob/prueba" + subidas, sizeBytes: b.size || 0 }; } };
  // IA simulada: devuelve un texto o un JSON vacío; sirve para probar la interfaz, no las respuestas.
  window.__pedidosIA = [];
  const sample = async (input, opts) => { window.__pedidosIA.push({ input, imagenes: opts && opts.images ? [].concat(opts.images).length : 0 }); return { text: "Respuesta de prueba.", truncated: false }; };
  sample.json = async (input, opts) => { window.__pedidosIA.push({ input, imagenes: opts && opts.images ? [].concat(opts.images).length : 0, json: true }); return window.__respuestaIA || {}; };
  sample.limits = async () => ({ images: { maxCount: 5, mediaTypes: ["image/jpeg", "image/png"] } });
  const servicios = { db, user, assets: rol === "inside" ? assets : null, sample: rol === "inside" && q.get("ia") === "si" ? sample : null };
  window.__datos = data;
  window.claude = { use: async n => servicios[n] || null };
})();
