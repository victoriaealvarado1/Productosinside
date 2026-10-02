# Calendario Payless

Plataforma solo de calendario para la cuenta Payless: publicaciones orgánicas de Meta por región y país, con preview de Instagram de cada pieza.

- **Publicada (privada):** https://claude.ai/artifact/B7aFHiLWrJ24geg4hrJnLp
- **Fuente:** `PAYLESS _ Planning octubre meta cliente.xlsx` (octubre 2026)

## Qué hace

- Calendario mensual, lista y feed por país (grilla del perfil de Instagram).
- Filtros: región → país, tipo (feed / historias / promos), línea de campaña, estado y búsqueda.
- Preview por pieza: post y carrusel 4:5, reel e historia 9:16, con el arte real del Excel. Sin arte, muestra el headline.
- Equipo Inside: edita la ficha, escribe el copy, sube arte, arrastra piezas entre días, envía a aprobación y vincula piezas de la parrilla.
- Cliente (invitado externo): aprueba, pide cambios con comentario y comenta.

## Datos

- `seed-octubre-2026.json`: las 271 piezas extraídas del Excel. La base compartida de la página se cargó desde aquí; si la página se abre sin conexión a esa base, muestra este archivo en modo lectura.
- `img/`: arte embebido en el Excel. Los carruseles se separaron en slides y las historias en frames.
- Reglas de la extracción:
  - Los calendarios operativos (CAM, Sur y RD, de feed e historias) son la fuente de verdad de fecha, estado, arte y link.
  - Los datos de la parrilla solo se cruzan cuando coinciden fecha y campaña; quedan marcados como cruce automático.
  - Las piezas de la parrilla sin cruce quedan en "Por asignar fecha".
  - Caribe usa su parrilla, porque su hoja de calendario está oculta y es una copia de la plantilla de RD.
  - Las promos salen de la tabla de promociones de cada región, con su legal.
