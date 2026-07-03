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
    { id: "spider", nombre: "Spider-Man", color: "#C026D3" },
    { id: "padre", nombre: "Día del Padre", color: "#0891B2" },
    { id: "madres", nombre: "Día de las Madres", color: "#E11D74" },
    { id: "bts", nombre: "Back to School", color: "#2563EB" },
    { id: "marca", nombre: "Marca / Always On", color: "#64748B" },
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

  // Publicaciones (según la matriz orgánica real de Centroamérica + adaptaciones)
  piezas: [
    /* ===== CENTROAMÉRICA · matriz orgánica de Facebook (APROBADA y lista) ===== */
    // Portadas
    pz("2026-07-07", "liq", "cam", "Facebook", "Portada", "programado", "alej", "nico", "aprobado", ["El Salvador", "Honduras", "Nicaragua", "Costa Rica"],
      "Portadas de Liquidación 70% aprobadas. El Salvador ya en línea desde el 29 jun. Vigencia 7 jul – 3 ago."),
    pz("2026-07-07", "marca", "cam", "Facebook", "Portada", "programado", "alej", "nico", "aprobado", ["Guatemala"],
      "Portada de marca 'La tendencia empieza contigo'. Guatemala usa esta, no la de liquidación."),
    // Posts / contenido
    pz("2026-07-07", "liq", "cam", "Facebook", "Video", "programado", "alej", "nico", "aprobado", ["Guatemala"],
      "[Value for Money] 2x1: lleva el 2º artículo a 50% de descuento. Vigencia 7 jul – 3 ago. (Guatemala)"),
    pz("2026-07-07", "liq", "cam", "Facebook", "Video", "programado", "alej", "nico", "aprobado", ["El Salvador"],
      "[Value for Money] 2x1: lleva el 2º artículo a 40% de descuento (versión El Salvador)."),
    pz("2026-07-08", "marca", "cam", "Facebook", "Video", "programado", "vic", "nico", "aprobado", ["Guatemala"],
      "[Style & Comfort] 'Una opción para cada día'. Ref. 210821 – 2108 – 210845. (Guatemala)"),
    pz("2026-07-09", "marca", "cam", "Facebook", "Video", "programado", "alej", "nico", "aprobado", ["El Salvador", "Nicaragua", "Honduras", "Costa Rica"],
      "[Style & Comfort] 'Diseñados para destacar' (hombre). Ref. 211572. No aplica Guatemala."),
    pz("2026-07-10", "marca", "cam", "Facebook", "Estática", "programado", "alej", "nico", "aprobado", "all",
      "[Style & Comfort] 'Elegancia que se adapta – Comfort plus', tacones de cuero. Aplica a toda Centroamérica. Ref. 210677."),
    pz("2026-07-10", "marca", "cam", "Facebook", "Historia", "programado", "ale", "nico", "aprobado", "all",
      "[Style & Comfort] Historia de 'Elegancia que se adapta'. Aplica a toda Centroamérica."),
    pz("2026-07-13", "spider", "cam", "Facebook", "Estática", "programado", "alej", "nico", "aprobado", "all",
      "[Style & Comfort] Tenis Spider-Man con luces (niños). Aplica a toda Centroamérica. Ref. 211349. (Estreno película 30 jul.)"),
    pz("2026-07-13", "spider", "cam", "Facebook", "Historia", "programado", "ale", "nico", "aprobado", "all",
      "[Style & Comfort] Historia Spider-Man. Aplica a toda Centroamérica."),
    pz("2026-06-29", "liq", "cam", "Facebook", "Estática", "publicado", "alej", "nico", "aprobado", ["El Salvador"],
      "[Value for Money] 'Es el momento exacto' – Liquidación 70%. Ya publicado el 29 jun en El Salvador."),
    pz("2026-07-21", "marca", "cam", "Facebook", "Estática", "programado", "alej", "nico", "aprobado", ["El Salvador", "Nicaragua", "Honduras"],
      "[Style & Comfort] 'Lower East Side' (dama). Ref. 211842-43-44. Aplica a El Salvador, Nicaragua y Honduras."),
    pz("2026-07-21", "marca", "cam", "Facebook", "Historia", "programado", "ale", "nico", "aprobado", ["El Salvador", "Nicaragua", "Honduras"],
      "[Style & Comfort] Historia 'Lower East Side'. El Salvador, Nicaragua y Honduras."),

    /* ===== SUR · adaptaciones pendientes (Cristina Quesada) ===== */
    pz("2026-07-07", "liq", "sur", "Facebook", "Portada", "diseno", "alej", "cristina", "pendiente", "all",
      "Adaptar portada de Liquidación 70% a Ecuador, Colombia y Panamá. Validar con Nicolás la gráfica. Legales en el input de Cristina."),
    pz("2026-07-07", "liq", "sur", "Facebook", "Estática", "diseno", "vic", "cristina", "pendiente", "all",
      "Adaptar los posts de liquidación para Sur (Ecuador, Colombia, Panamá)."),
    pz("2026-07-13", "spider", "sur", "Facebook", "Estática", "briefing", "ale", "cristina", "pendiente", "all",
      "Spider-Man aplica para Panamá, Ecuador y Colombia (confirmado por Cristina)."),

    /* ===== CARIBE · adaptaciones pendientes (Estefany / Daini) ===== */
    pz("2026-07-07", "liq", "car", "Facebook", "Portada", "diseno", "alej", "estefany", "pendiente", ["Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"],
      "Caribe inglés: adaptar portada a inglés, hasta 70%. Revisar la frase en inglés observada por el community de Jamaica."),
    pz("2026-07-07", "liq", "car", "Facebook", "Portada", "diseno", "alej", "daini", "pendiente", ["República Dominicana"],
      "República Dominicana: adaptar a hasta 50% (RD no tiene 70%)."),
    pz("2026-07-13", "spider", "car", "Facebook", "Estática", "briefing", "ale", "estefany", "pendiente", ["Jamaica", "Trinidad y Tobago", "Barbados", "Guyana", "Islas Vírgenes"],
      "Spider-Man: adaptar texto a inglés. No aplica República Dominicana."),
    pz("2026-07-28", "bts", "car", "Facebook", "Portada", "briefing", "vic", "daini", "pendiente", "all",
      "Back to School / vuelta a clases: temporada más alta de ventas en Caribe. Comienza el 28 jul. (Alianzas con bancos en RD arrancan en agosto.)"),

    /* ===== CENTROAMÉRICA · pendientes de brief (fuera de la matriz aprobada) ===== */
    pz("2026-07-21", "madres", "cam", "Facebook", "Estática", "briefing", "vic", "nico", "pendiente", ["Costa Rica"],
      "Prioridad Costa Rica. Nicolás envía editables y concepto. 2 contenidos por semana mostrando los productos indicados."),
    pz("2026-07-21", "liq", "cam", "Facebook", "Estática", "briefing", "ale", "nico", "pendiente", "all",
      "Liquidación 'últimos días', hasta 70%. Refuerzo desde el 21 jul. Propuesta de Inside sobre la gráfica base."),

    /* ===== POR ASIGNAR FECHA (sin día definido) ===== */
    pz("", "liq", "cam", "Facebook", "Video", "programado", "alej", "nico", "aprobado", ["El Salvador"],
      "[Value for Money] 'Season Sale – un par nunca es suficiente'. FECHA TBC (por confirmar). El Salvador.", "tbc"),
    pz("", "madres", "cam", "Facebook", "Carrusel", "briefing", "ale", "nico", "pendiente", ["Costa Rica"],
      "Segundo contenido semanal de Día de las Madres (Costa Rica). Fecha según editables de Nicolás.", "bmad"),
    pz("", "padre", "cam", "Facebook", "Video", "briefing", "alej", "nico", "pendiente", "all",
      "Día del Padre: reuso de contenido de junio (zapatos de caballero). Confirmar con Kevin y fecha (aprox. 15 jul).", "bpad"),
    pz("", "liq", "sur", "Facebook", "Estática", "briefing", "vic", "cristina", "pendiente", "all",
      "Refuerzo de liquidación para Sur (Ecuador, Colombia, Panamá). Por asignar fecha.", "bsur"),
    pz("", "liq", "cam", "WhatsApp", "Estática", "briefing", "vic", "carla", "pendiente", "all",
      "Ecommerce y WhatsApp en standby: Carla Poveda organiza lo pendiente antes de programar la Pauta.", "bwa"),
  ],
};

/* Helper para construir una publicación (fecha "" = sin fecha / por asignar) */
function pz(fecha, campanaId, regionId, canal, formato, estado, responsable, aprobador, aprobacion, paises, notas, salt) {
  const reg = REG(regionId);
  const target = paises === "all" ? (reg ? reg.paises.slice() : []) : paises;
  return {
    id: "pz_" + (fecha ? fecha.replace(/-/g, "") : "sf" + (salt || "")) + "_" + regionId + "_" + canal.slice(0, 2) + "_" + Math.abs(hashStr(campanaId + formato + fecha + canal + aprobador + (salt || ""))),
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
