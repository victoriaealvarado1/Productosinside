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

  // Áreas del equipo Inside (para agrupar y distribuir pendientes)
  areas: ["Cuentas", "Diseño", "Audiovisual", "Creatividad", "Community", "Medios", "Dirección"],

  // Personas — equipo Inside (publican) y contactos Payless (aprueban)
  personas: [
    { id: "vic", nombre: "Victoria Alvarado", rol: "Cuenta", area: "Cuentas", lado: "agencia" },
    { id: "ale", nombre: "Alexandra León Raffo", rol: "Directora Social Media", area: "Cuentas", lado: "agencia" },
    { id: "sunny", nombre: "Sunniva Giraldo", rol: "Ejecutiva de cuenta", area: "Cuentas", lado: "agencia" },
    { id: "rober", nombre: "Roberto Olazabal", rol: "Content Manager", area: "Creatividad", lado: "agencia" },
    { id: "dani", nombre: "Daniela Argumedo", rol: "Redactora creativa", area: "Creatividad", lado: "agencia" },
    { id: "luismi", nombre: "Luis Miguel Pérez", rol: "Dir. Planning y Creatividad", area: "Creatividad", lado: "agencia" },
    { id: "alej", nombre: "Alejandro Mendoza", rol: "Diseñador Gráfico", area: "Diseño", lado: "agencia" },
    { id: "kevin", nombre: "Kevin Tasaico", rol: "Director de Arte", area: "Diseño", lado: "agencia" },
    { id: "antu", nombre: "Antuané Medrano", rol: "Editora Audiovisual", area: "Audiovisual", lado: "agencia" },
    { id: "ari", nombre: "Ariana Torrecilla", rol: "Community Manager", area: "Community", lado: "agencia" },
    { id: "jairo", nombre: "Jairo López", rol: "Supervisor de Medios", area: "Medios", lado: "agencia" },
    { id: "franco", nombre: "Franco", rol: "Dirección", area: "Dirección", lado: "agencia" },
    { id: "nico", nombre: "Nicolás", rol: "Coord. Marketing", lado: "cliente" },
    { id: "carla", nombre: "Carla Poveda", rol: "Ecommerce & WhatsApp", lado: "cliente" },
    { id: "cristina", nombre: "Cristina Quesada", rol: "Región Sur", lado: "cliente" },
    { id: "estefany", nombre: "Estefany", rol: "Caribe inglés", lado: "cliente" },
    { id: "daini", nombre: "Daini", rol: "Caribe / Rep. Dominicana", lado: "cliente" },
    { id: "cesar", nombre: "César", rol: "Marketing", lado: "cliente" },
  ],

  /* ===== GESTIÓN: pendientes (con trazabilidad: historial, falta info, matriz) ===== */
  pendientes: [
    // — Del cliente (Payless nos debe) —
    pd("pc1", "cliente", "Acceso al SharePoint para toda la lista de correos + Victoria", "nico", "Accesos", "2026-07-03", "", "Sin esto solo entra la cuenta de Franco.",
      [ev("2026-07-03", "📤 Solicitado en el kick off: 'a más tardar el día de hoy'")], "Falta que TI de Payless agregue los correos del equipo", ""),
    pd("pc2", "cliente", "Acceso a la carpeta 2026 de Nicolás (editables)", "nico", "Accesos", "2026-07-06", "", "Ale tiene los cambios anotados pero no el material.",
      [ev("2026-07-03", "📤 Solicitado en reunión interna: la carpeta no abre con nuestras cuentas")], "", ""),
    pd("pc3", "cliente", "Editables de Liquidación (portadas + posts + videos)", "nico", "Editables", "2026-07-03", "", "Para adaptar Caribe inglés 70%, RD 50% y Sur.",
      [ev("2026-07-03", "📤 Solicitado en el kick off: 'hoy antes del almuerzo'"), ev("2026-07-03", "📝 Solo llegaron artes finales JPG")], "Faltan los archivos editables (solo hay JPG finales)", "mo_car"),
    pd("pc4", "cliente", "Editables + concepto de Día de las Madres (Costa Rica)", "nico", "Editables", "2026-07-10", "", "Campaña inicia el 21 jul en CR: editables, concepto y lista de productos.",
      [ev("2026-07-03", "📤 Solicitado en el kick off; Nicolás confirmó envío")], "", "ca_madres"),
    pd("pc5", "cliente", "Habilitar input del Sur (legales Ecuador / Colombia / Panamá)", "cristina", "Inputs", "2026-07-06", "", "Reunión con Cristina el lunes.",
      [ev("2026-07-03", "📤 Reportado: el link no abre con ninguna de nuestras cuentas")], "Acceso al documento de legales del Sur", "mo_sur"),
    pd("pc6", "cliente", "Estatus de la matriz Pauta & Commerce", "carla", "Matrices", "", "", "Carla Poveda organiza lo pendiente de Ecommerce/WhatsApp y avisa.",
      [ev("2026-07-03", "📤 Acordado en el kick off: esperar señal de Carla")], "", "mp_ecom_cam"),
    pd("pc7", "cliente", "Confirmar pieza de Día del Padre reutilizable (con Kevin)", "nico", "Contenido", "2026-07-08", "", "Hay contenido de junio que quizá funciona; falta confirmar modelo/foto.",
      [ev("2026-07-03", "📤 Nicolás quedó en confirmar con Kevin (cliente)")], "", ""),
    pd("pc8", "cliente", "Comentario de Jamaica sobre la frase en inglés", "estefany", "Contenido", "", "", "Nota para el ajuste de la pieza de Caribe inglés.",
      [ev("2026-07-03", "📤 Estefany quedó en pasar el comentario de la community de Jamaica")], "", "mo_car"),
    // — De Inside (nosotros debemos) —
    pd("pi1", "inside", "Correo de estatus al cliente (recibido / pendiente, con links)", "ale", "Gestión", "2026-07-04", "", "Formato acordado: material recibido, pendiente y accesos en un solo estatus.",
      [ev("2026-07-03", "🏁 Acordado en reunión interna; Ale redacta")], "", ""),
    pd("pi2", "inside", "Pedido al diseñador: adaptaciones de Liquidación", "ale", "Diseño", "2026-07-04", "", "Editable de julio ubicado. Piezas listas el martes 7.",
      [ev("2026-07-03", "🏁 Editable localizado por Ale; falta hacer el pedido formal")], "", "mo_cam"),
    pd("pi3", "inside", "Adaptar portada Liquidación a inglés 70% (Caribe inglés)", "alej", "Diseño", "2026-07-06", "", "Misma gráfica de círculos concéntricos, en inglés, para el 7 jul.",
      [ev("2026-07-03", "🏁 Asignado a diseño tras el kick off")], "Falta el editable del cliente", "mo_car", "pc3"),
    pd("pi4", "inside", "Adaptar Liquidación de RD al 50%", "alej", "Diseño", "2026-07-06", "", "RD no tiene 70%: su versión es hasta 50% de descuento.",
      [ev("2026-07-03", "🏁 Asignado a diseño tras el kick off")], "Falta el editable del cliente", "mo_car", "pc3"),
    pd("pi5", "inside", "Enlazar links de piezas finales en el calendario", "sunny", "Gestión", "2026-07-06", "", "Ale pasó los links por WhatsApp; falta enlazar cada pieza.",
      [ev("2026-07-03", "🏁 Links recopilados por Ale (WhatsApp); se asigna el lunes")], "", "mo_cam"),
    pd("pi6", "inside", "Cuadro países ↔ contacto del cliente", "vic", "Gestión", "2026-07-06", "", "Carla CAM (por ahora), Cristina Sur, Estefany Caribe inglés, Daini RD.",
      [ev("2026-07-03", "🏁 Acordado en el kick off para ordenar la coordinación")], "", ""),
    pd("pi7", "inside", "Refuerzo del equipo con inglés técnico (para Estefany)", "franco", "Equipo", "", "", "En ~1 mes Estefany queda sola con Caribe inglés.",
      [ev("2026-07-03", "🏁 Pedido explícito del cliente en el kick off")], "", ""),
    pd("pi8", "inside", "Excel de monitoreo", "ari", "Gestión", "", "", "Del Masterdoc.",
      [ev("2026-07-01", "🏁 Solicitado a Ari")], "", ""),
    pd("pi9", "inside", "Documento de procesos", "sunny", "Gestión", "", "", "Del Masterdoc.",
      [ev("2026-07-01", "🏁 En construcción (Sunny)")], "", ""),
    pd("pi10", "inside", "Estrategia de RRSS 2026 / drivers estratégicos", "luismi", "Creatividad", "", "", "Del Masterdoc.",
      [ev("2026-07-01", "🏁 Pendiente de arranque")], "", ""),
  ],

  /* ===== GESTIÓN POR MES: matrices (estructura real de los tactiqs) =====
     4 grandes grupos: Malls, Pauta (ECOM/WA/PMAX/Tiendas), ATL, Orgánica — × región.
     + Campañas del mes. Cada matriz enlazable a su documento y a sus pendientes. */
  matrices: [
    // — Matriz Malls —
    mx("mm_cam", "2026-07", "Matriz Malls", "", "Centroamérica", "activo", 50, "ale", "nico", "", "Matriz Mall del mes en curso."),
    mx("mm_sur", "2026-07", "Matriz Malls", "", "Sur", "activo", 40, "vic", "cristina", "", ""),
    mx("mm_car", "2026-07", "Matriz Malls", "", "Caribe", "activo", 40, "ale", "daini", "", ""),
    // — Matriz Pauta (la lleva la agencia de medios; Inside da seguimiento y apoya ECOM/WA) —
    mx("mp_ecom_cam", "2026-07", "Matriz Pauta", "ECOM", "Centroamérica", "standby", 10, "vic", "carla", "", "Carla Poveda organiza lo pendiente y avisa cuándo publicamos."),
    mx("mp_ecom_sur", "2026-07", "Matriz Pauta", "ECOM", "Sur", "standby", 10, "vic", "carla", "", ""),
    mx("mp_wa_cam", "2026-07", "Matriz Pauta", "WA · WhatsApp", "Centroamérica", "standby", 10, "vic", "carla", "", "Contenidos de WhatsApp que luego pauta la agencia de medios."),
    mx("mp_wa_sur", "2026-07", "Matriz Pauta", "WA · WhatsApp", "Sur", "standby", 10, "vic", "carla", "", ""),
    mx("mp_wa_car", "2026-07", "Matriz Pauta", "WA · WhatsApp", "Caribe", "standby", 10, "vic", "carla", "", ""),
    mx("mp_pmax_cam", "2026-07", "Matriz Pauta", "PMAX", "Centroamérica", "seguimiento", 0, "jairo", "carla", "", "Performance Max: la ejecuta la agencia de medios; Inside solo da seguimiento."),
    mx("mp_pmax_sur", "2026-07", "Matriz Pauta", "PMAX", "Sur", "seguimiento", 0, "jairo", "carla", "", ""),
    mx("mp_tie_cam", "2026-07", "Matriz Pauta", "Tiendas", "Centroamérica", "seguimiento", 0, "jairo", "carla", "", ""),
    mx("mp_tie_sur", "2026-07", "Matriz Pauta", "Tiendas", "Sur", "seguimiento", 0, "jairo", "carla", "", ""),
    mx("mp_tie_car", "2026-07", "Matriz Pauta", "Tiendas", "Caribe", "seguimiento", 0, "jairo", "carla", "", ""),
    // — Matriz ATL —
    mx("atl_cam", "2026-07", "Matriz ATL", "", "Centroamérica", "cerrado", 100, "ale", "nico", "", "Gestionada con el proveedor anterior."),
    mx("atl_sur", "2026-07", "Matriz ATL", "", "Sur", "cerrado", 100, "ale", "cristina", "", ""),
    mx("atl_car", "2026-07", "Matriz ATL", "", "Caribe", "activo", 90, "ale", "daini", "", "La campaña ATL de RD está culminando."),
    // — Matriz Orgánica —
    mx("mo_cam", "2026-07", "Matriz Orgánica", "", "Centroamérica", "activo", 70, "vic", "nico", "", "Matriz recibida y aprobada. Publicaciones del 7 al 21 jul en el calendario."),
    mx("mo_sur", "2026-07", "Matriz Orgánica", "", "Sur", "esperando", 20, "vic", "cristina", "", "Esperando acceso al input (legales). Reunión con Cristina el lunes."),
    mx("mo_car", "2026-07", "Matriz Orgánica", "", "Caribe", "activo", 35, "ale", "estefany", "", "Adaptaciones a inglés (70%) y RD (50%) en diseño para el 7 jul."),
    // — Campañas del mes —
    mx("ca_liq", "2026-07", "Campañas", "Liquidación de Temporada", "Las 3 regiones", "activo", 60, "ale", "nico", "", "Lanzada en CAM; adaptaciones Sur/Caribe en curso. Refuerzos desde el 21 jul."),
    mx("ca_madres", "2026-07", "Campañas", "Día de las Madres", "Costa Rica", "activo", 15, "vic", "nico", "", "Inicia 21 jul. 2 contenidos por semana."),
    mx("ca_spider", "2026-07", "Campañas", "Spider-Man", "CAM · Sur · Caribe inglés", "activo", 40, "alej", "nico", "", "Publicar desde el 13-14 jul (estreno 30 jul)."),
    mx("ca_bts", "2026-07", "Campañas", "Back to School", "Caribe", "briefing", 5, "vic", "daini", "", "Arranca 28 jul. Alianzas con bancos RD: agosto."),
  ],

  /* ===== INFORMACIÓN GENERAL: aprendizajes de la cuenta ===== */
  aprendizajes: [
    ap("2026-07-03", "República Dominicana no maneja 70% de descuento: su liquidación es hasta 50%.", "Kick off"),
    ap("2026-07-03", "Guatemala usa portada de marca ('La tendencia empieza contigo'), no la de liquidación.", "Matriz CAM"),
    ap("2026-07-03", "Los legales de cada promoción viven en el input de cada región y deben coincidir con el país de la pieza.", "Kick off"),
    ap("2026-07-03", "La matriz de Pauta la ejecuta la agencia de medios; Inside solo apoya ECOM y WhatsApp cuando Carla avise.", "Kick off"),
    ap("2026-07-03", "Al cliente le gusta el estatus resumido: recibido / pendiente / accesos, sin pestañas de más.", "Reunión interna"),
    ap("2026-07-03", "Caribe inglés se comporta como una sola plataforma (un solo IG); back to school es su temporada más alta.", "Kick off"),
    ap("2026-07-03", "Estefany quedará sola con Caribe inglés en ~1 mes: se necesita refuerzo con inglés técnico.", "Kick off"),
  ],

  /* ===== GESTIÓN: Masterdoc (del Excel, SIN contraseñas) ===== */
  masterdoc: {
    ficha: {
      cliente: "PAYLESS",
      inicio: "1 de julio de 2026",
      contactoInside: "Alexandra León Raffo (Directora Social Media)",
      comunicacion: "Correo y grupo de WhatsApp",
    },
    documentacion: [
      md("Brief / información estratégica de la marca", "PAYLESS", "pendiente", ""),
      md("Manual de Identidad Gráfica / Brandbook", "PAYLESS", "entregado", ""),
      md("Documento de Aprendizajes", "Inside", "pendiente", "https://docs.google.com/document/d/12NvVrRHtBav2Z4ydvzlgbmD3gdJq34lu96x5Hwkn1YE/"),
      md("Status de la marca", "Inside", "pendiente", ""),
      md("Documentos de Acuerdos", "Inside / PAYLESS", "pendiente", ""),
      md("Estrategia de RRSS 2026 (drivers estratégicos)", "Inside", "pendiente", ""),
      md("ADN de marca", "Inside", "pendiente", ""),
      md("Manual ejecutivos", "Inside", "pendiente", ""),
      md("Planning mensual", "Inside", "pendiente", ""),
      md("FAQs de la marca", "Inside / PAYLESS", "pendiente", ""),
      md("Excel de monitoreo", "Inside", "pendiente", "", "Solicitado a Ari"),
      md("Documento de procesos", "Inside", "pendiente", "", "En construcción (Sunny)"),
      md("Carpeta Drive principal", "Inside", "entregado", ""),
    ],
    fechasClave: [
      { que: "Envío de drivers comerciales mensuales", quien: "PAYLESS", cuando: "El 20 de cada mes" },
      { que: "Desarrollo del planning mensual", quien: "Inside", cuando: "2-3 días después de los drivers" },
      { que: "Reunión de planning", quien: "Inside + PAYLESS", cuando: "El 25 de cada mes" },
      { que: "Reporte semanal", quien: "Inside", cuando: "Todos los jueves" },
    ],
    // Cuentas por país — SOLO usuarios. Las contraseñas viven fuera de esta herramienta.
    cuentas: [
      { pais: "Guatemala", usuario: "@paylessguatemala" },
      { pais: "El Salvador", usuario: "@paylesselsalvador" },
      { pais: "Nicaragua", usuario: "@payless.nicaragua" },
      { pais: "Honduras", usuario: "@paylesshonduras" },
      { pais: "Costa Rica", usuario: "@paylesscostarica" },
      { pais: "Panamá", usuario: "@payless.panama" },
      { pais: "Colombia", usuario: "@payless.colombia" },
      { pais: "Ecuador", usuario: "@paylessecuador" },
      { pais: "Perú", usuario: "@payless.peru" },
      { pais: "Rep. Dominicana", usuario: "@paylessdr" },
      { pais: "Caribe inglés", usuario: "@paylesscaribbean" },
    ],
  },

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

/* Helpers de gestión */
function pd(id, lado, titulo, responsable, area, limite, link, notas, historial, faltaInfo, matrizId, bloqueadoPor) {
  return { id, lado, titulo, responsable, area, limite: limite || "", link: link || "", notas: notas || "", hecho: false, historial: historial || [], faltaInfo: faltaInfo || "", matrizId: matrizId || "", bloqueadoPor: bloqueadoPor || "" };
}
function ev(fecha, texto) { return { fecha, texto }; }
function mx(id, mes, grupo, sub, region, estado, avance, responsable, aprobador, link, notas) {
  return { id, mes, grupo, sub: sub || "", region, estado, avance, responsable, aprobador, link: link || "", notas: notas || "" };
}
function ap(fecha, texto, fuente) { return { id: "ap_" + Math.abs(hashStr(texto)), fecha, texto, fuente: fuente || "" }; }
function md(entregable, responsable, estado, link, nota) {
  return { entregable, responsable, estado, link: link || "", nota: nota || "" };
}

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
