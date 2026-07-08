/* ============================================================
   Traductor Inside — Reuniones bilingües ES ⇄ EN
   v1 · Modo Solo: todo corre en el navegador, sin backend.
   - Voz → texto: Web Speech API (SpeechRecognition)
   - Traducción: Translator API de Chrome, con respaldos en línea
   - Texto → voz: speechSynthesis
   - Persistencia: localStorage
   ============================================================ */
(() => {
  "use strict";

  const LS_KEY = "ti_reuniones_v1";
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const REC_LANGS = { es: "es-MX", en: "en-US" };
  const $ = (sel, el = document) => el.querySelector(sel);

  /* ---------------- Estado ---------------- */
  const state = {
    view: "live",            // live | meetings
    meetings: loadMeetings(),
    currentId: null,
    turn: "es",              // idioma que se está escuchando: es (yo) | en (cliente)
    auto: true,              // detección automática de idioma por frase
    speak: false,            // leer traducciones en voz alta
    clientView: false,       // vista Cliente (todo en inglés)
    listening: false,        // intención de escuchar (el usuario activó el mic)
    interim: "",             // transcripción provisional en curso
    micError: null,
  };

  // Reabrir la reunión más reciente que quedó abierta en esta sesión
  const lastOpen = localStorage.getItem(LS_KEY + "_open");
  if (lastOpen && state.meetings.some(m => m.id === lastOpen)) state.currentId = lastOpen;

  function loadMeetings() {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_KEY)) || [];
      // Traducciones que quedaron en curso al cerrar la pestaña → ofrecer reintento
      for (const m of arr) for (const msg of m.mensajes) {
        if (msg.traduccion == null && !msg.error) msg.error = true;
      }
      return arr;
    }
    catch { return []; }
  }
  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(state.meetings));
    localStorage.setItem(LS_KEY + "_open", state.currentId || "");
  }
  const meeting = () => state.meetings.find(m => m.id === state.currentId) || null;
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  const hhmm = () => new Date().toTimeString().slice(0, 5);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ================================================================
     Detección de idioma (texto)
     1) LanguageDetector nativo de Chrome si existe
     2) Heurística por palabras frecuentes ES/EN
     ================================================================ */
  let nativeDetector = null, nativeDetectorTried = false;
  async function getNativeDetector() {
    if (nativeDetectorTried) return nativeDetector;
    nativeDetectorTried = true;
    try {
      if ("LanguageDetector" in self) {
        const avail = await LanguageDetector.availability();
        if (avail === "available") {
          nativeDetector = await LanguageDetector.create();
        } else if (avail !== "unavailable") {
          // El modelo aún se descarga: no bloquear, la heurística cubre mientras
          LanguageDetector.create().then(d => { nativeDetector = d; }).catch(() => {});
        }
      }
    } catch { nativeDetector = null; }
    return nativeDetector;
  }

  const STOP_ES = new Set("el la los las de que y en un una es no por con para como pero más este esta esto yo se del lo mi si ya muy también está están hay todo bien gracias hola entonces porque cuando hacer tenemos necesito quiero puede vamos donde qué cómo aquí eso nos les su sus estamos sobre".split(" "));
  const STOP_EN = new Set("the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so can need want let me is are was were yes okay ok thanks thank hello please about when how where why our your just going get make".split(" "));

  function heuristicLang(text) {
    const words = text.toLowerCase().replace(/[^\p{L}\s']/gu, "").split(/\s+/).filter(Boolean);
    let es = 0, en = 0;
    for (const w of words) { if (STOP_ES.has(w)) es++; if (STOP_EN.has(w)) en++; }
    // Acentos y eñes solo existen en español
    if (/[áéíóúñ¿¡]/i.test(text)) es += 2;
    if (es === en) return null;
    return es > en ? "es" : "en";
  }

  async function detectLang(text) {
    const det = await getNativeDetector();
    if (det) {
      try {
        const res = await det.detect(text);
        const top = res && res[0];
        if (top && top.confidence > 0.55 && (top.detectedLanguage === "es" || top.detectedLanguage === "en")) {
          return top.detectedLanguage;
        }
      } catch { /* cae a la heurística */ }
    }
    return heuristicLang(text);
  }

  /* ================================================================
     Traducción, en cascada:
     1) Translator API nativa de Chrome (local, sin internet una vez
        descargado el modelo)
     2) Endpoint público de Google Translate
     3) MyMemory
     ================================================================ */
  const nativeTranslators = {};
  async function getNativeTranslator(sl, tl) {
    const key = sl + tl;
    if (key in nativeTranslators) return nativeTranslators[key];
    nativeTranslators[key] = null;
    try {
      if ("Translator" in self) {
        const avail = await Translator.availability({ sourceLanguage: sl, targetLanguage: tl });
        if (avail === "available") {
          nativeTranslators[key] = await Translator.create({ sourceLanguage: sl, targetLanguage: tl });
        } else if (avail !== "unavailable") {
          // El modelo aún se descarga: no bloquear la frase actual,
          // los proveedores en línea traducen mientras tanto
          Translator.create({ sourceLanguage: sl, targetLanguage: tl })
            .then(t => { nativeTranslators[key] = t; })
            .catch(() => {});
        }
      }
    } catch { nativeTranslators[key] = null; }
    return nativeTranslators[key];
  }

  async function translate(text, sl, tl) {
    // 1) Traductor nativo del navegador
    try {
      const t = await getNativeTranslator(sl, tl);
      if (t) {
        const out = await t.translate(text);
        if (out && out.trim()) return out.trim();
      }
    } catch { /* siguiente proveedor */ }

    // 2) Google Translate (endpoint público)
    try {
      const url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t"
        + "&sl=" + sl + "&tl=" + tl + "&q=" + encodeURIComponent(text);
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        const out = (j[0] || []).map(seg => seg[0]).join("");
        if (out && out.trim()) return out.trim();
      }
    } catch { /* siguiente proveedor */ }

    // 3) MyMemory
    const r2 = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text)
      + "&langpair=" + sl + "|" + tl);
    const j2 = await r2.json();
    const out2 = j2 && j2.responseData && j2.responseData.translatedText;
    if (out2 && out2.trim()) return out2.trim();
    throw new Error("Sin traductor disponible");
  }

  /* ================================================================
     Texto → voz. Mientras la app habla se pausa el micrófono para
     que no se transcriba a sí misma.
     ================================================================ */
  let ttsActive = false;
  const ttsQueue = [];
  function pickVoice(lang) {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.lang === REC_LANGS[lang])
        || voices.find(v => v.lang && v.lang.startsWith(lang))
        || null;
  }
  function speakText(text, lang) {
    if (!("speechSynthesis" in window)) return;
    ttsQueue.push({ text, lang });
    pumpTts();
  }
  function clearTts() {
    ttsQueue.length = 0;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  function pumpTts() {
    if (ttsActive || !ttsQueue.length) return;
    const { text, lang } = ttsQueue.shift();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = REC_LANGS[lang];
    const v = pickVoice(lang);
    if (v) u.voice = v;
    u.rate = 1;
    ttsActive = true;
    stopRec();
    renderStatus();
    let settled = false;
    const t0 = Date.now();
    const done = () => {
      if (settled) return;
      settled = true;
      clearInterval(watchdog);
      ttsActive = false;
      if (!ttsQueue.length && state.listening) startRec();
      renderStatus();
      pumpTts();
    };
    u.onend = done;
    u.onerror = done;
    // Vigilante: si el navegador no tiene voces (o la síntesis nunca
    // arranca), onend jamás llega y el micrófono quedaría muerto
    const watchdog = setInterval(() => {
      const elapsed = Date.now() - t0;
      if (elapsed > 60000) return done();
      if (elapsed > 1500 && !speechSynthesis.speaking && !speechSynthesis.pending) done();
    }, 400);
    speechSynthesis.speak(u);
  }

  /* ================================================================
     Micrófono: permiso explícito + medidor de nivel en vivo.
     Pedir getUserMedia antes de reconocer hace visible el bloqueo
     (permiso denegado, vista embebida, sin micrófono) en lugar de
     fallar en silencio, y el medidor muestra si el mic te oye.
     ================================================================ */
  let micStream = null, audioCtx = null, meterTimer = null;

  function startMeter() {
    stopMeter(false);
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(micStream);
      const an = audioCtx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      meterTimer = setInterval(() => {
        an.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) { const d = Math.abs(v - 128); if (d > peak) peak = d; }
        const bar = document.getElementById("meterBar");
        if (bar) bar.style.width = Math.min(100, Math.round((peak / 50) * 100)) + "%";
      }, 120);
    } catch { /* sin medidor, no es crítico */ }
  }
  function stopMeter(releaseStream = true) {
    clearInterval(meterTimer);
    meterTimer = null;
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    if (releaseStream && micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
  }

  /* ================================================================
     Reconocimiento de voz
     ================================================================ */
  let rec = null, restartTimer = null;

  async function startListening() {
    if (!SR || !meeting()) return;
    state.micError = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        state.listening = false;
        state.micError = (e && (e.name === "NotAllowedError" || e.name === "SecurityError"))
          ? "denied" : "nomic";
        renderControls();
        return;
      }
      startMeter();
    }
    state.listening = true;
    startRec();
    renderControls();
  }
  function stopListening() {
    state.listening = false;
    stopRec();
    stopMeter();
    state.interim = "";
    renderControls();
    renderTranscript();
  }
  function stopRec() {
    clearTimeout(restartTimer);
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      try { rec.abort(); } catch { /* ya detenido */ }
      rec = null;
    }
  }
  function startRec() {
    stopRec();
    if (!SR || ttsActive) return;
    rec = new SR();
    rec.lang = REC_LANGS[state.turn];
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) handlePhrase(res[0].transcript);
        else interim += res[0].transcript;
      }
      state.interim = interim;
      renderTranscript();
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        state.listening = false;
        state.micError = "denied";
        stopMeter();
        renderControls();
      } else if (e.error === "audio-capture") {
        state.listening = false;
        state.micError = "nomic";
        stopMeter();
        renderControls();
      } else if (e.error === "network") {
        state.micError = "network"; // se sigue reintentando vía onend
        renderControls();
      }
      // "no-speech" y "aborted" se resuelven con el reinicio de onend
    };
    // Chrome corta la escucha tras unos segundos de silencio: se reinicia sola
    rec.onend = () => {
      if (state.listening && !ttsActive) restartTimer = setTimeout(startRec, 250);
    };
    try { rec.start(); } catch { /* start doble: ignorar */ }
  }

  function setTurn(lang, opts = {}) {
    if (state.turn === lang) return;
    state.turn = lang;
    if (state.listening && !opts.skipRestart) startRec();
    renderControls();
  }

  /* ---------------- Frase confirmada ----------------
     La frase entra a la conversación de inmediato, en el orden en que
     se dijo; la detección de idioma y la traducción (asíncronas) llegan
     después sin poder reordenar los mensajes. */
  function handlePhrase(text) {
    text = text.trim();
    const m = meeting();
    if (!text || !m) return;
    const msg = { id: uid(), lang: state.turn, original: text, traduccion: null, error: false, hora: hhmm() };
    m.mensajes.push(msg);
    save();
    renderTranscript();
    processPhrase(msg);
  }

  async function processPhrase(msg) {
    if (state.auto) {
      const detected = await detectLang(msg.original);
      if (detected && detected !== msg.lang) {
        msg.lang = detected;
        setTurn(detected); // el micrófono queda esperando ese idioma
        renderTranscript();
      }
    }
    const target = msg.lang === "es" ? "en" : "es";
    try {
      msg.traduccion = await translate(msg.original, msg.lang, target);
    } catch {
      msg.error = true;
    }
    save();
    renderTranscript();
    if (state.speak && msg.traduccion) speakText(msg.traduccion, target);
  }

  async function retranslate(msg, asLang) {
    msg.lang = asLang;
    msg.traduccion = null;
    msg.error = false;
    renderTranscript();
    try {
      msg.traduccion = await translate(msg.original, asLang, asLang === "es" ? "en" : "es");
    } catch {
      msg.error = true;
    }
    save();
    renderTranscript();
  }

  /* ================================================================
     Exportación
     ================================================================ */
  function exportMeeting(m) {
    const lines = [];
    lines.push("TRADUCTOR INSIDE — Transcripción de reunión");
    lines.push("Reunión: " + m.titulo);
    if (m.cliente) lines.push("Cliente: " + m.cliente);
    lines.push("Fecha: " + m.fecha);
    if (m.link) lines.push("Videollamada: " + m.link);
    lines.push("".padEnd(56, "-"));
    for (const msg of m.mensajes) {
      const who = msg.lang === "es" ? "Yo (ES)" : "Cliente (EN)";
      const dir = msg.lang === "es" ? "EN" : "ES";
      lines.push(`[${msg.hora}] ${who}: ${msg.original}`);
      lines.push(`        → ${dir}: ${msg.traduccion || "(sin traducción)"}`);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ("reunion-" + (m.cliente || m.titulo) + "-" + m.fecha)
      .toLowerCase().replace(/[^a-z0-9áéíóúñ-]+/gi, "-") + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ================================================================
     Render
     ================================================================ */
  const content = $("#content");

  function render() {
    document.querySelectorAll(".sidebar .nav-item[data-view]").forEach(b =>
      b.classList.toggle("active", b.dataset.view === state.view));
    if (state.view === "live") renderLive();
    else renderMeetings();
  }

  /* ---------- Vista: Reunión en vivo ---------- */
  function renderLive() {
    const m = meeting();
    $("#pageTitle").textContent = m ? m.titulo : "Reunión en vivo";
    $("#pageSub").textContent = m
      ? (m.cliente ? "Cliente: " + m.cliente + " · " : "") + m.fecha
      : "Habla en español o inglés y mira la traducción al instante";

    if (!m) {
      const recientes = [...state.meetings].sort((a, b) => b.creado - a.creado).slice(0, 3);
      content.innerHTML = `
        <div class="empty-state card">
          <div class="big">🎙️</div>
          <h3>No hay una reunión abierta</h3>
          <p>Crea una reunión para empezar a traducir la conversación en vivo.</p>
          <button class="btn primary" id="emptyNueva">＋ Nueva reunión</button>
          ${recientes.length ? `
          <div class="recent">
            <div class="recent-label">o retoma una reciente</div>
            ${recientes.map(r => `<button class="btn sm" data-reopen="${r.id}">↩ ${esc(r.titulo)}${r.cliente ? " · " + esc(r.cliente) : ""}</button>`).join(" ")}
          </div>` : ""}
        </div>`;
      $("#emptyNueva").onclick = openNewMeetingModal;
      content.querySelectorAll("[data-reopen]").forEach(b => b.onclick = () => {
        state.currentId = b.dataset.reopen;
        save();
        render();
      });
      return;
    }

    content.innerHTML = `
      ${compatBanners()}
      <div id="micBanner"></div>
      <div class="callbar card">
        <div class="callbar-main">
          ${m.link
            ? `<a class="btn primary" href="${esc(m.link)}" target="_blank" rel="noopener">🎥 Abrir videollamada</a>
               <button class="btn sm" id="btnEditLink" title="Cambiar el link">✏️ cambiar</button>`
            : `<button class="btn" id="btnEditLink">🎥 Agregar link de la videollamada</button>`}
        </div>
        <details class="help">
          <summary>¿Cómo usarla con Meet, Teams o Zoom?</summary>
          <ol>
            <li>Únete a la videollamada como siempre, en su propia pestaña o app. <strong>Esta herramienta no entra a la llamada</strong>: la acompaña desde aquí, escuchando por el micrófono de tu computadora.</li>
            <li>Para captar la voz de tu cliente, escucha la llamada por <strong>parlantes (sin audífonos)</strong> y activa <strong>🌎 Cliente · English</strong>: el micrófono oye lo que sale por los parlantes y lo traduce.</li>
            <li>Cuando hables tú, activa <strong>🧑‍💼 Yo · Español</strong> (o deja la detección automática y usa <kbd>Espacio</kbd> para cambiar de turno).</li>
            <li>Para que tu cliente vea la conversación en inglés, comparte <strong>esta pestaña</strong> en la llamada y usa la vista <strong>👁️ Cliente (EN)</strong> de arriba a la derecha.</li>
          </ol>
        </details>
      </div>
      <div class="card">
        <div class="controls">
          <div class="mic-group">
            <button class="mic-btn es" id="micEs"><span><span class="dot"></span>🧑‍💼 Yo · Español</span><small>habla y ella lo ve en inglés</small></button>
            <button class="mic-btn en" id="micEn"><span><span class="dot"></span>🌎 Cliente · English</span><small>habla y tú lo ves en español</small></button>
          </div>
          <div class="spacer" style="flex:1"></div>
          <span class="status-pill" id="statusPill"></span>
        </div>
        <div class="switches">
          <label class="switch"><input type="checkbox" id="swAuto" ${state.auto ? "checked" : ""}/><span class="track"></span> Detección automática de idioma</label>
          <label class="switch"><input type="checkbox" id="swSpeak" ${state.speak ? "checked" : ""}/><span class="track"></span> 🔊 Leer traducciones en voz alta</label>
          <span class="hint"><kbd>Espacio</kbd> cambia de turno · <kbd>M</kbd> enciende/apaga el micrófono</span>
        </div>
      </div>

      <div class="transcript ${state.clientView ? "client-mode" : ""}" id="transcript"></div>

      <div class="meet-foot">
        <button class="btn" id="btnExport">⬇️ Exportar transcripción</button>
        <button class="btn" id="btnFinish">✅ Terminar reunión</button>
      </div>`;

    $("#micEs").onclick = () => toggleMic("es");
    $("#micEn").onclick = () => toggleMic("en");
    $("#swAuto").onchange = e => { state.auto = e.target.checked; };
    $("#swSpeak").onchange = e => {
      state.speak = e.target.checked;
      if (!state.speak) clearTts();
    };
    $("#btnEditLink").onclick = () => {
      const link = prompt("Pega el link de la videollamada (Meet, Teams o Zoom):", m.link || "");
      if (link === null) return;
      m.link = link.trim();
      save();
      renderLive();
    };
    $("#btnExport").onclick = () => exportMeeting(m);
    $("#btnFinish").onclick = () => {
      stopListening();
      state.currentId = null;
      save();
      state.view = "meetings";
      render();
    };

    renderControls();
    renderTranscript();
  }

  function compatBanners() {
    let html = "";
    if (!SR) {
      html += `<div class="banner danger"><strong>Este navegador no tiene reconocimiento de voz.</strong>
        Abre la app en <strong>Chrome</strong> o <strong>Edge</strong> para poder usar el micrófono.</div>`;
    } else if (!window.isSecureContext) {
      html += `<div class="banner warn"><strong>El micrófono necesita una conexión segura.</strong>
        Abre la app desde <code>localhost</code> o un sitio <code>https://</code> (con doble clic al archivo no funciona el micrófono).</div>`;
    }
    return html;
  }

  function toggleMic(lang) {
    if (state.listening && state.turn === lang) { stopListening(); return; }
    state.turn = lang;
    if (state.listening) startRec(); else startListening();
    renderControls();
  }

  function renderControls() {
    const es = $("#micEs"), en = $("#micEn");
    if (!es) return;
    es.classList.toggle("on", state.listening && state.turn === "es");
    en.classList.toggle("on", state.listening && state.turn === "en");
    renderMicBanner();
    renderStatus();
  }

  function renderMicBanner() {
    const box = $("#micBanner");
    if (!box) return;
    const embedded = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (state.micError === "denied" && embedded) {
      box.innerHTML = `<div class="banner danger"><strong>El micrófono está bloqueado en esta vista embebida.</strong>
        Abre la app en su propia pestaña del navegador (botón "abrir en pestaña nueva" o copia el link a la barra de dirección) y vuelve a intentar.</div>`;
    } else if (state.micError === "denied") {
      box.innerHTML = `<div class="banner danger"><strong>El navegador no dio permiso de micrófono.</strong>
        Haz clic en el candado 🔒 (o el ícono de micrófono) junto a la dirección, elige <em>Permitir micrófono</em>, recarga y vuelve a intentar.</div>`;
    } else if (state.micError === "nomic") {
      box.innerHTML = `<div class="banner danger"><strong>No se encontró un micrófono disponible.</strong>
        Revisa que esté conectado, que no esté silenciado y que ninguna otra app lo tenga tomado en exclusiva.</div>`;
    } else if (state.micError === "network") {
      box.innerHTML = `<div class="banner warn"><strong>El reconocimiento de voz perdió la conexión.</strong>
        Se está reintentando solo; revisa tu internet si persiste.</div>`;
    } else {
      box.innerHTML = "";
    }
  }

  function renderStatus() {
    const pill = $("#statusPill");
    if (!pill) return;
    pill.className = "status-pill";
    if (state.micError === "denied") {
      pill.classList.add("err");
      pill.textContent = "🚫 Micrófono bloqueado";
    } else if (state.micError === "nomic") {
      pill.classList.add("err");
      pill.textContent = "🚫 Sin micrófono";
    } else if (ttsActive) {
      pill.classList.add("tts");
      pill.textContent = "🔊 Leyendo traducción…";
    } else if (state.listening) {
      pill.classList.add("live");
      pill.innerHTML = (state.turn === "es" ? "🎙️ Escuchando en español…" : "🎙️ Listening in English…")
        + ' <span class="meter" title="Nivel del micrófono: si no se mueve cuando hablas, el mic no te oye"><i id="meterBar"></i></span>';
    } else {
      pill.textContent = "Micrófono apagado";
    }
  }

  function renderTranscript() {
    const box = $("#transcript");
    const m = meeting();
    if (!box || !m) return;

    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 160;

    if (!m.mensajes.length && !state.interim) {
      box.innerHTML = `<div class="transcript-empty card">
        <div class="big">💬</div>
        Activa un micrófono y empieza a hablar.<br/>
        Cada frase aparecerá aquí con su traducción.
      </div>`;
      return;
    }

    let html = m.mensajes.map(msg => {
      const who = msg.lang === "es" ? "🧑‍💼 Yo · ES" : "🌎 Cliente · EN";
      const other = msg.lang === "es" ? "en" : "es";
      let trad;
      if (msg.error) trad = `<div class="trad error">⚠️ No se pudo traducir (¿sin internet?). <button class="btn sm" data-retry="${msg.id}">Reintentar</button></div>`;
      else if (msg.traduccion === null) trad = `<div class="trad pending">Traduciendo…</div>`;
      else trad = `<div class="trad">${esc(msg.traduccion)}</div>`;
      return `
        <div class="msg ${msg.lang}">
          <div class="bubble">
            <div class="who">${who} <span class="hora">${msg.hora}</span></div>
            <div class="orig">${esc(msg.original)}</div>
            ${trad}
            <div class="acts">
              ${msg.traduccion ? `<button data-speak="${msg.id}" title="Leer en voz alta">🔊 Voz</button>` : ""}
              <button data-swap="${msg.id}" title="La app se equivocó de idioma: tratar como ${other.toUpperCase()}">↔ Era ${other.toUpperCase()}</button>
              <button data-del="${msg.id}" title="Eliminar">🗑</button>
            </div>
          </div>
        </div>`;
    }).join("");

    if (state.interim) {
      const who = state.turn === "es" ? "🧑‍💼 Yo · ES" : "🌎 Cliente · EN";
      html += `<div class="msg interim ${state.turn}"><div class="bubble">
        <div class="who">${who}</div><div class="orig">${esc(state.interim)}…</div>
      </div></div>`;
    }

    box.innerHTML = html;

    box.querySelectorAll("[data-speak]").forEach(b => b.onclick = () => {
      const msg = m.mensajes.find(x => x.id === b.dataset.speak);
      if (msg && msg.traduccion) speakText(msg.traduccion, msg.lang === "es" ? "en" : "es");
    });
    box.querySelectorAll("[data-swap]").forEach(b => b.onclick = () => {
      const msg = m.mensajes.find(x => x.id === b.dataset.swap);
      if (msg) retranslate(msg, msg.lang === "es" ? "en" : "es");
    });
    box.querySelectorAll("[data-retry]").forEach(b => b.onclick = () => {
      const msg = m.mensajes.find(x => x.id === b.dataset.retry);
      if (msg) retranslate(msg, msg.lang);
    });
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      m.mensajes = m.mensajes.filter(x => x.id !== b.dataset.del);
      save();
      renderTranscript();
    });

    if (nearBottom) window.scrollTo({ top: document.body.scrollHeight });
  }

  /* ---------- Vista: Reuniones guardadas ---------- */
  function renderMeetings() {
    $("#pageTitle").textContent = "Reuniones guardadas";
    $("#pageSub").textContent = state.meetings.length
      ? state.meetings.length + " reunión(es) en este navegador"
      : "Aquí quedará el historial de tus reuniones";

    if (!state.meetings.length) {
      content.innerHTML = `
        <div class="empty-state card">
          <div class="big">📚</div>
          <h3>Todavía no hay reuniones</h3>
          <p>Cuando crees una reunión, quedará guardada aquí con su transcripción bilingüe.</p>
          <button class="btn primary" id="emptyNueva">＋ Nueva reunión</button>
        </div>`;
      $("#emptyNueva").onclick = openNewMeetingModal;
      return;
    }

    const list = [...state.meetings].sort((a, b) => b.creado - a.creado);
    content.innerHTML = `<div class="meet-list">` + list.map(m => `
      <div class="card meet-card">
        <h3>${esc(m.titulo)}</h3>
        <div class="meta">${m.cliente ? "Cliente: " + esc(m.cliente) + " · " : ""}${m.fecha} · ${m.mensajes.length} mensaje(s)</div>
        <div class="acts">
          <button class="btn sm primary" data-open="${m.id}">Abrir</button>
          <button class="btn sm" data-exp="${m.id}">⬇️ Exportar</button>
          <button class="btn sm danger" data-del="${m.id}">Eliminar</button>
        </div>
      </div>`).join("") + `</div>`;

    content.querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
      state.currentId = b.dataset.open;
      save();
      state.view = "live";
      render();
    });
    content.querySelectorAll("[data-exp]").forEach(b => b.onclick = () => {
      const m = state.meetings.find(x => x.id === b.dataset.exp);
      if (m) exportMeeting(m);
    });
    content.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      const m = state.meetings.find(x => x.id === b.dataset.del);
      if (m && confirm(`¿Eliminar la reunión "${m.titulo}"? Esta acción no se puede deshacer.`)) {
        state.meetings = state.meetings.filter(x => x.id !== b.dataset.del);
        if (state.currentId === b.dataset.del) state.currentId = null;
        save();
        render();
      }
    });
  }

  /* ---------- Modal: nueva reunión ---------- */
  const overlay = $("#overlay");
  function openNewMeetingModal() {
    const hoy = new Date();
    const fecha = hoy.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
    $("#modalTitle").textContent = "Nueva reunión";
    $("#modalBody").innerHTML = `
      <div class="field"><label>Cliente</label><input id="fCliente" type="text" placeholder="Ej. Payless" /></div>
      <div class="field"><label>Título de la reunión</label><input id="fTitulo" type="text" value="Reunión ${fecha}" /></div>
      <div class="field"><label>Link de la videollamada (opcional)</label><input id="fLink" type="url" placeholder="https://meet.google.com/…" /></div>`;
    $("#modalFooter").innerHTML = `
      <button class="btn" id="mCancel">Cancelar</button>
      <button class="btn primary" id="mCreate">Crear y empezar</button>`;
    overlay.classList.add("open");
    $("#fCliente").focus();
    $("#mCancel").onclick = closeModal;
    $("#mCreate").onclick = () => {
      const m = {
        id: uid(),
        titulo: $("#fTitulo").value.trim() || "Reunión " + fecha,
        cliente: $("#fCliente").value.trim(),
        link: $("#fLink").value.trim(),
        fecha,
        creado: Date.now(),
        mensajes: [],
      };
      state.meetings.push(m);
      state.currentId = m.id;
      save();
      closeModal();
      state.view = "live";
      render();
    };
  }
  function closeModal() { overlay.classList.remove("open"); }
  $("#modalClose").onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };

  /* ---------- Navegación y atajos ---------- */
  document.querySelectorAll(".sidebar .nav-item[data-view]").forEach(b => {
    b.onclick = () => { state.view = b.dataset.view; render(); };
  });
  $("#btnNueva").onclick = openNewMeetingModal;

  $("#viewPill").querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      state.clientView = b.dataset.mode === "cliente";
      $("#viewPill").querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      const t = $("#transcript");
      if (t) t.classList.toggle("client-mode", state.clientView);
    };
  });

  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea, select") || overlay.classList.contains("open")) return;
    if (state.view !== "live" || !meeting()) return;
    if (e.code === "Space") {
      e.preventDefault();
      setTurn(state.turn === "es" ? "en" : "es");
    } else if (e.key.toLowerCase() === "m") {
      e.preventDefault();
      state.listening ? stopListening() : startListening();
    }
  });

  // Cargar voces de speechSynthesis (Chrome las entrega de forma asíncrona)
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  render();
})();
