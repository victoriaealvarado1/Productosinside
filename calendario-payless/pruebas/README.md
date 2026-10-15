# Banco de pruebas del calendario

Corre la página fuera de claude.ai, con los servicios de Claude simulados en `mock-claude.js`:

- **base de datos:** en memoria;
- **sesión:** la de Inside o la del cliente;
- **archivos:** subidas simuladas;
- **IA:** opcional.

Sirve para probar un cambio de `index.html` antes de publicarlo. Las reglas de acceso de `salud` y `direccion` también se simulan: el cliente no las ve.

1. **Opcional: bajar los datos reales.** Con `ArtifactData` (acción `list`, `out_dir` a una carpeta temporal) se baja cada colección del calendario. Se usa la URL del calendario y `query.limit` de 1000, siguiendo `next_cursor` en `comentarios` y `salud`. No guardes esa carpeta en el repositorio: son datos del cliente.
2. **Armar el sitio:** `node calendario-payless/pruebas/armar.mjs [carpeta-de-datos]`. Lo deja en `pruebas/sitio/`, que no se versiona.
3. **Servirlo:** `python3 -m http.server 8765 --directory calendario-payless/pruebas/sitio`.
4. **Probar:** `PW=$(npm root -g)/playwright node calendario-payless/pruebas/probar.cjs`. Abre la página como Inside y como cliente, saca capturas y avisa si hay errores de página.

Parámetros de la URL:

- `?rol=inside` o `?rol=cliente`;
- `?ia=si` para tener IA simulada. Para fijar la respuesta JSON, asigna `window.__respuestaIA` antes de pedirla.

Lo que la página escribe queda en `window.__escrituras`, y los pedidos a la IA en `window.__pedidosIA`.
