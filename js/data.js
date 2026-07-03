/* ============================================================
   Gestión Inside — Semilla de datos (v1: Calendario de Publicación)
   Estructura y publicaciones levantadas del KICK OFF con Payless.
   Solo se incluyen las publicaciones que el CLIENTE mencionó (julio).
   ============================================================ */

const SEED = {
  meta: {
    producto: "Gestión Inside",
    cuenta: "Payless",
    agencia: "Inside",
    version: "1.1",
    mesActual: "2026-07",
  },

  // Territorios y países (según el kick off)
  regiones: [
    { id: "cam", nombre: "Centroamérica", color: "#F97316", paises: ["Guatemala", "El Salvador", "Honduras", "Nicaragua", "Costa Rica"] },
    { id: "sur", nombre: "Sur", color: "#8B5CF6", paises: ["Ecuador", "Colombia", "Panamá"] },
    { id: "car", nombre: "Caribe", color: "#0EA5E9", paises: ["República Dominicana", "Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"] },
  ],

  // Campañas mencionadas por el cliente
  campanas: [
    { id: "liq", nombre: "Liquidación de Temporada", color: "#DC2626" },
    { id: "spider", nombre: "Spider-Man", color: "#DB2777" },
    { id: "padre", nombre: "Día del Padre", color: "#0891B2" },
    { id: "madres", nombre: "Día de las Madres", color: "#DB2777" },
    { id: "bts", nombre: "Back to School", color: "#2563EB" },
  ],

  // Canales de publicación (el cliente distingue FB / IG / WhatsApp)
  canales: ["Facebook", "Instagram", "WhatsApp"],

  // Formatos de pieza
  formatos: ["Portada", "Estática", "Video", "Carrusel", "Historia"],

  // Estado de PRODUCCIÓN (flujo interno de la agencia)
  estados: [
    { id: "briefing", nombre: "Briefing", color: "#94A3B8" },
    { id: "diseno", nombre: "Diseño / Adaptación", color: "#3B82F6" },
    { id: "revision", nombre: "Revisión interna", color: "#8B5CF6" },
    { id: "programado", nombre: "Programado", color: "#0D9488" },
    { id: "publicado", nombre: "Publicado", color: "#16A34A" },
  ],

  // Estados de APROBACIÓN DEL CLIENTE (dimensión aparte de producción)
  aprobaciones: [
    { id: "pendiente", nombre: "Pendiente", color: "#F59E0B" },
    { id: "aprobado", nombre: "Aprobado", color: "#16A34A" },
    { id: "rechazado", nombre: "Con ajustes", color: "#DC2626" },
  ],

  // Personas — equipo Inside (publican) y contactos Payless (aprueban)
  personas: [
    { id: "vic", nombre: "Victoria Alvarado", rol: "Cuenta", lado: "agencia" },
    { id: "ale", nombre: "Alexandra León Raffo", rol: "Cuenta", lado: "agencia" },
    { id: "alej", nombre: "Alejandro", rol: "Diseño", lado: "agencia" },
    { id: "franco", nombre: "Franco", rol: "Dirección", lado: "agencia" },
    { id: "nico", nombre: "Nicolás", rol: "Coord. Marketing", lado: "cliente" },
    { id: "carla", nombre: "Carla Poveda", rol: "Ecommerce & WhatsApp", lado: "cliente" },
    { id: "cristina", nombre: "Cristina Quesada", rol: "Región Sur", lado: "cliente" },
    { id: "estefany", nombre: "Estefany", rol: "Caribe inglés", lado: "cliente" },
    { id: "daini", nombre: "Daini", rol: "Caribe / Rep. Dominicana", lado: "cliente" },
    { id: "cesar", nombre: "César", rol: "Marketing", lado: "cliente" },
  ],

  // Publicaciones de JULIO 2026 (solo las que mencionó el cliente)
  piezas: [
    // --- 7 jul · lanzamiento Liquidación ---
    pz("2026-07-07", "liq", "cam", "Facebook", "Portada", "programado", "alej", "nico", "aprobado", "all",
      "Portadas ya aprobadas por el cliente. El Salvador se publicó en junio. En Centroamérica solo hay que publicar."),
    pz("2026-07-07", "liq", "sur", "Facebook", "Portada", "diseno", "alej", "cristina", "pendiente", "all",
      "Adaptar la gráfica por país y validar con Nicolás cuál aplica. Legales en el input de Cristina."),
    pz("2026-07-07", "liq", "car", "Facebook", "Portada", "diseno", "alej", "estefany", "pendiente", ["Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"],
      "Caribe inglés: adaptar a inglés, hasta 70% de descuento. Revisar la frase en inglés que observó el community de Jamaica."),
    pz("2026-07-07", "liq", "car", "Facebook", "Portada", "diseno", "alej", "daini", "pendiente", ["República Dominicana"],
      "República Dominicana: adaptar a hasta 50% de descuento (RD no tiene 70%)."),
    pz("2026-07-07", "liq", "cam", "Instagram", "Estática", "programado", "alej", "nico", "aprobado", "all",
      "Adaptaciones hechas para El Salvador (slides 15-16) que se replican al resto de Centroamérica. Salen el 7 jul."),
    pz("2026-07-07", "liq", "sur", "Instagram", "Estática", "diseno", "vic", "cristina", "pendiente", "all",
      "Adaptar los posts de liquidación para Ecuador, Colombia y Panamá."),
    pz("2026-07-07", "liq", "car", "Instagram", "Estática", "diseno", "ale", "estefany", "pendiente", ["Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"],
      "Adaptar posts de liquidación a inglés para Caribe inglés."),
    pz("2026-07-07", "liq", "cam", "Facebook", "Video", "programado", "alej", "nico", "aprobado", ["Guatemala"],
      "Video 'bobo 50' — publicar en Guatemala el 7 jul."),

    // --- 13 jul · Spider-Man (estreno película 30 jul) ---
    pz("2026-07-13", "spider", "cam", "Instagram", "Carrusel", "briefing", "vic", "nico", "pendiente", "all",
      "Colección Spider-Man. Sin legal específico de país. Empezar a publicar 13-14 jul (estreno de la película el 30 jul)."),
    pz("2026-07-13", "spider", "sur", "Instagram", "Carrusel", "briefing", "vic", "cristina", "pendiente", "all",
      "Aplica para Panamá, Ecuador y Colombia (confirmado por Cristina)."),
    pz("2026-07-13", "spider", "car", "Instagram", "Carrusel", "briefing", "ale", "estefany", "pendiente", ["Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"],
      "Adaptar el texto a inglés. No aplica para República Dominicana."),

    // --- 15 jul · Día del Padre ---
    pz("2026-07-15", "padre", "cam", "Facebook", "Video", "briefing", "alej", "nico", "pendiente", "all",
      "Reuso de contenido de junio (zapatos de caballero). Confirmar con Kevin si hay pieza disponible. Publicar desde el 15 jul."),
    pz("2026-07-15", "padre", "cam", "Instagram", "Estática", "briefing", "alej", "nico", "pendiente", "all",
      "Bailarinas de dama, nueva colección. Publicar el 15 jul."),

    // --- 21 jul · Madres (CR) + Liquidación últimos días ---
    pz("2026-07-21", "madres", "cam", "Instagram", "Estática", "briefing", "vic", "nico", "pendiente", ["Costa Rica"],
      "Prioridad Costa Rica. Nicolás envía editables y concepto. 2 contenidos por semana mostrando los productos indicados."),
    pz("2026-07-21", "liq", "cam", "Instagram", "Estática", "briefing", "ale", "nico", "pendiente", "all",
      "Liquidación 'últimos días', hasta 70%. 2 contenidos por semana desde el 21 jul. Propuesta de Inside sobre la gráfica base."),

    // --- 28 jul · Back to School Caribe ---
    pz("2026-07-28", "bts", "car", "Facebook", "Portada", "briefing", "vic", "daini", "pendiente", "all",
      "Vuelta a clases: temporada más alta de ventas en Caribe. Comienza el 28 jul. (Las alianzas con bancos en RD arrancan en agosto.)"),
  ],
};

