# Seis tiempos

Pieza web para abrir desde un QR durante la cena. Un solo archivo (`index.html`), sin servidor ni base de datos.

Todo se ve escrito a mano y se va escribiendo solo, palabra por palabra. Cada tiempo se abre en partes: primero el plato y la historia; con “sigue” aparece cada pregunta, una por una. Un toque en cualquier parte de la pantalla termina de escribir lo que falta.

## Publicarla para el QR

Cualquier hosting estático sirve. Se sube la carpeta `seis-tiempos/` tal cual:

- **Netlify Drop** (app.netlify.com/drop): arrastrar la carpeta y copiar la URL.
- **GitHub Pages**: publicar el repo y usar `…/seis-tiempos/`.
- **Vercel**: subir la carpeta como proyecto estático.

Con la URL final se genera el QR. Conviene probarlo en el teléfono que se va a usar en la mesa antes de la cena.

## Probar y reiniciar

- Lo escrito y el tiempo en que quedó la carta se guardan solo en el navegador de ese teléfono (`localStorage`). Nada sale del dispositivo.
- Si se recarga la página a mitad de la cena, vuelve al mismo tiempo.
- Para empezar de cero después de probar: abrir la URL con `#reiniciar` al final, o usar “Borrar todo de este teléfono” dentro de “Guardar mis respuestas”.

## Editar textos

Todo el contenido está en el `<script>` de `index.html`: los seis tiempos en `CARTA`, la pantalla final en `CIERRE`. La portada está en el HTML.

La velocidad de escritura se ajusta con `VELOCIDAD` (1 = normal, 1.5 más rápido).
