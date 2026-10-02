# Calendario Payless

Plataforma solo de calendario para la cuenta Payless: publicaciones orgánicas de Meta por región y país, con preview de Instagram de cada pieza.

- **Publicada (privada):** https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp
- **Fuente:** `PAYLESS _ Planning octubre meta cliente.xlsx` y las matrices CAM, SUR, RD y Caribbean (octubre 2026)
- **Traspaso completo:** `TRASPASO-PAYLESS.md`

## Qué hace

- Calendario mensual, lista, feed por país (grilla del perfil de Instagram) y Faltantes.
- Feed por país muestra solo lo que se publica en el feed; historias y promos (que van en historias) quedan en la pestaña Historias del perfil.
- Las piezas sin imagen se ven vacías e indican la celda VIEW del Excel donde pegarla. El botón «Actualizar imágenes desde el Excel» lee el planning (.xlsx) y asigna cada imagen a su pieza (los carruseles se separan en slides).
- Faltantes: imágenes, copy, formato, hora, SKU, legal y confirmaciones pendientes, más la información del cliente (aprobadores, ventanas de campaña, lineamientos).
- Filtros: región → país, tipo (feed / historias / promos), línea de campaña, estado y búsqueda.
- Preview por pieza: post y carrusel 4:5, reel e historia 9:16, con el arte real del Excel. Sin arte, muestra el headline.
- Equipo Inside: edita la ficha, escribe el copy, sube arte, arrastra piezas entre días, envía a aprobación y vincula piezas de la parrilla.
- Cliente (invitado externo): aprueba, pide cambios con comentario y comenta.

## Datos

- `seed-octubre-2026.json`: las 263 piezas de octubre (Excel + matrices). La base compartida de la página se cargó desde aquí; si la página se abre sin conexión a esa base, muestra este archivo en modo lectura.
- `img/`: arte embebido en el Excel. Los carruseles se separaron en slides y las historias en frames.
- Reglas de la extracción:
  - Los calendarios operativos (CAM, Sur y RD, de feed e historias) son la fuente de verdad de fecha, estado, arte y link.
  - Los datos de la parrilla solo se cruzan cuando coinciden fecha y campaña; quedan marcados como cruce automático.
  - Las piezas de la parrilla sin cruce quedan en "Por asignar fecha".
  - Caribe también usa su calendario (sus campañas coinciden con las tablas que el cliente pegó en esa hoja).
  - Las promos son historias (así las cuenta el RESUMEN). Las fases de la tabla de promos que coinciden con una historia del calendario se fusionan con ella (legal incluido); el resto queda como historia de promo.
- `info-octubre-2026.json`: información del cliente (lineamientos, aprobadores, resumen por región y ventanas de campaña).
