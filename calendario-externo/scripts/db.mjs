// Acceso directo a la base para las tareas automáticas (la revisión diaria de las matrices).
// Usa la clave de servicio: solo en entornos de Inside, nunca en el navegador.
//
//   node scripts/db.mjs list <coleccion> [--out carpeta]   lista (o guarda un .json por documento)
//   node scripts/db.mjs get <coleccion> <id>
//   node scripts/db.mjs set <coleccion> <id> <archivo.json>      reemplaza el documento
//   node scripts/db.mjs update <coleccion> <id> <archivo.json>   mezcla campos; {"__delete__":true} borra un campo
//   node scripts/db.mjs delete <coleccion> <id>
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!process.env[k]) { console.error(`Falta ${k}`); process.exit(1); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const [accion, coleccion, id, archivo] = process.argv.slice(2);
const leer = f => JSON.parse(fs.readFileSync(f, "utf8"));
const fallar = e => { console.error(e.message || e); process.exit(1); };

if (accion === "list") {
  const out = process.argv.indexOf("--out") > 0 ? process.argv[process.argv.indexOf("--out") + 1] : null;
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await sb.from("docs").select("id,data,version").eq("coleccion", coleccion).order("id").range(desde, desde + 999);
    if (error) fallar(error);
    filas.push(...data);
    if (data.length < 1000) break;
  }
  if (out) {
    const dir = path.join(out, coleccion); fs.mkdirSync(dir, { recursive: true });
    filas.forEach(f => fs.writeFileSync(path.join(dir, f.id + ".json"), JSON.stringify(f.data, null, 1)));
    console.log(`${filas.length} documentos en ${dir}`);
  } else console.log(JSON.stringify(filas.map(f => ({ id: f.id, version: f.version, data: f.data }))));
} else if (accion === "get") {
  const { data, error } = await sb.from("docs").select("data,version").eq("coleccion", coleccion).eq("id", id).maybeSingle();
  if (error) fallar(error);
  console.log(JSON.stringify(data));
} else if (accion === "set") {
  const { error } = await sb.from("docs").upsert({ coleccion, id, data: leer(archivo) });
  if (error) fallar(error); console.log("ok");
} else if (accion === "update") {
  const { data, error } = await sb.rpc("doc_update", { p_coleccion: coleccion, p_id: id, p_patch: leer(archivo) });
  if (error) fallar(error); console.log(`ok, versión ${data}`);
} else if (accion === "delete") {
  const { error } = await sb.from("docs").delete().eq("coleccion", coleccion).eq("id", id);
  if (error) fallar(error); console.log("ok");
} else {
  console.error("Uso: node scripts/db.mjs list|get|set|update|delete <coleccion> [id] [archivo.json]");
  process.exit(1);
}
