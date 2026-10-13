# Sincronizar las matrices de Payless con el calendario

Estas son las reglas para aplicar los cambios de una matriz. Las usan la revisión diaria y la revisión rápida descritas en `RUTINA.md`. La tarea compara cada matriz del cliente con la última versión procesada y sube al calendario **solo lo nuevo**.

- Plataforma: https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp
- Scripts publicados junto a la plataforma (léelos con la herramienta Artifact, acción `read`, `path`): `sync/leer_matriz.py`, `sync/comparar.py` y `sync/ayudas.py`. Necesitan Python 3 con `python-pptx`, `lxml` y `pillow`.
- Estado de cada matriz: colección `syncmatrices`, documento `<MATRIZ>-<AAAA-MM>` (por ejemplo `CENTRO-2026-10`). Ahí está qué versión se procesó, los comentarios ya importados y qué piezas del calendario corresponden a cada diapositiva (`slides.<id>.posts`).

## Pasos en cada corrida

1. **Busca los archivos** en la carpeta de Drive como dice `RUTINA.md` (subcarpeta por mes). Si un archivo no se puede descargar, sáltalo y anótalo en el registro.
2. **Lee el estado** de cada matriz con ArtifactData (`get`, colección `syncmatrices`) y guárdalo como `estado.json`.
3. **Compara**:
   ```
   python3 leer_matriz.py "<archivo>.pptx" trabajo/<REGION>
   python3 comparar.py trabajo/<REGION>/<archivo>.json estado.json trabajo/<REGION>
   ```
   Si el resultado es «sin cambios», pasa a la siguiente matriz. Si no, abre `trabajo/<REGION>/cambios.json`.
4. **Aplica cada diapositiva con cambios** con las reglas de abajo.
5. **Guarda el estado nuevo** (`trabajo/<REGION>/estado_nuevo.json`) en `syncmatrices/<REGION>` con `if_version` igual a la versión que leíste. Antes de guardarlo, actualiza `slides.<id>.posts` con las piezas que relacionaste en esta corrida.
6. **Deja el registro** en la colección `synclog`. El id es la fecha y hora (`2026-10-06T14-00`) y el contenido `{fecha, resumen, matrices: {REGION: "sin cambios" | "N cambios"}, detalle: [...]}`. En `resumen` va una línea por cambio aplicado y otra por cada cosa que quedó para revisar. Si no hubo cambios en ninguna matriz, escribe igual el registro con `resumen: "Sin cambios"`.

## Reglas para aplicar cambios

**Piezas.** Usa las piezas de `posts` de la diapositiva. Comprueba que existan; el equipo a veces las borra o las rehace. Si la diapositiva es nueva (`nueva: true`) o sus piezas ya no existen, busca la pieza en el calendario por región, países, fecha del campo `formato` (por ejemplo «CARRUSEL – 8 oct»), nombre y copy. Si encuentras una sola pieza que coincide, úsala. Si no hay ninguna o hay varias, **no inventes**: anótalo en el registro como «por relacionar». Crea una pieza nueva solo si la diapositiva trae fecha y formato claros y ese día no hay nada parecido. En ese caso créala con `estado: "Sin iniciar"`, `origen: "manual"` y `fuente: "Matriz <REGION> (cliente) · diapositiva N"`.

**Comentarios nuevos** (`comentarios_nuevos`). Cada uno va a la colección `comentarios`, una vez por pieza relacionada:
- Id del documento: `mx-<cid>-<postId>`. Al ser siempre el mismo, si se repite no se duplica.
- Campos: `postId`, `texto`, `fecha` (la del comentario con `Z` al final), `tipo` (`comentario` si no tiene `padre`, `respuesta` si lo tiene, con `parentId: "mx-<cid del padre>-<postId>"`), `autorNombre`, `autorOrg`, `personaId`, `personaNombre`, `autorId: ""`, `registradoPor: "Sincronización de matrices"` y `fuente: "Matriz <REGION> · diapositiva N"`.
- Personas: «Khan, Stephanie» → `p-stephanie-khan` · «Alcantara, Dainy» → `p-dainy-alcantara` · «Quezada, Cristina» → `p-cristina-quezada` · «Poveda, Karla» → `p-karla-poveda` · «QUISBERT, CARLA» → `p-carla-quisbert` · «Narino, Nicolas» → `p-nicolas-narino` (todas son cliente) · «rolazabal» → `p-roberto` · «Silvana Molano Barreto» → `p-silvana` · «aguerrero» → `p-allison` · «Sunniva Giraldo» → `p-sunny` · «Ariana Fernanda Torrecilla Namaní» y «atorrecilla@agenciainside.lat» → `p-ariana` · «rguerrero», «david», «amedrano», «eurbano», «ahuata», «epadron» → `p-<usuario>` (Inside). La tabla completa está en `ayudas.PERS`. Si el autor no está en la lista, busca en la colección `personas` por nombre o alias. Si no aparece, usa su nombre tal cual y `autorOrg: "inside"`, y anótalo en el registro.
- Si el padre ya se había importado antes con otro id (los del barrido manual empiezan con `mz-`), busca en `comentarios` el de esa pieza con el mismo texto y fecha y usa su id como `parentId`.

