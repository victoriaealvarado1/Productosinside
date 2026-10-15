// Prueba rápida en el navegador: abre el sitio como Inside y como cliente y avisa errores.
//   PW=$(npm root -g)/playwright node pruebas/probar.cjs   (con el sitio servido en el puerto 8765)
const { chromium } = require(process.env.PW || "playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const errores = [];
  for (const rol of ["inside", "cliente"]) {
    const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
    p.on("pageerror", e => errores.push(`${rol}: ${e.message}`));
    await p.goto(`http://127.0.0.1:8765/?rol=${rol}&ia=si`);
    await p.waitForTimeout(2500);
    const estado = await p.evaluate(() => ({ rol: S.role, modo: S.mode, piezas: S.posts.size, medios: S.medios.size, comentarios: S.comments.length, salud: S.salud.size }));
    console.log(rol, JSON.stringify(estado));
    await p.screenshot({ path: `pruebas/sitio/${rol}.png` });
    await p.close();
  }
  console.log(errores.length ? "Errores:\n" + errores.join("\n") : "Sin errores de página.");
  await b.close();
})();
