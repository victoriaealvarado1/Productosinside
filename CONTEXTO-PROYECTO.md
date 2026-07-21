# GESTIÓN INSIDE — Documento de contexto del proyecto
**Para continuar el desarrollo en otro chat. Actualizado: 5 de julio de 2026.**

---

## 1. Qué es

**Gestión Inside** es la herramienta interna de la agencia **Inside** para operar la cuenta **Payless** (retail de calzado, ~12 países en 3 regiones). Reemplaza los Excel de estatus y calendarios manuales. Nació de reuniones reales (kick off con el cliente el 3 jul 2026 + reuniones internas Victoria Alvarado / Alexandra León Raffo) y se construyó iterativamente validando cada fase con la dueña del producto (Victoria).

- **Artifact publicado (privado)**: https://claude.ai/code/artifact/c6756140-4d51-4d5d-96fc-3bfee497645c — se actualiza pasando el parámetro `url` con ese link al publicar.
- **Repositorio**: `victoriaealvarado1/Productosinside`, rama `claude/marketing-automation-platform-n72uw9` (todo el desarrollo va a esa rama; no crear PRs salvo pedido explícito).

## 2. Stack y arquitectura

- **Vanilla JS, sin build ni backend.** Persistencia en `localStorage`.
- Archivos: `index.html` (shell + sidebar), `css/styles.css`, `js/data.js` (SEED con datos reales), `js/app.js` (estado `UI`, base `DB`, router `render()`, vistas, modales, wiring en `wireContent()`).
- **Clave de localStorage**: `gestion_inside_v2_4` (se bumpea al cambiar el esquema; `load()` tiene migraciones suaves: agrega bloques faltantes desde SEED, deriva `estado` de pendientes, remapea áreas/personas, agrega personas nuevas).
- `HOY` se deriva de la fecha real (`new Date()`); `HOY_MAS_2` para riesgo.
- **Publicación**: se concatena todo en un solo HTML (title + `<style>` + body sin los `<script src>` + data.js + app.js inline) y se publica como artifact con el `url` de arriba. Los artifacts bloquean recursos externos (la fuente Google cae a system font, aceptable).
- **Verificación**: cada cambio se prueba con Playwright (chromium en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) sirviendo la carpeta por HTTP y simulando los flujos (drag & drop sintético con `DragEvent` + `DataTransfer`). Cero errores de consola como criterio de salida.

## 3. Menú (en este orden, decidido por la usuaria)

1. **📚 Información general** (solo interno): masterdoc (ficha del cliente, documentación base con estado ciclable Pendiente→En proceso→Entregado y links, fechas clave del ciclo mensual: drivers el 20, planning, reunión el 25, reporte los jueves), cuentas IG por país **SIN contraseñas**, y **Aprendizajes** de la cuenta (lista con fecha/fuente, se agregan al vuelo; 7 sembrados de las reuniones).
2. **🗂️ Estructura de cuenta**: territorios (Centroamérica: GT/SV/HN/NI/CR · Sur: EC/CO/PA · Caribe: RD/Jamaica/Trinidad/Barbados/Guyana/Islas Vírgenes), campañas, equipo Inside y contactos Payless con cuántas piezas aprueba cada uno.
3. **📋 Gestión** — dos pestañas:
   - **Gestión general** (el corazón; detalle en §4)
   - **Gestión mensual**: los 5 grupos de matrices del mes (Matriz Malls, Matriz Pauta con subs ECOM/WA/PMAX/Tiendas, Matriz ATL, Matriz Orgánica, Campañas) × región, con drill-down, avance %, estado, link al documento y **pendientes vinculados** a cada matriz. Duplicar estructura de mes.
4. **📅 Calendario** de publicación: grid mensual + lista, piezas con campaña/canal (FB/IG/WA)/formato (íconos)/región (color de fondo)/estado de producción (borde)/aprobación del cliente (✓⏳✕), países objetivo por pieza, **drag & drop entre días**, backlog "Por asignar fecha" (drag para poner/quitar fecha), filtros multi-región (chips) + campaña/canal/formato/producción/aprobación + búsqueda, "Duplicar mes", 🔴 en riesgo (publica ≤2 días sin aprobación) y ⚠️ atrasada.
5. **🚀 Roadmap v2**.

**Modo Interno / Cliente** (toggle superior): el cliente solo ve el calendario (aprueba/pide ajustes con comentario por pieza, selector "estás como [contacto]", "solo lo mío") y sus propios pendientes en Gestión (con botón "📬 Ya lo envié" que escribe en el historial). No ve Información general, masterdoc, pendientes internos ni carga del equipo.

## 4. Gestión general (rediseñada 2 veces: experto Notion + auditoría UX anti-caos)

**Concepto clave (pedido explícito)**: es GESTIÓN GENERAL como su viejo Excel — responsables genéricos **INSIDE** y **PAYLESS** por defecto; asignar a una persona concreta es **opcional**.

**Jerarquía visual (regla: color = urgencia, todo lo secundario a un clic):**
1. Línea de estado: "N pendientes abiertos · X en retraso · Y piezas en riesgo" (rojos = links-filtro).
2. Línea de alerta plegada "⚠ N atascados (piezas en riesgo, bloqueados con días de espera)".
3. Toolbar: vistas **Equipos / Tablero / Tabla / Calendario / Realizados(n)** · búsqueda · botón **Filtros(n)** plegable (lado Payless/Inside con contadores, categoría, persona, chips de área, solo vencidos, limpiar) · **＋ Agregar pendiente** (popover rápido: lado→responsable con cargo→tarea→prioridad→categoría→límite; "Más opciones…" pasa lo tecleado al modal) · menú **···** (Copiar estatus para correo/WhatsApp con fallback a modal).
4. Contenido. Al final: carga por responsable (colapsada, solo interna).

