# Rutina: barrido de las matrices desde Google Drive

Corre 3 veces al día (lunes a viernes, 7:50 am, 11:50 am y 4:50 pm hora Colombia) como una sesión nueva de Claude Code en la nube. Es el mismo proceso de `INSTRUCCIONES.md`, pero lee las matrices de la carpeta de Drive en vez de una carpeta de OneDrive.

- Carpeta de Drive: `1gIzx1zqrKO7kmHXoCJswswv1aSLDIoI4` (https://drive.google.com/drive/folders/1gIzx1zqrKO7kmHXoCJswswv1aSLDIoI4)
- Plataforma: https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp
- Reglas para aplicar cambios: `sync/INSTRUCCIONES.md` publicado en la plataforma (o este mismo directorio del repo).

## Qué archivo es cada matriz

El nombre puede traer sufijos como `(1)`. Se reconoce por cómo empieza:

| Documento (`syncmatrices`) | El título empieza con |
|---|---|
| CARIBE | `ING OCT ORGANIC` |
| RD | `RD OCT ORG` |
| CENTRO | `CAM OCT ORG` |
| SUR | `SUR OCT ORGANICO` |

Si hay varios archivos de la misma matriz, se usa el de `modifiedTime` más reciente.

## Pasos

1. **Lista la carpeta** con el conector de Google Drive (`search_files`, `parentId = '1gIzx1zqrKO7kmHXoCJswswv1aSLDIoI4'`). Anota `id`, `title`, `modifiedTime` y `fileSize` de cada `.pptx`. Si la sesión no tiene el conector, lee `https://drive.google.com/embeddedfolderview?id=1gIzx1zqrKO7kmHXoCJswswv1aSLDIoI4` con `curl` (solo funciona con la carpeta compartida por enlace) y saca los ids de los enlaces `/file/d/<id>`. Ahí no viene `modifiedTime`, así que se descargan todas y `comparar.py` decide por el `sha1`.
2. **Detecta cambios sin descargar.** Lee `syncmatrices/<REGION>` (ArtifactData `get`). Si `drive.fileId` y `drive.modifiedTime` son iguales a los del listado, esa matriz no cambió: pásala.
3. **Descarga solo las que cambiaron.** Los archivos pesan entre 30 y 260 MB, más que el límite del conector. Descárgalos con:
   ```
   curl -sSL -o <REGION>.pptx "https://drive.usercontent.google.com/download?id=<fileId>&export=download&confirm=t"
   ```
   Cada archivo va en su propia carpeta nueva. Comprueba que empiece con `PK` (es un zip). Si no, la carpeta está restringida: anótalo en el registro como «no se pudo descargar: la carpeta de Drive no está compartida por enlace» y sigue con las demás.
   Si existe el secreto de entorno `GOOGLE_SA_JSON` (cuenta de servicio con acceso a la carpeta), descarga con la API de Drive usando esa cuenta en vez del enlace público.
4. **Compara y aplica** con `leer_matriz.py` y `comparar.py` (léelos de la plataforma con la herramienta Artifact, acción `read`, rutas `sync/leer_matriz.py` y `sync/comparar.py`; guárdalos en una carpeta distinta a la de las descargas y ejecútalos con `python3 -I`). Sigue las reglas de `INSTRUCCIONES.md`.
5. **Guarda el estado** en `syncmatrices/<REGION>` con `if_version`. Además de lo que pide `INSTRUCCIONES.md`, guarda `drive: {fileId, modifiedTime, titulo}` del archivo procesado, aunque la comparación diga «sin cambios».
6. **Registro** en `synclog` (id `AAAA-MM-DDTHH-MM`), también cuando no hubo cambios.
7. **Limpia**: borra los `.pptx` y las carpetas `media/` al terminar.

## Siempre

- Nunca pidas ni guardes contraseñas, tokens o claves en la plataforma ni en el chat.
- Nunca borres piezas; los duplicados y las piezas que el cliente rechaza se anotan para que el equipo decida.
- Si una escritura falla por versión, vuelve a leer y reaplica encima de lo nuevo.
