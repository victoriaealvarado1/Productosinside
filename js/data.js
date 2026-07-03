/* ============================================================
   Gestión Inside — Semilla de datos (v1: Calendario de Publicación)
   Estructura real de la cuenta Payless levantada en la reunión.
   Este archivo es la "fuente de verdad inicial". El módulo de
   Gestión de Cuenta (v2) se conecta sobre este mismo modelo.
   ============================================================ */

const SEED = {
  meta: {
    producto: "Gestión Inside",
    cuenta: "Payless",
    agencia: "Inside",
    version: "1.0",
    mesActual: "2026-07",
  },

  // Los 3 territorios de la cuenta y sus países
  regiones: [
    { id: "car", nombre: "Caribe", color: "#0EA5E9", paises: ["República Dominicana", "Jamaica"] },
    { id: "cam", nombre: "Centroamérica", color: "#F97316", paises: ["Honduras", "Guatemala", "El Salvador", "Nicaragua", "Costa Rica", "Panamá"] },
    { id: "sur", nombre: "Sur", color: "#8B5CF6", paises: ["Ecuador", "Perú", "Colombia"] },
  ],

  // Campañas vivas mencionadas en la reunión
  campanas: [
    { id: "bts", nombre: "Back to School", color: "#2563EB" },
    { id: "madres", nombre: "Día de las Madres", color: "#DB2777" },
    { id: "liq", nombre: "Liquidación", color: "#DC2626" },
    { id: "mundial", nombre: "Mundial", color: "#059669" },
    { id: "always", nombre: "Always On / Orgánico", color: "#64748B" },
  ],

  // Formatos de pieza
  formatos: ["Portada", "Estática", "Video", "Carrusel", "Historia"],

  // Pipeline de estados (el "status" que hoy pasan a mano)
  estados: [
    { id: "briefing", nombre: "Briefing", color: "#94A3B8" },
    { id: "diseno", nombre: "Diseño", color: "#3B82F6" },
    { id: "revision", nombre: "Revisión interna", color: "#8B5CF6" },
    { id: "aprobacion", nombre: "Aprobación cliente", color: "#F59E0B" },
    { id: "programado", nombre: "Programado", color: "#0D9488" },
    { id: "publicado", nombre: "Publicado", color: "#16A34A" },
  ],

  // Personas: equipo Inside + contactos del cliente
  personas: [
    { id: "vic", nombre: "Victoria Alvarado", rol: "Cuenta", lado: "agencia" },
    { id: "ale", nombre: "Alexandra León Raffo", rol: "Cuenta", lado: "agencia" },
    { id: "alej", nombre: "Alejandro", rol: "Diseño", lado: "agencia" },
    { id: "franco", nombre: "Franco", rol: "Dirección", lado: "agencia" },
    { id: "nico", nombre: "Nicolás", rol: "Coord. Marketing", lado: "cliente" },
    { id: "cesar", nombre: "César", rol: "Marketing", lado: "cliente" },
    { id: "carla", nombre: "Carla Poveda", rol: "Contenido", lado: "cliente" },
    { id: "silvana", nombre: "Silvana", rol: "Coordinación", lado: "cliente" },
    { id: "daini", nombre: "Daini", rol: "Historias", lado: "cliente" },
  ],

  // Piezas del calendario — Julio 2026 (mes en curso)
  piezas: [
    pieza("2026-07-02", "Liquidación", "liq", "car", "Portada", "publicado", "alej", "aprobado"),
    pieza("2026-07-03", "Liquidación", "liq", "cam", "Estática", "programado", "alej", "aprobado"),
    pieza("2026-07-04", "Liquidación", "liq", "sur", "Video", "aprobacion", "alej", "pendiente"),
    pieza("2026-07-07", "Back to School", "bts", "car", "Carrusel", "revision", "vic", "pendiente"),
    pieza("2026-07-08", "Back to School", "bts", "cam", "Estática", "diseno", "alej", "pendiente"),
    pieza("2026-07-09", "Back to School", "bts", "sur", "Portada", "diseno", "alej", "pendiente"),
    pieza("2026-07-10", "Always On / Orgánico", "always", "car", "Historia", "programado", "daini", "aprobado"),
    pieza("2026-07-11", "Día de las Madres", "madres", "cam", "Video", "aprobacion", "alej", "pendiente"),
    pieza("2026-07-14", "Mundial", "mundial", "sur", "Estática", "briefing", "ale", "pendiente"),
    pieza("2026-07-15", "Back to School", "bts", "car", "Video", "diseno", "alej", "pendiente"),
    pieza("2026-07-16", "Always On / Orgánico", "always", "cam", "Carrusel", "revision", "ale", "pendiente"),
    pieza("2026-07-18", "Liquidación", "liq", "sur", "Portada", "publicado", "alej", "aprobado"),
    pieza("2026-07-21", "Back to School", "bts", "cam", "Video", "briefing", "vic", "pendiente"),
    pieza("2026-07-22", "Mundial", "mundial", "car", "Carrusel", "briefing", "ale", "pendiente"),
    pieza("2026-07-24", "Always On / Orgánico", "always", "sur", "Historia", "programado", "daini", "aprobado"),
    pieza("2026-07-28", "Back to School", "bts", "sur", "Estática", "diseno", "alej", "pendiente"),
    pieza("2026-07-30", "Back to School", "bts", "car", "Portada", "briefing", "vic", "pendiente"),
  ],
};