/* Helper para construir una publicación */
function pz(fecha, campanaId, regionId, canal, formato, estado, responsable, aprobador, aprobacion, paises, notas) {
  const reg = REG(regionId);
  const target = paises === "all" ? (reg ? reg.paises.slice() : []) : paises;
  return {
    id: "pz_" + fecha.replace(/-/g, "") + "_" + regionId + "_" + canal.slice(0, 2) + "_" + Math.abs(hashStr(campanaId + formato + fecha + canal + aprobador)),
    fecha,
    mes: fecha.slice(0, 7),
    marca: "Payless",
    campanaId,
    regionId,
    canal,
    formato,
    estado,
    responsable,        // Inside — responsable de publicación
    aprobador,          // Cliente — quién aprueba
    aprobacion,         // pendiente | aprobado | rechazado
    comentarioCliente: "",
    paises: target,     // países objetivo dentro de la región
    link: "",
    notas: notas || "",
  };
}

function REG(id) {
  return [
    { id: "cam", paises: ["Guatemala", "El Salvador", "Honduras", "Nicaragua", "Costa Rica"] },
    { id: "sur", paises: ["Ecuador", "Colombia", "Panamá"] },
    { id: "car", paises: ["República Dominicana", "Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"] },
  ].find((x) => x.id === id);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

// Íconos de formato y canal (se usan en el calendario y la lista)
const FORMATO_ICONO = { "Portada": "🖼️", "Estática": "📷", "Video": "🎬", "Carrusel": "🎠", "Historia": "✨" };
const CANAL_ICONO = { "Facebook": "FB", "Instagram": "IG", "WhatsApp": "WA" };

// Roadmap v2 — para la pantalla de Roadmap
const ROADMAP_V2 = [
  { titulo: "Gestión de Cuenta (árbol de matrices)", desc: "Matriz Orgánica, Ecommerce/WhatsApp y Campañas por región, con status por matriz.", dolor: "Estructura de cuenta caótica" },
  { titulo: "Control de entregables e inputs con links", desc: "Editables, legales por país e inputs (Cristina, Estefany, RD). Trazabilidad completa: se acabó el 'yo te mandé esto'.", dolor: "Material que llega por mil lados" },
  { titulo: "Legales por país automáticos", desc: "Cada pieza jala el legal vigente del país desde el input, sin copiar-pegar a mano.", dolor: "Legales distintos por país" },
  { titulo: "Actas de reunión automáticas", desc: "Desde la transcripción se genera el acta y los acuerdos actualizan el status.", dolor: "Actas y status a mano" },
  { titulo: "Correo de estatus autogenerado", desc: "Un clic arma el reporte de material recibido / pendiente para el cliente.", dolor: "Reportes manuales" },
];
