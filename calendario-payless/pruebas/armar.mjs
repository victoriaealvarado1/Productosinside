// Arma un sitio de prueba en pruebas/sitio/: la página del calendario con mock-claude.js.
//
//   node pruebas/armar.mjs [carpeta-de-datos]
//
// carpeta-de-datos: lo que deja ArtifactData list con out_dir (db/<coleccion>/<id>.json).
// Sin carpeta, la página arranca vacía (tiene el botón para cargar el planning de octubre).
// Los datos copiados quedan en pruebas/sitio/datos.json, que no se versiona: tiene datos del cliente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pagina = path.resolve(aqui, "..");
const sitio = path.join(aqui, "sitio");
fs.rmSync(sitio, { recursive: true, force: true });
fs.mkdirSync(sitio, { recursive: true });

const html = fs.readFileSync(path.join(pagina, "index.html"), "utf8");
fs.writeFileSync(path.join(sitio, "index.html"), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="mock-claude.js"></script></head><body>\n${html}\n</body></html>`);
fs.copyFileSync(path.join(aqui, "mock-claude.js"), path.join(sitio, "mock-claude.js"));
for (const f of fs.readdirSync(pagina)) if (f.endsWith(".json")) fs.copyFileSync(path.join(pagina, f), path.join(sitio, f));
fs.cpSync(path.join(pagina, "img"), path.join(sitio, "img"), { recursive: true });

const datos = {};
const origen = process.argv[2];
if (origen) {
  for (const col of fs.readdirSync(origen)) {
    const dir = path.join(origen, col);
    if (!fs.statSync(dir).isDirectory()) continue;
    datos[col] = {};
    for (const f of fs.readdirSync(dir)) if (f.endsWith(".json")) datos[col][f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  }
}
fs.writeFileSync(path.join(sitio, "datos.json"), JSON.stringify(datos));
console.log(`Sitio de prueba listo en ${path.relative(process.cwd(), sitio)} con ${Object.entries(datos).map(([c, d]) => `${c} ${Object.keys(d).length}`).join(", ") || "sin datos"}.`);
console.log("Sírvelo con: python3 -m http.server 8765 --directory " + path.relative(process.cwd(), sitio));