**Aprobaciones.** Un comentario del cliente que empieza con «aprobado», «aprobada», «aprobadas» o «approved» genera además un documento `tipo: "aprobado"` (id `mx-ap-<cid>-<postId>`). Si la diapositiva corresponde a varias piezas y el comentario menciona un día o un país («las del lunes 5», «para CR, HN»), aplícalo solo a esa pieza. Si la pieza está en «Enviado a cliente» o «Comentarios del cliente», pásala a «Aprobado por cliente» con `cambiosPendientes: false`.

**Cambios pedidos.** Si el cliente pide un ajuste (no aprueba) y la pieza está en «Enviado a cliente», pásala a «Comentarios del cliente» con `cambiosPendientes: true`.

**Fechas y horas.** Si el cliente pide una fecha u hora concreta («post Oct 27th», «que salga el lunes 5 a las 8 am hora COL»), cámbiala en la pieza, salvo que ya esté «Publicado». Agrega siempre un comentario `tipo: "nota"` de «Asistente INSIDE» que explique el cambio y diga si la hora es de Colombia.

**Artes nuevas** (`artes_nuevas` / `videos_nuevos`). El arte final es la imagen dentro de la diapositiva (`dentro: true`) que está más arriba (`capa` mayor) en el lugar de la pieza. En un carrusel, usa las de la última capa, ordenadas de izquierda a derecha y de arriba abajo. Ignora capturas de documentos, logos y fotos de referencia.
- Conviértela a JPG (calidad 90, máximo 1920 px), súbela con la herramienta Artifact (`asset: true`, `url` de la plataforma) y pon `imagenes: ["asset:<id>", …]`, `arteManual: true` e `imgHash: {"__delete__": true}` en la pieza.
- Videos: `"asset:<id>#video"` y su póster (la imagen marcada `poster: true`). Si el video pesa más de 19 MB, comprímelo antes con `ffmpeg -c:v libx264 -crf 19 -preset slow -c:a copy`.
- Si la pieza ya está «Publicado», no cambies el arte: deja una nota.

**Textos cambiados** (`texto`). Si cambió el copy (el bloque que empieza con «COPY:») y la pieza no está «Programado» ni «Publicado», actualiza `copy` y deja una nota con el cambio. Si está programada o publicada, deja solo la nota para que el equipo decida.

**Diapositivas borradas.** Solo se anotan en el registro. Nunca borres piezas del calendario.

## Siempre

- Escribe con `if_version`. Si una escritura falla por versión, vuelve a leer la pieza y reaplica el cambio encima de lo nuevo. No sobrescribas lo que el equipo hizo.
- Agrupa las escrituras en lotes (`batch`, máximo 50).
- No cambies piezas de otra región ni campos que el cliente no tocó.
- Al terminar, actualiza `syncmatrices/<REGION>` aunque solo hayan cambiado comentarios, para no volver a procesarlos.

## Estados según el hilo

Usa `ayudas.estado_hilo()` sobre todos los comentarios de la diapositiva. El resultado se aplica solo si la pieza no está «Programado» ni «Publicado» y si nadie la editó después del último comentario.

- Si el último comentario del cliente aprueba («aprobado», «approved», «ok», «video aprobado…»), la pieza pasa a «Aprobado por cliente».
- Si el cliente pidió cambios e Inside respondió después («ajustado», «done», «corregido»), pasa a «Enviado a cliente».
- Si el cliente pidió cambios y no hay respuesta de Inside, pasa a «Comentarios del cliente» con `cambiosPendientes: true`.
- Si no hay comentarios del cliente pero Inside marcó «Diseñado» o «Pieza realizada», pasa a «Enviado a cliente».

## Arte final

- Usa `ayudas.finales2(slide, formato)`. Toma las imágenes visibles dentro de la diapositiva, no tapadas por una capa superior y pesadas, y ordenadas de izquierda a derecha y de arriba abajo. En historias acepta también imágenes livianas con proporción 9:16.
- Descarta las capturas de pantalla del programa de diseño con `ayudas.es_captura()`.
- Si en un carrusel el arte es una tira panorámica, córtala en paneles de 4:5.
- Si la pieza está «Programado» o «Publicado», o el equipo subió el arte a mano después del último comentario, no lo reemplaces.

## Clasificación para Salud de la cuenta (colección `salud`, solo Inside)

- tipo: aprobacion | aprobacion_condicionada | cambio | pregunta | informativo | cancelacion
- tema: copy | diseno | marca | producto | legal | cta | promo | fechas | estrategia | publicacion | formato | otro
- tono: positivo | neutro | negativo
- reiteracion (+ notaReit), contradice (+ notaCont)

Lo deciden solo el Estratega INSIDE (`ESTRATEGA.md`) o una persona de Inside, nunca a partir del comentario solo:

- objetividad: objetivo (error verificable) | subjetivo (gusto o criterio)
- origen (solo si pide cambio, aprueba con cambio o cancela): error_inside | propuesta_no_convence | llego_tarde | brief_incompleto | preferencia_cliente | decision_cliente | pedido_sin_sustento | sugerencia_futura
- fundamento: fundamentado | discutible | sin_fundamento (+ notaEstratega)
