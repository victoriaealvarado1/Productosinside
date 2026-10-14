// Calendario Payless · servidor (Railway).
// - Entrega la página construida en dist/ (npm run build).
// - /config.js: datos públicos de Supabase para el navegador.
// - /_blob/<id>: archivos de las piezas, solo para miembros (redirige a una URL firmada de Supabase Storage).
// - /api/assets: subir, listar y borrar archivos (solo Inside).
// - /api/sample: IA con la API de Claude (solo Inside). La clave vive solo aquí, como variable de entorno.
import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;
for (const k of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]) {
  if (!env[k]) { console.error(`Falta la variable de entorno ${k}`); process.exit(1); }
}
const BUCKET = "artes";
const MODELO = env.CLAUDE_MODEL || "claude-opus-5-5";
// Los niveles que pide la página se traducen a esfuerzo del mismo modelo.
const ESFUERZO = { quick: "low", default: "medium", complex: "high" };

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const claude = new Anthropic();

// ---------------------------------------------------------------- quién llama
const sesiones = new Map(); // token -> { miembro, vence }
async function quien(req) {
  const h = req.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : (req.get("cookie") || "").match(/(?:^|;\s*)sbat=([^;]+)/)?.[1];
  if (!token) return null;
  const c = sesiones.get(token);
  if (c && c.vence > Date.now()) return c.miembro;
  const { data, error } = await admin.auth.getUser(token);
  const email = !error && data.user && data.user.email ? data.user.email.toLowerCase() : "";
  let miembro = null;
  if (email) {
    const { data: m } = await admin.from("miembros").select("id,nombre,rol,dueno").eq("email", email).eq("activo", true).maybeSingle();
    miembro = m || null;
  }
  if (sesiones.size > 1000) sesiones.clear();
  sesiones.set(token, { miembro, vence: Date.now() + 5 * 60 * 1000 });
  return miembro;
}
const error = (res, status, code, message) => res.status(status).json({ error: { code, message } });
function exigir(rol) {
  return async (req, res, next) => {
    try {
      const m = await quien(req);
      if (!m) return error(res, 401, "not_granted", "Inicia sesión con una cuenta autorizada.");
      if (rol && m.rol !== rol) return error(res, 403, "not_granted", "Solo Inside puede usar esto.");
      req.miembro = m; next();
    } catch (e) { next(e); }
  };
}
const ID = /^[0-9a-f]{32}$/;

// ---------------------------------------------------------------- app
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "X-Frame-Options": "SAMEORIGIN" });
  next();
});

app.get("/config.js", (req, res) => {
  res.type("application/javascript").set("Cache-Control", "no-store")
    .send(`window.__CFG=${JSON.stringify({ supabaseUrl: env.SUPABASE_URL, supabaseAnonKey: env.SUPABASE_ANON_KEY })};`);
});
app.get("/vendor/supabase.js", (req, res) => {
  res.sendFile(path.join(aqui, "node_modules/@supabase/supabase-js/dist/umd/supabase.js"), { maxAge: "1d" });
});
app.get("/salud", (req, res) => res.json({ ok: true }));

// Archivos de las piezas
app.get("/_blob/:id", exigir(), async (req, res, next) => {
  try {
    if (!ID.test(req.params.id)) return error(res, 404, "not_found", "No existe.");
    const { data, error: e } = await admin.storage.from(BUCKET).createSignedUrl(req.params.id, 3600);
    if (e || !data) return error(res, 404, "not_found", "No existe.");
    res.set("Cache-Control", "private, max-age=3000").redirect(302, data.signedUrl);
  } catch (e) { next(e); }
});