// Helper para construir una pieza con aprobaciones por país de su región
function pieza(fecha, campanaNombre, campanaId, regionId, formato, estadoId, responsableId, aprobBase) {
  const region = SEED_REGION(regionId);
  const aprobaciones = {};
  (region ? region.paises : []).forEach((p) => (aprobaciones[p] = aprobBase || "pendiente"));
  return {
    id: "pz_" + fecha.replace(/-/g, "") + "_" + regionId + "_" + Math.abs(hashStr(campanaNombre + formato + fecha)),
    fecha,
    mes: fecha.slice(0, 7),
    marca: "Payless",
    campana: campanaNombre,
    campanaId,
    regionId,
    formato,
    estado: estadoId,
    responsable: responsableId,
    link: "",
    aprobaciones,
    notas: "",
  };
}

// (definido antes de usarse arriba porque las funciones se elevan)
function SEED_REGION(id) {
  const r = [
    { id: "car", paises: ["República Dominicana", "Jamaica"] },
    { id: "cam", paises: ["Honduras", "Guatemala", "El Salvador", "Nicaragua", "Costa Rica", "Panamá"] },
    { id: "sur", paises: ["Ecuador", "Perú", "Colombia"] },
  ].find((x) => x.id === id);
  return r;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// Módulos futuros (v2) — solo para pintar el roadmap dentro de la app
const ROADMAP_V2 = [
  { titulo: "Gestión de Cuenta (árbol de matrices)", desc: "Los 5 grandes grupos (Matriz Mall/ATL, Matriz Pauta con sus 4 submatrices, Matriz Orgánica, Campañas) × 3 regiones, con status por matriz.", dolor: "Estructura mental caótica" },
  { titulo: "Control de entregables con links", desc: "Material recibido / pendiente / accesos, cada uno con su link. Trazabilidad completa: se acabó el 'yo te mandé esto'.", dolor: "Trazabilidad perdida" },
  { titulo: "Actas de reunión automáticas", desc: "Desde la transcripción se genera el acta y los acuerdos actualizan el status directamente.", dolor: "Actas y status a mano" },
  { titulo: "Aprobación del cliente por país", desc: "Cada país entra y aprueba/rechaza lo que le aplica, sin pelear con los chats de Teams.", dolor: "Sin canal de aprobación" },
  { titulo: "Correo de estatus autogenerado", desc: "Un clic arma el correo 'material recibido / pendiente' para mandar al cliente.", dolor: "Reportes manuales" },
];
