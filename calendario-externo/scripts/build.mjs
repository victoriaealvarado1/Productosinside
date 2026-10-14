// Construye dist/: la página del calendario lista para correr fuera de Claude.
// Toma la página de pagina/ (o de PAGINA_DIR), le agrega la capa de compatibilidad
// y cambia lo poco que dependía de claude.ai.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origen = path.resolve(raiz, process.env.PAGINA_DIR || "pagina");
const destino = path.join(raiz, "dist");
if (!fs.existsSync(path.join(origen, "index.html"))) {
  console.error(`No encuentro la página en ${origen}. Define PAGINA_DIR o copia el calendario en pagina/.`);
  process.exit(1);
}

let html = fs.readFileSync(path.join(origen, "index.html"), "utf8");
const cambios = [
  // Enlaces para compartir piezas y envíos: ahora apuntan a este sitio.
  [/const ARTIFACT_URL="https:\/\/claude\.ai\/artifact\/[^"]+";/, 'const ARTIFACT_URL=location.origin+"/";'],
  ["Abre esta página desde tu cuenta de claude.ai para aprobar, comentar o editar.", "Recarga la página o vuelve a entrar con tu cuenta para aprobar, comentar o editar."],
  // Botón para cerrar sesión junto a la etiqueta de rol.
  ['<span id="rolePill" class="pill role-offline">Cargando…</span>', '<span id="rolePill" class="pill role-offline">Cargando…</span><button class="pill inbox" type="button" onclick="cpaySalir()" title="Cerrar sesión">Salir</button>'],
];
for (const [de, a] of cambios) {
  const n = typeof de === "string" ? html.split(de).length - 1 : (html.match(new RegExp(de, "g")) || []).length;
  if (n !== 1) { console.error(`Cambio no aplicado (${n} coincidencias): ${de}`); process.exit(1); }
  html = html.replace(de, a);
}

// La página publicada en Claude no trae <head>: se lo damos aquí, con el mismo reset que ponía Claude.
const doc = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>
<script src="/config.js"></script>
<script src="/vendor/supabase.js"></script>
<script src="/claude-compat.js"></script>
</head>
<body>
${html}
</body>
</html>
`;

fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, "index.html"), doc);
fs.copyFileSync(path.join(raiz, "public", "claude-compat.js"), path.join(destino, "claude-compat.js"));
// Datos estáticos que la página carga con fetch (planning, medios, seed) y sus imágenes.
for (const f of fs.readdirSync(origen)) {
  if (f.endsWith(".json")) fs.copyFileSync(path.join(origen, f), path.join(destino, f));
}
if (fs.existsSync(path.join(origen, "img"))) fs.cpSync(path.join(origen, "img"), path.join(destino, "img"), { recursive: true });
console.log(`dist/ listo (${(doc.length / 1024).toFixed(0)} KB) desde ${path.relative(raiz, origen) || "."}`);
