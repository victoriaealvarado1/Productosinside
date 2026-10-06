# Sincronizar las matrices de Payless con el calendario

Estas instrucciones las sigue la tarea programada (cada 2 horas, de 7 am a 9 pm hora Colombia, días hábiles). La tarea compara cada matriz del cliente con la última versión procesada y sube al calendario **solo lo nuevo**.

- Plataforma: https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp
- Scripts: `sync/leer_matriz.py` y `sync/comparar.py`, publicados junto a la plataforma (léelos con la herramienta Artifact, acción `read`, `path`). Necesitan Python 3 con `python-pptx` y `lxml` (`pip install python-pptx lxml pillow`).
- Estado de cada matriz: colección `syncmatrices`, documentos `CARIBE`, `RD`, `CENTRO` y `SUR`. Ahí está qué versión se procesó, los comentarios ya importados y qué piezas del calendario corresponden a cada diapositiva (`slides.<id>.posts`).

| Documento | Archivo en SharePoint |
|---|---|
| CARIBE | `ING OCT ORGANIC.pptx` |
| RD | `RD OCT ORG.pptx` |
| CENTRO | `CAM OCT ORG.pptx` |
| SUR | `SUR OCT ORGANICO.pptx` |

## Pasos en cada corrida

1. **Busca los 4 archivos** en la carpeta sincronizada con OneDrive que indica la tarea. Si un archivo no está o todavía se está descargando (pesa 0 KB o tiene `~$` al inicio), sáltalo y anótalo en el registro.
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
- Personas: «Khan, Stephanie» → `p-stephanie-khan` · «Alcantara, Dainy» → `p-dainy-alcantara` · «Quezada, Cristina» → `p-cristina-quezada` (las tres son cliente) · «rolazabal» → `p-roberto` · «Silvana Molano Barreto» → `p-silvana` · «aguerrero» → `p-allison` · «Sunniva Giraldo» → `p-sunny` · «Ariana Fernanda Torrecilla Namaní» → `p-ariana` (Inside). Si el autor no está en la lista, busca en la colección `personas` por nombre o alias. Si no aparece, usa su nombre tal cual y `autorOrg: "inside"`, y anótalo en el registro.
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
