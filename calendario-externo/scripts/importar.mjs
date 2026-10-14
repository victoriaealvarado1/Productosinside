// Importa a Supabase lo exportado desde el calendario de Claude.
//
//   node scripts/importar.mjs <carpeta> [--solo docs|archivos|miembros]
//
// <carpeta>/
//   db/<coleccion>/<id>.json   un archivo por documento (el formato que deja la exportación de Claude)
//   archivos/<id>[.ext]        los archivos de las piezas, con su id de 32 caracteres como nombre
//   archivos.tsv               id, tipo, bytes… (de la lista de archivos de Claude) para el tipo de cada archivo
//   miembros.csv               id,email,nombre,rol,dueno  (no se versiona: tiene correos)
//
// Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno. Se puede volver a correr:
// los documentos se reemplazan y los archivos que ya están se saltan.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [carpeta, ...resto] = process.argv.slice(2);
const solo = resto[0] === "--solo" ? resto[1] : null;
if (!carpeta || !fs.existsSync(carpeta)) { console.error("Uso: node scripts/importar.mjs <carpeta> [--solo docs|archivos|miembros]"); process.exit(1); }
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!process.env[k]) { console.error(`Falta ${k}`); process.exit(1); }
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = "artes";

async function miembros() {
  const f = path.join(carpeta, "miembros.csv");
  if (!fs.existsSync(f)) { console.log("miembros: no hay miembros.csv, se salta"); return; }
  const [cab, ...filas] = fs.readFileSync(f, "utf8").split(/\r?\n/).filter(l => l.trim());
  const cols = cab.split(",").map(s => s.trim());
  const rows = filas.map(l => {
    const v = l.split(",").map(s => s.trim()); const o = Object.fromEntries(cols.map((c, i) => [c, v[i] || ""]));
    if (!o.id || !o.nombre || !["inside", "cliente"].includes(o.rol)) throw new Error(`Fila inválida en miembros.csv: ${l}`);
    return { id: o.id, email: o.email ? o.email.toLowerCase() : null, nombre: o.nombre, rol: o.rol, dueno: /^(true|si|sí|1)$/i.test(o.dueno), activo: !!o.email };
  });
  const { error } = await sb.from("miembros").upsert(rows);
  if (error) throw error;
  console.log(`miembros: ${rows.length} (${rows.filter(r => r.activo).length} con acceso)`);
}

async function docs() {
  const base = path.join(carpeta, "db");
  let total = 0;
  for (const coleccion of fs.readdirSync(base)) {
    const dir = path.join(base, coleccion);
    if (!fs.statSync(dir).isDirectory()) continue;
    const rows = fs.readdirSync(dir).filter(f => f.endsWith(".json"))
      .map(f => ({ coleccion, id: f.slice(0, -5), data: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await sb.from("docs").upsert(rows.slice(i, i + 200));
      if (error) throw new Error(`${coleccion}: ${error.message}`);
    }
    total += rows.length;
    console.log(`docs: ${coleccion} ${rows.length}`);
  }
  console.log(`docs: ${total} en total`);
}

async function archivos() {
  const dir = path.join(carpeta, "archivos");
  if (!fs.existsSync(dir)) { console.log("archivos: no hay carpeta archivos/, se salta"); return; }
  const tipos = new Map();
  const tsv = path.join(carpeta, "archivos.tsv");
  if (fs.existsSync(tsv)) fs.readFileSync(tsv, "utf8").split("\n").forEach(l => { const [id, tipo] = l.split("\t"); if (id) tipos.set(id, tipo); });
  const ya = new Set();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(BUCKET).list("", { limit: 1000, offset });
    if (error) throw error;
    data.forEach(f => ya.add(f.name));
    if (data.length < 1000) break;
  }
  const pendientes = fs.readdirSync(dir).map(f => ({ f, id: f.split(".")[0] })).filter(x => /^[0-9a-f]{32}$/.test(x.id) && !ya.has(x.id));
  let hechos = 0, fallos = 0;
  const trabajar = async () => {
    for (let x; (x = pendientes.shift());) {
      const cuerpo = fs.readFileSync(path.join(dir, x.f));
      const { error } = await sb.storage.from(BUCKET).upload(x.id, cuerpo, { contentType: tipos.get(x.id) || "application/octet-stream", upsert: false });
      if (error) { fallos++; console.error(`archivos: ${x.id} ${error.message}`); } else if (++hechos % 50 === 0) console.log(`archivos: ${hechos} subidos`);
    }
  };
  await Promise.all([1, 2, 3, 4].map(trabajar));
  console.log(`archivos: ${hechos} subidos, ${ya.size} ya estaban, ${fallos} con error`);
  if (fallos) process.exitCode = 1;
}

const pasos = { miembros, docs, archivos };
for (const [nombre, paso] of Object.entries(pasos)) if (!solo || solo === nombre) await paso();