**Vistas**: Equipos (2 columnas Debe cliente/Debe Inside, agrupación lista/persona/área con drag para redistribuir + mini-menú "¿a quién?"), Tablero kanban por **estado de flujo** (Por hacer/En curso/En espera/Hecho; drag escribe historial y dispara cascada de desbloqueo), Tabla formato Excel (Proyecto|Tarea|Lado|Responsable|Prioridad|Estado|Límite|Categoría|Última actividad|Link — edición inline con trazabilidad, orden por encabezado, fila quick-add con Enter), Calendario por fecha límite (bandeja "Sin fecha límite", drag), Realizados (agrupados por fecha de cierre, reabribles).

**Modelo de pendiente**: `{id, lado(cliente|inside), titulo, responsable(id persona; genéricos "equipo"/"payless"), area(categoría), prioridad(alta|media|baja), proyecto(texto), limite, link, notas, hecho, estado(por_hacer|en_curso|en_espera|hecho), historial[{fecha,texto}], faltaInfo, matrizId, bloqueadoPor}`.

**Trazabilidad** (el alma del producto, mata el "yo te mandé esto"): historial fechado por pendiente (📤 solicitado/📬 enviado/📥 recibido/notas/reasignaciones/cambios de estado y límite — toda mutación escribe evento), campo "⛔ falta info", "🔒 bloqueado por" con **desbloqueo en cascada** al completarse el bloqueador, y semáforo de cumplimiento (en plazo/riesgo/retraso) + "venció hace n días".

## 5. Datos reales sembrados (fuentes)

- **Kick off 3 jul** (transcripción): 16 publicaciones de julio (Liquidación 7 jul con adaptaciones Caribe inglés 70%/RD 50%/Sur, Spider-Man 13 jul sin RD, Día del Padre 15 jul, Madres CR 21 jul, BTS Caribe 28 jul) + backlog sin fecha (refuerzos, Ecommerce/WhatsApp en standby de Carla Poveda).
- **Matriz orgánica CAM julio** (PDF): piezas por país con banderas (Guatemala usa portada de marca, no liquidación).
- **MASTERDOC (Excel)**: documentación base, fechas clave, equipo Inside real (Alexandra, Sunniva, Roberto, Daniela, Luis Miguel, Alejandro Mendoza, Kevin Tasaico, Antuané, Ariana, Jairo + Victoria y Franco), cuentas IG. ⚠️ **La hoja 3 tiene contraseñas en texto plano — NUNCA meterlas a la app/repo; recomendado rotarlas y moverlas a un gestor.**
- **CUADRO STATUS (Excel)**: formato Proyecto/Tarea/Responsable/Prioridad 🔴🟠🟢/Área; áreas **Gestión, Contenidos, Diseño, Edición, Medios, Community**; ~21 pendientes reales (accesos SharePoint, editables Liquidación, input SUR 🔴, FAQs monitoreo 🔴, brief estrategia, cuadro de medios…).
- **Contactos cliente**: Nicolás (coord. marketing, CAM), Carla Poveda (Ecommerce/WA), Cristina Quesada (Sur), Estefany (Caribe inglés), Daini (RD), César.

## 6. Decisiones de producto cerradas (no reabrir sin la usuaria)

- App independiente (fuente de verdad propia), no espejo de Teams/SharePoint (v1).
- Cliente: ve y aprueba, no edita. "Programado" = agendado en redes; lo sin fecha se llama "Por asignar fecha".
- Gestión general con responsables genéricos INSIDE/PAYLESS; asignación interna opcional; Inside abre en vista Lista.
- Calma visual: color solo para urgencia; nada de KPIs decorativos; secundario plegado.
- Menú en orden: Información general → Estructura → Gestión → Calendario.
- Kanban por estado de flujo (no por lado ni por área — la vista Equipos ya cubre área).

## 7. Proceso de trabajo que funcionó (mantener)

1. Cerrar producto antes de construir (AskUserQuestion con opciones).
2. Construir → **probar en navegador con Playwright** (flujos reales, no solo sintaxis) → captura → publicar artifact (mismo `url`) → commit + push descriptivo.
3. Para revisiones grandes, **lanzar agente experto** (Notion/UX/gestión) que audita el código real y devuelve hallazgos priorizados; aplicar y verificar. Se hizo 4 veces con excelente resultado.
4. La usuaria pide iteraciones cortas y visibles; siempre entregar el link del artifact actualizado y resumen de qué cambió.

## 8. Roadmap pendiente (por prioridad conversada)

1. **Monitoreo** (maqueta de la usuaria: bandeja de comentarios/mensajes por plataforma/país, categorías de consulta, sentimiento, SLA, responsable).
2. **Conteo de piezas** (maqueta: producido vs contrato — 1.155 artes, ratio 25% únicas/75% adaptaciones, ATL/BTL y tienda/malls aparte, histórico mensual).
3. **Actas automáticas desde transcripciones** que generen pendientes y aprendizajes solos.
4. Pestaña Documentos estilo maqueta (hub con buscador) — parcialmente cubierto por Información general.
5. Arrastre táctil (móvil) para los drag & drop; multi-cuenta (selector de marca) a futuro.
6. Legales por país automáticos en cada pieza.

## 9. Estado actual

Último commit: `d88b553` (refactor UX de calma visual). Todo verificado en navegador, cero errores de consola. El artifact publicado corresponde a ese commit (v2.8).