app.post("/api/assets", exigir("inside"), express.raw({ type: () => true, limit: "25mb" }), async (req, res, next) => {
  try {
    if (!req.body || !req.body.length) return error(res, 400, "invalid_argument", "El archivo está vacío.");
    const id = crypto.randomBytes(16).toString("hex");
    const contentType = req.get("content-type") || "application/octet-stream";
    const { error: e } = await admin.storage.from(BUCKET).upload(id, req.body, { contentType, upsert: false });
    if (e) return error(res, 502, "failed", e.message);
    res.json({ id, url: "/_blob/" + id, sizeBytes: req.body.length, contentType });
  } catch (e) { next(e); }
});
app.get("/api/assets", exigir("inside"), async (req, res, next) => {
  try {
    const assets = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error: e } = await admin.storage.from(BUCKET).list("", { limit: 1000, offset });
      if (e) return error(res, 502, "failed", e.message);
      data.forEach(f => assets.push({ id: f.name, url: "/_blob/" + f.name, sizeBytes: f.metadata?.size || 0, contentType: f.metadata?.mimetype || "", createdAt: f.created_at }));
      if (data.length < 1000) break;
    }
    res.json({ assets, usage: { count: assets.length, bytes: assets.reduce((s, a) => s + a.sizeBytes, 0) } });
  } catch (e) { next(e); }
});
app.delete("/api/assets/:id", exigir("inside"), async (req, res, next) => {
  try {
    if (!ID.test(req.params.id)) return error(res, 404, "not_found", "No existe.");
    const { error: e } = await admin.storage.from(BUCKET).remove([req.params.id]);
    if (e) return error(res, 502, "failed", e.message);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// IA: responde en NDJSON, una línea por fragmento: {"d":"texto"} … {"done":true,"text":"…","truncated":false}
const SISTEMA_JSON = "Responde únicamente con JSON válido, sin texto antes ni después y sin bloques de código.";
const enCurso = new Map(); // miembro -> pedidos abiertos
app.post("/api/sample", exigir("inside"), express.json({ limit: "30mb" }), async (req, res) => {
  const { messages, images = [], tier = "default", json = false } = req.body || {};
  const turnos = Array.isArray(messages) ? messages.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content) : [];
  if (!turnos.length || turnos[0].role !== "user" || turnos[turnos.length - 1].role !== "user")
    return error(res, 400, "invalid_argument", "La conversación debe empezar y terminar con un turno del usuario.");
  if (turnos.reduce((s, m) => s + m.content.length, 0) > 400000) return error(res, 413, "prompt_too_large", "El pedido es demasiado largo.");
  const quienPide = req.miembro.id;
  if ((enCurso.get(quienPide) || 0) >= 3) return error(res, 429, "rate_limited", "Hay demasiados pedidos en curso.");

  const ultimo = turnos[turnos.length - 1];
  const imgs = (Array.isArray(images) ? images : []).slice(0, 5).filter(i => i && typeof i.data === "string" && /^image\/(jpeg|png|webp|gif)$/.test(i.media_type));
  const mensajes = turnos.slice(0, -1).map(m => ({ role: m.role, content: m.content })).concat([{
    role: "user",
    content: [...imgs.map(i => ({ type: "image", source: { type: "base64", media_type: i.media_type, data: i.data } })), { type: "text", text: ultimo.content }],
  }]);

  enCurso.set(quienPide, (enCurso.get(quienPide) || 0) + 1);
  const corte = new AbortController();
  res.on("close", () => { if (!res.writableEnded) corte.abort(); });
  res.status(200).set({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" });
  const escribir = o => res.write(JSON.stringify(o) + "\n");
  try {
    const stream = claude.beta.messages.stream({
      model: MODELO,
      max_tokens: 64000,
      output_config: { effort: ESFUERZO[tier] || ESFUERZO.default },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      ...(json ? { system: SISTEMA_JSON } : {}),
      messages: mensajes,
    }, { signal: corte.signal });
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") escribir({ d: ev.delta.text });
    }
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") escribir({ error: { code: "refused", message: "Claude no pudo responder a este pedido." } });
    else escribir({ done: true, text: msg.content.filter(b => b.type === "text").map(b => b.text).join(""), truncated: msg.stop_reason === "max_tokens" });
  } catch (e) {
    if (e instanceof Anthropic.APIUserAbortError || corte.signal.aborted) { /* la persona canceló */ }
    else if (e instanceof Anthropic.RateLimitError) escribir({ error: { code: "rate_limited", message: "Claude está ocupado; intenta en unos minutos." } });
    else if (e instanceof Anthropic.APIError) { console.error("Claude API", e.status, e.message); escribir({ error: { code: "upstream", message: "No se pudo generar la respuesta." } }); }
    else { console.error(e); escribir({ error: { code: "failed", message: "No se pudo generar la respuesta." } }); }
  } finally {
    enCurso.set(quienPide, Math.max(0, (enCurso.get(quienPide) || 1) - 1));
    res.end();
  }
});

app.use(express.static(path.join(aqui, "dist"), { index: "index.html", maxAge: "5m" }));
app.use((err, req, res, next) => { console.error(err); if (!res.headersSent) error(res, 500, "failed", "Error del servidor."); });

const PORT = Number(env.PORT) || 3000;
app.listen(PORT, () => console.log(`Calendario Payless en el puerto ${PORT}`));
