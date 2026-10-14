# Calendario Payless · versión fuera de Claude

El calendario de contenidos que Inside usa con Payless, publicado en un dominio propio. Es la misma página que corría dentro de Claude. Debajo tiene tres servicios:

- **Supabase**: base de datos con cambios en vivo, inicio de sesión con Google y almacenamiento de los artes.
- **Railway**: el servidor, que entrega la página, protege los archivos y llama a Claude.
- **API de Claude**: para el Asistente, el Director de Arte y el Estratega de la Salud de la cuenta.

## Cómo funciona

```
navegador ── página (dist/index.html) + claude-compat.js
   │            └─ habla con Supabase: login con Google, documentos, tiempo real
   └──────── servidor (server.mjs, en Railway)
                ├─ /_blob/<id>   artes, solo para miembros (URL firmada de Supabase Storage)
                ├─ /api/assets   subir y borrar artes (solo Inside)
                └─ /api/sample   IA con la API de Claude (solo Inside; la clave vive solo en el servidor)
```

- `pagina/`: la página del calendario y sus datos estáticos (planning de octubre e imágenes del seed).
- `public/claude-compat.js`: le da a la página la misma interfaz que tenía en Claude (`claude.use("db" | "user" | "assets" | "sample")`), sobre Supabase y este servidor. Por eso la página casi no cambia.
- `scripts/build.mjs`: arma `dist/` a partir de `pagina/`.
- `supabase/schema.sql`: tablas, permisos y funciones. Solo entran los correos de la tabla `miembros`. **Salud de la cuenta** y **Dirección de arte** las ve solo Inside.
- `scripts/importar.mjs`: carga lo exportado desde Claude (documentos, artes y miembros).
- `scripts/db.mjs`: acceso a la base para la revisión automática de las matrices.

## Puesta en marcha

### 1. Supabase
1. Crea un proyecto en supabase.com. El plan Pro es el recomendado para uso diario: el gratuito se pausa si nadie entra en una semana.
2. En **SQL Editor**, ejecuta `supabase/schema.sql`. Crea las tablas, los permisos y el bucket privado `artes`.
3. En **Project Settings › API**, copia la Project URL, la clave `anon` (pública) y la clave `service_role`. La `service_role` es secreta: solo va en Railway.
4. En **Authentication › URL Configuration**:
   - Site URL: el dominio final, por ejemplo `https://calendario.agenciainside.lat`.
   - Redirect URLs: ese mismo dominio y la URL que te dé Railway.

### 2. Google (inicio de sesión)
1. En console.cloud.google.com, crea un proyecto y configura la **pantalla de consentimiento de OAuth** con el nombre «Calendario Payless».
2. En **Credenciales › Crear ID de cliente de OAuth** (aplicación web), agrega como URI de redireccionamiento autorizado: `https://<tu-proyecto>.supabase.co/auth/v1/callback`.
3. Pega el Client ID y el Client Secret en Supabase, en **Authentication › Providers › Google**, y actívalo.

### 3. Claude (IA)
En console.anthropic.com, crea una clave de la API para Inside. Se paga por uso.

La IA usa Claude Opus 5.5. Los tres niveles de la página se traducen a esfuerzo del modelo: rápido → bajo, normal → medio, complejo → alto. Si Claude declina un pedido, la API reintenta sola con otro modelo (`fallbacks: "default"`). Se puede cambiar el modelo con la variable `CLAUDE_MODEL`.

### 4. Railway
1. **New Project › Deploy from GitHub repo** y elige este repositorio. Railway detecta Node: corre `npm install`, `npm run build` y `npm start`.
2. En **Variables**, carga `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY`. Hay una plantilla en `.env.ejemplo`.
3. Opcional: en **Settings › Healthcheck Path**, pon `/salud`.
4. En **Settings › Networking › Custom Domain**, agrega `calendario.agenciainside.lat`. Railway te da un destino CNAME; quien administra el DNS de agenciainside.lat crea ese registro.

### 5. Quién entra
1. Copia `supabase/miembros.ejemplo.csv` como `miembros.csv`, dentro de la carpeta de exportación. Completa el correo de Google de cada persona y su rol (`inside` o `cliente`).
   - Las filas sin correo quedan como nombres del historial, sin acceso.
   - Los `id` que empiezan con `u_` son los de cada persona en Claude: así sus comentarios anteriores siguen siendo suyos.
2. Cárgalo con `npm run importar -- <carpeta> --solo miembros`, con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno.
3. Para dar de alta o de baja a alguien después, edita la tabla `miembros` en Supabase (**Table Editor**). Pon `activo = false` para quitar el acceso.

## Paso del calendario de Claude a este sitio (corte)

1. **Congelar**: avisar al equipo y al cliente de que, durante el corte, no editen en Claude.
2. **Exportar desde Claude**: lo hace Claude con las herramientas del artefacto. Deja `db/<coleccion>/<id>.json` para cada colección, `archivos/<id>` para cada arte y `archivos.tsv` con el tipo de cada archivo.
3. **Importar**: `npm run importar -- <carpeta>` (miembros, documentos y archivos). Se puede repetir; salta lo que ya está.
4. **Probar** con una cuenta de Inside y una del cliente:
   - que se vean las piezas, los artes y los comentarios;
   - que el cliente no vea la Salud de la cuenta;
   - que el Asistente responda.
5. **Abrir**: compartir el dominio nuevo y dejar en Claude un aviso con el enlace.
6. **Tareas programadas**: la revisión diaria y la horaria de las matrices escriben hoy en la base de Claude. Después del corte tienen que escribir aquí, con `scripts/db.mjs`. Ese entorno necesita `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como secretos, nunca en el repositorio.

## Desarrollo local

```bash
npm install
cp .env.ejemplo .env   # y completa las claves de un proyecto de prueba
npm run build          # usa pagina/; PAGINA_DIR=... para otra carpeta
node --env-file=.env server.mjs
```

## Seguridad
- **Claves**: la `service_role` de Supabase y la de Claude viven solo en las variables de Railway. La página solo recibe la URL y la clave pública `anon`.
- **Base de datos**: todos los permisos se aplican en la base (RLS), no solo en la página. Quien no esté en `miembros` no ve nada, aunque tenga la clave pública.
- **Artes**: están en un bucket privado. El servidor entrega URLs firmadas de una hora solo a miembros.
- **IA y subida de artes**: solo las usa Inside, con un máximo de 3 pedidos a la vez por persona.
