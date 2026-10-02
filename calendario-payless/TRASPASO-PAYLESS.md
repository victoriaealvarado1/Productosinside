# Payless × Inside — Documento de traspaso

**Calendario de publicación, revisión con el cliente y visión del sistema de campañas**

Actualizado el 2 de octubre de 2026. Preparado para continuar el trabajo desde otra cuenta de Claude.

---

## Índice

1. [Cómo usar este documento en otra cuenta de Claude](#1-cómo-usar-este-documento-en-otra-cuenta-de-claude)
2. [Contexto de la cuenta Payless](#2-contexto-de-la-cuenta-payless)
3. [Reunión de revisión del calendario con el cliente (2 oct 2026)](#3-reunión-de-revisión-del-calendario-con-el-cliente-2-oct-2026)
4. [La visión: el sistema de campañas (bloques de texto de Franco Rubio)](#4-la-visión-el-sistema-de-campañas-bloques-de-texto-de-franco-rubio)
5. [Lo que ya está construido: Calendario Payless](#5-lo-que-ya-está-construido-calendario-payless)
6. [Cómo se construyó (fuentes, reglas y decisiones)](#6-cómo-se-construyó-fuentes-reglas-y-decisiones)
7. [Brecha entre lo construido y lo que se busca](#7-brecha-entre-lo-construido-y-lo-que-se-busca)
8. [Hoja de ruta propuesta](#8-hoja-de-ruta-propuesta)
9. [Estado de octubre 2026: pendientes y preguntas abiertas](#9-estado-de-octubre-2026-pendientes-y-preguntas-abiertas)
10. [Anexos: modelo de datos, archivos y prompt de arranque](#10-anexos-modelo-de-datos-archivos-y-prompt-de-arranque)

---

## 1. Cómo usar este documento en otra cuenta de Claude

### Qué llevar

| Qué | Dónde está | Para qué |
|---|---|---|
| Este documento | `calendario-payless/TRASPASO-PAYLESS.md` | Contexto completo |
| El código de la plataforma | Repositorio `victoriaealvarado1/Productosinside`, rama `claude/relaxed-pascal-bpzhko`, carpeta `calendario-payless/` | Reconstruir o seguir desarrollando |
| Los datos de octubre | `calendario-payless/seed-octubre-2026.json` (263 piezas) | Cargar la base de una plataforma nueva |
| Información del cliente | `calendario-payless/info-octubre-2026.json` | Lineamientos, aprobadores y ventanas de campaña |
| Arte final | `calendario-payless/img/` (144 imágenes) | Previews |
| Documentos fuente | El Excel del planning y las 4 matrices en PDF (CAM, SUR, RD, Caribbean) | Volver a extraer o validar |
| Transcripción de la revisión | `payless-revisi-n-calendario-transcripcion.txt` | Feedback textual del cliente |

### Qué NO se traslada automáticamente

- **El link publicado** (https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp) pertenece a la cuenta de Victoria Alvarado. Desde otra cuenta solo se puede **editar** si Victoria la comparte con permiso de editor. Si no, hay que **publicar una página nueva** desde el código del repositorio.
- **La base de datos compartida** (estados, horas, copys, comentarios y aprobaciones que se editen en la página) vive dentro de ese artifact. Una página nueva arranca vacía. Tiene un botón "Cargar planning de octubre 2026" que importa `seed-octubre-2026.json`; los cambios hechos después en la página original no van en ese archivo.
- **Las fotos subidas a mano desde la página** (pestaña Arte) se guardan como assets de ese artifact y no están en el repositorio.

### Prompt de arranque sugerido

Está al final, en el [anexo 10.4](#104-prompt-de-arranque-para-la-otra-cuenta).

---

## 2. Contexto de la cuenta Payless

### La agencia y el cliente

- **Agencia:** Inside (agenciainside.lat). Opera la cuenta de **Payless**, un retail de calzado de moda.
- **Equipo Inside que aparece en el proyecto:** Victoria Alvarado (dueña del producto, lidera la relación digital), Franco Rubio (dirección / estrategia), Alexandra León Raffo, Cynthia (influencers), Roberto, Sunny (Sunniva), Daniela, Luis Miguel, Alejandro Mendoza, Kevin Tasaico, Antuané, Ariana, Jairo, y un redactor de contenido (hombre, mencionado en la reunión). La transcripción la registró aguerrero@agenciainside.lat.
- **Escala:** unos 11–12 países en 3 regiones (más Caribe inglés). En palabras de Franco: *"este no es un cliente, son 12 clientes, cada uno de un país diferente, agrupados por regiones, agrupados por medios específicos"*.

### Regiones, países y aprobadores

| Región | Países | Aprueba (según el planning) | Idioma |
|---|---|---|---|
| Centroamérica (CAM) | GT · SV · HN · NI · CR | Coordinadora Centro | Español |
| Sur | PA · CO · EC · PE | Cristina Quezada | Español |
| República Dominicana | RD | Dainy Alcántara | Español |
| Caribe inglés | TT · JM · BB · ECI · GY · USVI | Stephanie Khan | Inglés (copy nativo) |

- **Legal:** ninguna pieza promocional se publica sin legal validado por **Karla Poveda**.
- **Otros nombres del cliente en las conversaciones:** Carla / Carlita, Luz (cliente senior que lidera la revisión; ver sección 3), Cris / Cristina (Sur), Dainy (RD, también opina sobre Centroamérica), Stephanie (Caribe), Nicolás (coordinación de marketing CAM, en etapas anteriores).

### Pilares / medios

En cada región se trabajan los mismos pilares, cada uno con inputs distintos por región:

- **Orgánico** (Meta: Facebook + Instagram; se menciona sumar TikTok).
- **Medios / pauta** (con submatrices ECOM, WhatsApp, PMAX, Tiendas).
- **Malls / BTL.**
- **ATL.**
- **Influencers / creadores** (Cynthia de Inside coordina; en RD el cliente trabaja con creadoras propias).

### Campañas de octubre 2026

- **Comfort Plus:** cierra el 5 oct; ya entregado y aprobado, fuera de este planning.
- **Sneakers / Atléticos:** campaña fuerte del mes. Marcas: Champion, LA Gear, Airwalk, Reebok, Crosstrekker. KV: "Todos los estilos en un solo lugar" / "Find your style in one place".
- **New Arrivals / Nuevas Llegadas** (damas: ballerinas, kitten heels; en Sur: sandalias, botas, cuero hombre).
- **Kids** y **Halloween Kids**.
- **Promociones:** Tú Eliges, BOGO 30/40/50/60, Super BOGO 60, CYD, Orange Friday/Saturday y Black Weeks. Van en **historias**.
- **Caribe:** 25th Anniversary de Payless TT (Spend & Win, cupón en periódico, Last Day 30 oct), Kids Concur y Sandals.

### Lineamientos del mes ("El feed como vitrina")

- **Mandato:** el feed deja de ser catálogo y volante y pasa a ser vitrina de marca. Ninguna pieza del feed abre con descuento.
- **Texto en pieza, en 3 capas:** tagline fijo + headline variable anclado a un territorio del KV + firma ("Solo en Payless" / "Only at Payless" con logos de marca).
- **Series:**
  - Sneakers: 01 Un par, mil estilos · 02 Encuentra tu match · 03 Street Cast.
  - Nuevas Llegadas: 01 El Drop · 02 El Styling · 03 La It-Girl · 04 El Imperdible.
  - Kids: Estrenar para jugar · Guía para papás.
  - Halloween Kids: La transformación · Un par por personaje.
- **Tono por categoría:**
  - Sneakers: joven y con energía, nunca "comodidad".
  - Damas: chic, editorial, en segunda persona.
  - Botas: trendy.
  - Sandalias: "Dale un break a la rutina".
  - Cuero hombre: "con actitud".
  - Kids: "Estrenar para jugar".
  - Halloween: spooky fun, nunca terrorífico.

---

## 3. Reunión de revisión del calendario con el cliente (2 oct 2026)

Reunión en la que Inside presentó el calendario al cliente. Fuente: transcripción automática (con errores de reconocimiento; se interpretó el sentido). Hablante 1 es la cliente senior que lidera la revisión (Luz). Hablante 2 es Victoria (Inside). Hablante 3 es Dainy (RD). Hablante 4 es Cris (Sur). Hablante 5 es otra persona del cliente que trabaja con creadoras en Dominicana.

### 3.1 Lo más grave para el cliente: visibilidad y comunicación

- **Visibilidad:** le sorprende que las coordinadoras (Carla, Stephanie y Dainy) **no hayan tenido visibilidad** de lo que se comunica cada día. Lo están viendo recién ahora porque ella lo exigió. Lo califica como **grave**. Es el **tercer mes** de la relación.
- **Canal de comunicación:** pide un canal claro, con **nombres concretos** y **horarios de atención**, incluidos horarios fuera de oficina, porque hay publicaciones a las 9 de la noche. Espera de la agencia un compromiso cercano a 12 horas o más.
- **Correo formal:** al cerrar la reunión, Inside debe enviar un correo con quiénes son el canal, por dónde y en qué horarios.
- **El grupo:** Inside propuso mantener la comunicación en el grupo para poder controlar los tiempos de respuesta. El cliente respondió que el mecanismo de alertas es responsabilidad de la agencia.
- **Respuesta de Inside:** la herramienta existe para dar esa visibilidad: qué está programado, qué está publicado y qué está o no aprobado. Si no hay comentarios a tiempo, la pieza se corre de día.

### 3.2 Copy

- **Largo:** el copy del 5 oct ("Todos los estilos. Un solo lugar…") le parece **demasiado largo**: "¿la gente lee tanto?".
- **Tono:** los copys le resultan **"muy tradicionales"**. Cuestiona expresiones como **"hasta los más chic"** por anticuadas. Pide que el redactor ajuste y sugiere apoyarse en ChatGPT o Claude, con supervisión.
- **Validación por país:** pide validar el lenguaje **por mercado**. Dainy (RD) dijo que "chic" no se usa así en su mercado; Cris dijo que en Ecuador sí se usa. Conclusión: *"consulten con cada región; es trabajo de hormiga"*. Cristina aporta la voz de CO, PA y EC; el Caribe es en inglés.
- **Datos del redactor:** pidió los datos del redactor.

### 3.3 Estrategia de formatos: lo que espera de la agencia

- **El input del cliente:** **no quiere que las coordinadoras decidan el formato** (video, post, reel) en sus inputs. Eso es trabajo estratégico de la agencia: trends, cuentas de referencia y diferencias entre países (si en Guatemala funcionan más las historias o en Panamá los videos).
- **Lo que deben dar las coordinadoras:** el **zapato que quieren ver cada día** (como ya hace Cristina, que incluso sugiere bodegón o piernas).
- **Lo que espera de la agencia:** que arme la malla por país y por día ("día 1 video, día 3 dos carruseles…") y le recomiende con criterio, no que pregunte.
- **Lanzamientos de campaña:** espera feed **y** story. Lo ideal es un **carrusel** que muestre los modelos (marrón, negro, rojo, blanco) y una **cuenta regresiva en historias** los días previos. Un solo post de lanzamiento "no hace nada".
- **Respuesta de Inside:** Victoria reconoció que el lanzamiento de Sneakers merecía cuenta regresiva y más piezas, y se comprometió a replantear estratégicamente las semanas siguientes.
- **Arte del feed también en historias:** Cris propuso **replicar el arte del feed en formato historia** para sostener la comunicación hasta tener datos de qué funciona. El cliente estuvo de acuerdo.
- **Sneakers:** lo ve **"muy pobre, muy débil"**. Por ser lanzamiento con cambio de comunicación hacia **público joven**, pide comunicación **ultra agresiva** (post + copy + story), mucho contenido y **pauta**.

### 3.4 Influencers

- **Expectativa:** influencers (chicas o medianas) comunicando Sneakers desde la **primera semana**: cómo se usa cada zapato, contenido constante.
- **Estado al 2 oct:** Cynthia (Inside) tiene influencers en proceso, sin aprobar todavía (desde la semana siguiente). En RD el cliente ya trabaja con creadoras propias y recibe contenido a inicios de la semana siguiente.
- **Calendario:** Inside se comprometió a **sumar el contenido de influencers al mismo calendario**.
- **Hashtags:** pide atención a hashtags y a compartir las historias de las creadoras. Antes se perdían oportunidades, por ejemplo con Stephanie.

### 3.5 Pieza por pieza

| Fecha | Pieza | Comentario |
|---|---|---|
| 4 oct | Story de la promo | Se aclaró que es un story de la misma promoción. |
| 5 oct | Estático Sneakers "Todos los estilos en un solo lugar" | Aprobado como pieza, pero el copy es largo y tradicional. Pide **complementar el día 5** (story y más contenido de lanzamiento). |
| 6 oct | New Arrivals (ballerinas) | El look le gusta ("estilo Miu Miu, más actualizado"; ya enviaron el manual de marca). El copy es muy tradicional ("hasta los más chic"). |
| 6 oct | Portada Facebook Atléticos | "Eso no es contenido, eso está en la portada." Quiere más fuerza de contenido de Sneakers. |
| 6 oct | Promoción válida del 6 al 29 oct | La reunión se cortó aquí; el cliente tenía otra reunión. |

### 3.6 Compromisos que quedaron para Inside

1. Enviar el correo con canal de comunicación, responsables y horarios, incluidos los de fuera de oficina.
2. Replantear la estrategia de Sneakers: lanzamiento con carrusel, historias y cuenta regresiva, más volumen y pauta.
3. Recomendar formatos por país y día con criterio de agencia, sin esperar el formato en los inputs.
4. Revisar los copys con voz más joven y validarlos por mercado con cada coordinadora.
5. Replicar el arte del feed en historias.
6. Integrar a los influencers en el calendario y cuidar hashtags y reposts.
7. Pasar los datos del redactor.

---

## 4. La visión: el sistema de campañas (bloques de texto de Franco Rubio)

Síntesis de los dos bloques de texto de Franco (2 oct, 16:57–16:58). Son conversaciones internas transcritas, con errores de dictado; se reconstruyó el sentido.

### 4.1 Objetivo del sistema

Organizar el **flujo de información de Payless** (varios medios, pilares y campañas mensuales en ~11 países, 3 regiones y 3 coordinadoras) para que la **generación de piezas** a partir de los insumos del cliente sea **ágil y automatizada**, con:

1. **Adaptación local de copys** por país.
2. **Validación automática de coherencia:**
   - copy ↔ legales;
   - imagen ↔ texto;
   - texto final ↔ país donde se publica.
3. **Publicación conectada** a las herramientas de programación de **Meta**: que **apenas el cliente apruebe, se publique automáticamente**.
4. **Visibilidad ágil para el cliente** de todos los assets de cada campaña, con varias vistas:
   - **por campaña** (prioridad 1);
   - **por medio o pilar** (prioridad 1);
   - por responsable y otras.

### 4.2 Diagnóstico: el problema de fondo

- **El input actual del cliente es un Word por campaña**, con links a carpetas de **SharePoint**, **legales por país y región**, indicaciones específicas (calzado a usar) y a veces fechas o recomendaciones de publicación.
- **El cliente no entrega campañas "aterrizadas"**: no hay un plan de despliegue por punto de contacto. Inside no tiene gestión de campañas, pero maneja los medios. Hoy se trabaja **"por partido"**: cada equipo por separado y sin base estratégica común (*"nadie sabe lo que está haciendo"*). Ejemplo: el cliente preguntó *"¿y qué voy a hacer de influencer en esto?"* y el equipo digital no tenía respuesta.
- **Octubre:** no hay campañas cerradas de ninguna marca. Para Sneakers hay KV y fotos, pero no despliegue. Inside propuso solo el despliegue orgánico por territorios de contenido; el cliente quiere ver la campaña en **todos sus puntos de contacto**.
- **Casi todo es campaña:** las promos se trabajan como campañas. El contenido "puramente orgánico" o de marca (por ejemplo un "buenos días" diario) es una estrategia aparte y posterior.

### 4.3 El flujo que se busca

```
1. ESTRUCTURA BASE (una vez)
   El sistema entiende la cuenta: 12 clientes-país, agrupados por región,
   pilares/medios por región, quién es quién y el rol de Inside.
        ↓
2. CAMPAÑA GLOBAL  →  "playbook" / plan creativo de campaña
   Input: brief + KV + identidad + fotos de producción + productos (SKUs) + fechas.
   Salida: cómo se despliega la campaña en TODOS los puntos de contacto
   (orgánico, medios, malls/BTL, ATL, influencers, TikTok), con cronograma.
   Responsable: creativo / planning (dirección creativa).
   Se aprueba con el cliente: "documento aprobado de campaña".
        ↓
3. INPUTS ESPECÍFICOS POR REGIÓN/PAÍS Y POR PILAR
   Cada coordinadora agrega sus particularidades ANTES de producir.
   Ej.: "en RD estas zapatillas no funcionan, usar estas"; "en Centro, malls así".
   Sección dentro de la campaña para inputs por formato/pilar/país.
        ↓
4. TROPICALIZACIÓN
   Vocabulario y voz por región/país (incluye inglés para el Caribe).
        ↓
5. MATRIZ / PLANNING DE PIEZAS (automatizable)
   Del playbook se derivan las piezas: "para digital: intriga, 6 stories,
   3 piezas…; para malls: 4 cosas…". La IA arma el planning y luego cada pieza.
   Insumo principal: fotos + textos + formatos de referencia (cómo se ven las
   promos, las historias, los reels).
        ↓
6. PRODUCCIÓN DE PIEZAS (IA + diseño)
   Adaptación de KV aprobado (ajustar ~40%, cambiar persona, extender formatos).
   Piezas adicionales por país (ej. lo que pide RD).
        ↓
7. VALIDACIÓN AUTOMÁTICA
   copy↔legal · imagen↔texto · texto↔país.
        ↓
8. APROBACIÓN DEL CLIENTE (por pieza, por país)
        ↓
9. PUBLICACIÓN AUTOMÁTICA (Meta Business Suite / API) → registro de "publicado".
        ↓
10. VISTAS PARA EL CLIENTE: por campaña, por medio/pilar, por responsable, por país.
```

### 4.4 Ideas clave de Franco

- **El input correcto no es para crear contenido suelto, es para crear la campaña.** Las coordinadoras dan inputs para todos los puntos de contacto de la campaña.
- **El playbook es el input de la herramienta.** Si incluye cómo se ven las promos, las historias y los reels, la IA puede producir el resto. Se puede indicar hasta cómo usar la intriga.
- **No reinventar la identidad por país:** si el KV ya existe, se extiende y se adapta. Ejemplo de Lourdes: *"¿por qué crear una nueva identidad si ya mandé una pieza?"*.
- **El community manager pasa a supervisar con criterio** el cronograma y la publicación. Interviene en lo realmente orgánico.
- **Reels madre:** las campañas vienen con sus reels; de ahí se desprende contenido para otras plataformas (TikTok).
- **Planning automatizable:** brief + KV + lista de zapatos y fechas → "hazme la parte global, dame un planning e ideas de cómo dividir la campaña" → piezas.

---

## 5. Lo que ya está construido: Calendario Payless

### 5.1 Qué es

Una plataforma web (página única publicada como artifact de Claude) **solo de calendario** para la cuenta Payless, con **preview de cada pieza tal como se verá en Instagram o Facebook**, datos compartidos entre Inside y el cliente, y aprobación por pieza.

- **Link:** https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp (privado; se comparte desde el menú Compartir).
- **Código:** `victoriaealvarado1/Productosinside`, rama `claude/relaxed-pascal-bpzhko`, carpeta `calendario-payless/`.
- **Antecedente en el mismo repositorio:** "Gestión Inside" (raíz del repo: `index.html`, `js/app.js`, `js/data.js`, `CONTEXTO-PROYECTO.md`). Es una herramienta anterior más amplia: gestión general de pendientes, matrices, información general y calendario v1 con localStorage. El Calendario Payless es una plataforma nueva e independiente.

### 5.2 Funcionalidades

**Vistas**

- **Calendario mensual:** el lunes inicia la semana. En cada día sale primero el feed, luego las portadas y al final las historias. Arrastrar y soltar entre días cambia la fecha (solo Inside). En celular se ve como agenda.
- **Lista:** tabla con fecha, hora (editable), región y países, tipo, formato, campaña, headline, estado, arte y copy.
- **Feed por país:** perfil de Instagram simulado de cada país (payless.gt, payless.pa, paylessrd, payless.tt…). Incluye grilla 3:4 solo con lo que se publica en el feed, una pestaña **Historias** aparte, círculos de historias destacadas por campaña, tamaño Celular o Grande y filtro "Solo con arte".
- **Faltantes** (solo Inside): lo que falta, con contador y lista clicable:
  - imágenes de feed, de historias y de portadas;
  - copy, formato, hora y SKU;
  - legal por validar;
  - notas "por confirmar";
  - piezas de la parrilla sin día;
  - aprobaciones pendientes y cambios solicitados.

  Al lado: **"Lo que dice el cliente"** por región (mercado, aprobador, fuente, resumen del brief, ventanas de campaña y lineamientos del mes).

**Filtros**

Región → país, tipo (Feed / Historias / Promos), línea de campaña, estado, **rango de fechas** (por defecto 1–10 oct, con botones "1–10 oct" y "Mes completo") y búsqueda por headline, SKU o campaña.

**Ficha de cada pieza** (se abre en una hoja lateral)

- **Preview** a la izquierda:
  - post estático o carrusel 4:5 deslizable;
  - reel 9:16 con reproducción de fotogramas;
  - historia 9:16 con barras de progreso;
  - portada de Facebook en formato horizontal;
  - botón **"En el feed / En el perfil"** que muestra la pieza resaltada dentro de la grilla del país.
- **Pestañas:**
  - **Ficha:** todos los campos.
  - **Copy:** copy del post, headline, CTA, mandatories y legal.
  - **Arte:** fotos finales.
  - **Aprobación:** hilo de comentarios.
- **Sin copy final**, el preview usa headline + CTA y lo marca como provisional (el aviso solo lo ve Inside).
- **Sin arte**, Inside ve "Sin imagen" con la celda del Excel donde pegarla; el cliente ve "Arte en producción" o "Pieza aprobada".

**Edición (equipo Inside)**

- Todos los campos de la ficha.
- **Hora** con selector de hora, también editable desde la Lista.
- **Fotos finales:** subir varias, reemplazar todas, borrar con confirmación y reordenar (la primera es la portada).
- Crear, duplicar y eliminar piezas.
- Vincular una pieza de la parrilla a un post del calendario.
- **Actualizar imágenes desde el Excel:** lee el .xlsx del planning, detecta las imágenes pegadas en las casillas VIEW y las asigna a cada pieza. Los carruseles se separan en slides y las historias en frames. No pisa fotos cargadas a mano.

**Aprobación**

- Inside "Envía a aprobación".
- El cliente **Aprueba** o **Pide cambios** con comentario obligatorio.
- Todos pueden comentar.
- Cada acción queda en el hilo con autor y fecha.

**Roles**

- **Equipo Inside:** la dueña del artifact o miembros de la organización. Edita todo y tiene un botón "Ver como cliente" para presentar.
- **Cliente:** invitado externo de Payless. Ve el calendario, la lista y el feed por país, y aprueba y comenta.
  - No ve: el panel de parrilla, Faltantes, notas internas, links de SharePoint, celdas del Excel ni borradores vacíos.
  - Su ficha es reducida: fecha, hora, países, formato, campaña, texto en pieza, copy, CTA y legal.
- **Para que el cliente apruebe:** hay que invitarlo **por correo como editor** y **sin enlace público**. La plataforma lo detecta como invitado y le muestra la vista de cliente.

### 5.3 Datos cargados (octubre 2026)

- **263 piezas:** Sur 87 · Centro 82 · Caribe 49 · RD 45.
- **Por tipo:** feed 141 · promo 114 · historia 8.
- **Por formato:** historia 122 · carrusel 69 · estático 41 · reel 27 · portada FB 4.
- **Con arte final:** 54. **Con copy real:** 27, todos sacados de las matrices.
- **Sin fecha:** 63 piezas de la parrilla que no coinciden con el calendario operativo.
- **Estados:** Sin iniciar 155 · En desarrollo 83 · Aprobado 12 · Enviado a cliente 8 · Programado 3 · Publicado 2.

---

## 6. Cómo se construyó (fuentes, reglas y decisiones)

### 6.1 Fuentes usadas

1. **`PAYLESS _ Planning octubre meta cliente.xlsx`** (15 hojas):
   - `LINEAMIENTOS`, `RESUMEN`, `VISTA POR CAMPAÑA`.
   - Calendarios operativos: `CALENDARIO CAM FEED/STORIES`, `CALENDARIO SUR FEED/STORIES`, `CALENDARIO RD`, `CALENDARIO RD STORIES` y `CALENDARIO CARIBE` (oculta).
   - Parrillas por región (ocultas): `CENTRO`, `SUR`, `RD`, `CARIBE`. Traen N°, semana, fecha, países, campaña, serie, prioridad, tipo de contenido, headline, idea, objetivo, formato, canal, insumo, SKU, CTA, mandatories, responsable y estado, más la tabla de **promociones** por país y fase con su legal.
   - Calendarios: bloques por semana con filas DÍA, FECHA, PAÍS, HORA POST, CAMPAÑA, **VIEW** (imagen pegada), ESTADO, PIEZA, LINK (hipervínculo a SharePoint) y **SLIDE**.
2. **Matrices en PDF** (presentación para diseño, una pieza por página, con arte final, copy, ajustes y legales): `CAM_OCT_ORG.pdf` (22 págs.), `SUR_OCT_ORGANICO.pdf` (33), `RD_OCT_ORG.pdf` (17) y `ING_OCT_ORGANIC.pdf` (10, Caribbean).
3. **Links de SharePoint** a las carpetas PIEZAS FINALES de cada región: **no se pudieron abrir** porque requieren sesión de Payless.

### 6.2 Reglas de extracción y decisiones (importantes para no repetir errores)

1. **El calendario operativo es la fuente de verdad** de fecha, estado, arte y link. Las parrillas son planning previo y **no coinciden día a día**. Ejemplo: el carrusel del 7 oct en Centro es "Sneakers que hacen match contigo", mientras la parrilla pone otra serie ese día.
2. **Cruce parrilla → calendario solo cuando coinciden fecha y familia de campaña.** Esos cruces quedan marcados como automáticos. Las piezas de la parrilla sin cruce van a "Por asignar fecha" y se pueden vincular a mano desde la ficha.
3. **La fila "SLIDE" del calendario apunta a la página de la matriz.**
   - CAM: Sneakers S5–S11 = página igual; Nuevas Llegadas S17–S22 = página −5; historias S24/S25 = pág. 19, S26 = 20, S27 = 21, S28 = 22.
   - SUR: S5–S9 = página igual; historias S37 = 11, S38 = 12; S42, S46, S50, S53 y S57 = página −29.
   - RD: S5–S10 = página igual; S14 = 14; S17 = portada.
   - Caribbean: sin slides; se asignó por campaña y fecha.
4. **Las promos son historias.** El RESUMEN las cuenta como "Promos · historias". Las fases de la tabla de promos que coinciden (región, fecha, país y mecánica) con una historia del calendario se fusionaron con ella para no duplicar, conservando el legal.
5. **Feed por país = solo feed.** Historias, promos y portadas de Facebook no entran en la grilla.
6. **Caribe usa su hoja de calendario**, porque las tablas que el cliente pegó ahí (LA Gear 84, Kids Concur, Sandals y 25th Anniversary) coinciden con esa hoja y no con la parrilla.
7. **Imágenes:**
   - En el Excel, las tiras de carrusel e historia se separaron en slides o frames, detectando separadores o por proporción.
   - En los PDFs se tomó la **capa superior visible** de cada slide. Se usó la imagen original cuando estaba cortada o tapada por el sello "PRIORITY".
8. **Correcciones de datos aplicadas:**
   - "PERÚ HISTORIAS" tenía "PANAMA" en la columna de país; se pasó a Perú. Su fecha 25 nov se pasó a 25 oct (la matriz dice "6, 15 y 25").
   - Last Day TT se movió del 31 al **30 oct** ("One day only — October 30").
   - Comfort Plus en CAM se marcó como aprobado y fuera del planning.
   - Las piezas con arte final que figuraban como "Sin iniciar" pasaron a "En desarrollo".
9. **Ventanas de campaña** que venían como **imágenes** pegadas en el Excel (tablas de RD, Caribe y Sur) se transcribieron a `info-octubre-2026.json`.

### 6.3 Arquitectura técnica

- **Página única** (`index.html`, unas 1.150 líneas, vanilla JS, sin framework ni build). Tipografías: Bricolage Grotesque, Instrument Sans y JetBrains Mono. Tema claro y oscuro.
- **Capacidades del artifact:**
  - `db`: base compartida en tiempo real, colecciones `posts` y `comentarios`.
  - `user`: identidad, nombres y detección de invitado externo.
  - `assets`: subida de fotos.
- **Archivos publicados junto a la página:** `seed-octubre-2026.json`, `info-octubre-2026.json` y `img/*.jpg`.
- **Sin conexión a la base** (por ejemplo, abierta fuera de claude.ai), la página muestra el seed en modo lectura.
- **Importador de Excel en el navegador:** JSZip desde cdnjs, lectura de `xl/drawings` para ubicar cada imagen por hoja y celda, hash SHA-256 para no re-subir imágenes repetidas y corte en canvas.
- **Pruebas:** Playwright con un mock de `window.claude` (db, user y assets) para simular los roles Inside y cliente.

---

## 7. Brecha entre lo construido y lo que se busca

| Lo que se busca (Franco + cliente) | Hoy en la plataforma | Brecha |
|---|---|---|
| Visibilidad diaria para coordinadoras y gerentes | ✅ Calendario, lista y feed por país; vista cliente; aprobación por pieza | Falta notificar (correo o WhatsApp) cuando hay piezas por aprobar o comentarios, y mostrar horarios y canal de atención |
| Vista por **campaña** | 🟡 Filtro por línea de campaña | Falta una vista "Campaña": ficha de campaña (objetivo, KV, ventanas, productos), todas sus piezas en todos los pilares y avance |
| Vista por **medio / pilar** | ❌ Solo orgánico Meta (feed, historias, portadas) | Falta modelar el pilar (orgánico, medios, malls/BTL, ATL, influencers, TikTok) y la vista por pilar |
| Vista por **responsable** | 🟡 Campo "responsable" en texto | Falta asignación estructurada y filtro |
| **Playbook de campaña** como input | ❌ Input = Excel de planning + matrices PDF | Falta el objeto "Campaña / Playbook" y su flujo de aprobación |
| **Inputs por región, país y pilar** de las coordinadoras ("el zapato del día") | ❌ | Falta una sección por campaña donde cada coordinadora carga productos por día y restricciones por país |
| La agencia **recomienda formatos** por país y día | ❌ (el formato viene del planning) | Falta un planificador de malla por país con recomendación (IA + criterio) y comparativa entre países |
| **Tropicalización** y voz por mercado | ❌ | Falta un glosario por país (palabras que sí y que no; "chic" en RD vs EC) y copy por país además del copy por región |
| **Generación de piezas** con IA desde KV + fotos | ❌ | Fase posterior: generación de planning y copy con Claude; adaptación de KV con herramientas de diseño |
| **Validación automática** copy↔legal, imagen↔texto, texto↔país | 🟡 Faltantes detecta legal pendiente, SKU y confirmaciones | Falta una validación semántica con IA: legal coherente con promo y fechas, país correcto, idioma correcto (Caribe en inglés), largo del copy, palabras prohibidas |
| **Publicación automática** al aprobar | ❌ | Requiere integración con Meta Graph API o Business Suite, que no es posible desde un artifact; necesita backend |
| **Influencers** en el mismo calendario | ❌ | Falta el tipo de pieza "Influencer/creador" con estado, creadora y hashtags |
| Arte del feed **replicado en historias** | ❌ | Falta una acción "Crear versión historia" de un post de feed |
| Lanzamientos con **cuenta regresiva** | ❌ | Falta una plantilla de lanzamiento: intriga en historias D-3..D-1, carrusel de lanzamiento, story y reel |
| TikTok | ❌ | Falta TikTok como canal y su preview |

---

## 8. Hoja de ruta propuesta

### Fase 0 — Inmediato (esta semana, sobre la plataforma actual)

1. **Responder a la reunión:** el correo de canal y horarios, y el replanteo del lanzamiento de Sneakers.
2. **Completar arte y copys** del 1 al 15 oct desde SharePoint (ver la lista de faltantes en la sección 9).
3. **Reescribir los copys** con voz más joven y una versión por mercado. Validar con Dainy, Cris y Stephanie.
4. **Agregar a la plataforma:**
   - **"Versión historia"** de cada post de feed (mismo arte en 9:16).
   - **Tipo "Influencer"** en el calendario: creadora, red, fecha, estado y hashtags obligatorios.
   - **Plantilla de lanzamiento** con cuenta regresiva.
   - **Recordatorio visible** de canal y horarios de atención para el cliente.

### Fase 1 — Campaña como eje (2–4 semanas)

- **Nuevo objeto "Campaña":**
  - nombre, objetivo, público, ventanas por país, KV y fotos aprobadas, productos/SKU, legales por país;
  - pilares activos y el cronograma de despliegue (el **playbook**);
  - estado del playbook: borrador → aprobado por el cliente.
- **Inputs por región, país y pilar:** formulario por coordinadora con productos por día, restricciones ("en RD no este modelo") e indicaciones.
- **Vistas:** por campaña (tablero con todas las piezas y avance), por pilar y por responsable.
- **Pilares:** cada pieza pertenece a un pilar (orgánico, medios, malls/BTL, ATL, influencers, TikTok).

### Fase 2 — IA en el flujo (4–8 semanas)

- **Planning asistido:** brief + playbook + productos → propuesta de malla por país y día con formatos recomendados y justificación. Inside revisa y ajusta.
- **Copy asistido por mercado:** a partir del glosario y voz por país; incluye inglés nativo para el Caribe.
- **Validador automático por pieza:**
  - legal ↔ mecánica, fechas y país;
  - idioma ↔ país;
  - texto en pieza ↔ copy;
  - largo del copy;
  - palabras vetadas;
  - y, con visión, imagen ↔ texto ↔ producto.

  Bloquea "Enviar a aprobación" si hay errores críticos.

### Fase 3 — Publicación y medición (requiere backend)

- **Backend propio:** por ejemplo Supabase o Firebase con funciones, y la API de Claude para el planning, el copy y la validación.
- **Integración con Meta Graph API:** programar y publicar al aprobar, guardar el ID del post y marcar "Publicado" automáticamente. Luego TikTok.
- **Métricas** por pieza y país, para alimentar la recomendación de formatos ("en GT rinden más las historias").

### Recomendación técnica para la otra cuenta

- **Corto plazo (Fase 0 y 1):** seguir con el artifact actual. Es rápido, comparte datos en vivo y ya tiene roles. Pedir a Victoria permiso de editor, o republicar desde el código.
- **Mediano plazo (Fase 2 y 3):** migrar a una app con backend. La publicación en Meta, los secretos de API y las automatizaciones no corren dentro de un artifact. Mantener el mismo modelo de datos (sección 10.1) para migrar sin pérdida.

---

## 9. Estado de octubre 2026: pendientes y preguntas abiertas

### 9.1 Piezas sin arte (del 1 al 10 oct)

- **Portadas de Facebook** "Atléticos 6 oct" de CAM, Sur y RD. El cliente además dijo que la portada **no cuenta como contenido**.
- **Caribe:** Sandals (6 oct), carrusel LA 84 (5 oct), Kids Concur (7 y 9 oct).
- **Historias:**
  - Tú Eliges CAM (4–5 oct), Super BOGO 60 CR (5 oct), BOGO 50/40 CAM (5–6 oct);
  - Tú Eliges RD (5 oct), BOGO 50 RD (6 oct);
  - CYD EC (5 oct), CYD PA (7 oct), BOGO 60 EC y PA (6 oct), BOGO 30 CO (9 y 10 oct);
  - promos de Caribe.
- **Reels:** solo hay imagen de portada; los videos están en Drive.

### 9.2 Preguntas para el cliente

1. **Reel CAM del 9 oct:** la matriz dice países "HN, NI, CR, RD", sin GT ni SV. ¿Es correcto?
2. **Carrusel "Encuentra tu match" CAM:** la matriz lo fecha el 6 oct; el calendario lo publica el 7.
3. **Kids Concur (Caribe):** el arte está en **español** para un mercado de habla inglesa.
4. **Cupón del periódico TT:** sin fecha en la matriz; se ubicó el 18 oct.
5. **Caribe sin copy:** LA Gear y Kids Concur.
6. **Fechas por revisar en Ecuador** ("REVISAR FECHAS" en el Excel).
7. **BOGO 50 GT/HN/NI:** el brief dice "29 de noviembre" y el legal dice 29 oct.
8. **BOGO 50 CR:** el legal dice "del 6 de septiembre"; ¿es 6 de octubre?
9. **Guyana:** no aparece en la tabla de promociones.
10. **Contraseñas:** en documentos anteriores (MASTERDOC) había contraseñas en texto plano. No se cargaron en ninguna herramienta; se recomienda rotarlas y moverlas a un gestor.

### 9.3 Feedback del cliente ya incorporado en la plataforma

- Visibilidad para el cliente: vista cliente con aprobación por pieza.
- Promos separadas del feed, en historias.
- Feed por país con lo que realmente se publica.

### 9.4 Feedback del cliente aún no incorporado

- Copy más corto y joven, validado por mercado.
- Lanzamiento de Sneakers con carrusel, story y cuenta regresiva.
- Arte del feed replicado en historias.
- Influencers en el calendario.
- Formatos recomendados por país.
- Canal y horarios de atención.

---

## 10. Anexos: modelo de datos, archivos y prompt de arranque

### 10.1 Modelo de datos de una pieza (colección `posts`)

```json
{
  "id": "cen-f-20261005-1",
  "origen": "calendario | parrilla | promo | manual",
  "region": "CENTRO | SUR | RD | CARIBE",
  "paises": ["GT","SV","HN","NI","CR"],
  "tipo": "feed | historia | promo",
  "formato": "Estático | Carrusel | Reel | Historia | Portada",
  "fecha": "2026-10-05",
  "hora": "8:00 am",
  "estado": "Sin iniciar | En desarrollo | Enviado a cliente | Cambios solicitados | Aprobado | Programado | Publicado",
  "campana": "Sneakers",
  "linea": "Sneakers | Nuevas Llegadas | Kids | Halloween Kids | Comfort Plus | Aniversario TT | Promociones | Otra",
  "serie": "02 · Encuentra tu match",
  "headline": "Texto en la pieza",
  "copy": "Caption final del post",
  "cta": "Encuentra tu match",
  "idea": "Descripción de la pieza",
  "objetivo": "Descubrir | Guardar | Comentar…",
  "tipoContenido": "Lifestyle editorial | Styling | …",
  "sku": "200599",
  "mandatories": "Notas obligatorias / internas",
  "responsable": "Roberto → Sunny · Aprueba: …",
  "legal": "Texto legal (promos)",
  "estadoLegal": "Por validar con Karla",
  "fase": "Lanzamiento | Mantenimiento | Últimas horas",
  "vigencia": "1–5 oct",
  "imagenes": ["img/m_cam5_0.jpg", "asset:<id>"],
  "imgHash": "sha256 de la imagen del Excel",
  "arteManual": true,
  "slot": {"sheet": "CALENDARIO CAM FEED", "col": 2, "r1": 19, "r2": 22, "cell": "B19:B22"},
  "matriz": "Matriz CAM oct · pág. 5",
  "link": "https://paylessshoes.sharepoint.com/…",
  "slide": "Slide 5",
  "fuente": "CALENDARIO CAM FEED!B16",
  "vinculo": "auto | manual",
  "sinFecha": false,
  "fechaPropuesta": "",
  "actualizado": "ISO", "actualizadoPor": "id usuario"
}
```

**Comentarios** (colección `comentarios`):

```json
{ "postId": "…", "tipo": "nota | envio | aprobado | cambios", "texto": "…", "fecha": "ISO", "autorId": "…", "autorNombre": "…" }
```

**Propuesta de nuevos objetos para la Fase 1:** `campanas`, `inputs` (coordinadora × campaña × país × pilar), `pilares`, `glosario` (país → palabras sí/no, tono) e `influencers`.

### 10.2 Archivos del repositorio

```
calendario-payless/
├── index.html                 # Plataforma completa (HTML+CSS+JS)
├── seed-octubre-2026.json     # 263 piezas de octubre (datos iniciales)
├── info-octubre-2026.json     # Lineamientos, aprobadores, ventanas de campaña
├── img/                       # Arte extraído del Excel (image*.jpg) y de las matrices (m_*.jpg)
├── README.md                  # Resumen técnico
└── TRASPASO-PAYLESS.md        # Este documento
```

Historial de commits relevante (rama `claude/relaxed-pascal-bpzhko`):

- **Calendario Payless con preview de Instagram:** versión inicial.
- **Preview del feed por país** con imágenes.
- **Promos en historias**, imágenes desde el Excel y vista Faltantes.
- **Piezas finales del 1 al 10 oct** desde las matrices.
- **Revisión completa antes del cliente:** 15 piezas más, correcciones de datos y vista cliente depurada.
- **Edición de horas y gestión de fotos finales.**

### 10.3 Cómo reconstruir la plataforma en otra cuenta

1. Clonar el repositorio y abrir la carpeta `calendario-payless/`.
2. Publicar `index.html` como artifact de Claude con:
   - las capacidades `db` (base compartida), `user` (con alcance `profile`) y `assets`;
   - los archivos `img/*`, `seed-octubre-2026.json` e `info-octubre-2026.json`.
3. Abrir la página, que mostrará "Todavía no hay publicaciones", y pulsar **"Cargar planning de octubre 2026"**. Otra opción es que Claude cargue el seed en la base por tandas.
4. Compartir:
   - con el equipo Inside, como miembros de la organización;
   - con Payless, invitando por correo como **editor** y sin enlace público.
5. Para meses siguientes:
   - repetir la extracción del Excel del planning y de las matrices (reglas en la sección 6.2);
   - o usar "Actualizar imágenes desde el Excel" para el arte.

### 10.4 Prompt de arranque para la otra cuenta

> Trabajo en la agencia creativa Inside y opero la cuenta Payless (retail de calzado; 4 regiones: Centroamérica, Sur, RD y Caribe inglés; ~16 países; aprobadores por región).
>
> Te paso el documento TRASPASO-PAYLESS.md con todo el contexto: el calendario de publicación ya construido (artifact con base compartida y vista de cliente), cómo se extrajeron los datos del Excel de planning y de las matrices PDF, el feedback de la reunión con el cliente del 2 oct y la visión de Franco de un sistema de campañas (playbook → inputs por región, país y pilar → tropicalización → generación de piezas con IA → validación copy/legal/imagen/país → aprobación → publicación automática en Meta → vistas por campaña, pilar y responsable).
>
> Objetivo de esta sesión: [elige uno]
> (a) Fase 0: agregar "versión historia" de cada post, el tipo "Influencer", una plantilla de lanzamiento con cuenta regresiva y el canal y horarios de atención en la vista cliente.
> (b) Fase 1: diseñar e implementar el objeto Campaña (playbook) con inputs por coordinadora y vistas por campaña y por pilar.
> (c) Proponer la arquitectura de la Fase 2/3 (IA + backend + Meta Graph API) manteniendo el modelo de datos del anexo 10.1.
>
> Antes de construir, hazme las preguntas necesarias. Prioriza lo que el cliente pidió en la reunión (sección 3.6).

### 10.5 Glosario

- **Planning / parrilla:** planificación de piezas por región con series, headlines y formatos.
- **Calendario operativo:** hojas CALENDARIO del Excel, con fecha, estado, arte (VIEW), link y slide.
- **Matriz:** presentación para diseño, una pieza por página, con arte final, copy, ajustes y legal.
- **KV:** key visual de la campaña.
- **Playbook de campaña:** plan de despliegue de la campaña en todos los puntos de contacto, aprobado por el cliente.
- **Pilar / medio:** orgánico, medios/pauta, malls/BTL, ATL, influencers, TikTok.
- **Tropicalización:** adaptación de lenguaje y voz por región o país.
- **BOGO:** "Buy one, get one". Segundo artículo con X% de descuento.
- **CYD / Tú Eliges:** promo de elegir entre "tercer artículo gratis" o "50% en el segundo".
