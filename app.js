/* ============================================================
   ShopAutoVideo – app.js
   ============================================================ */

(function() {
  'use strict';

  const SHOP_URL = 'https://fortnite-api.com/v2/shop/br/combined';
  const SCRIPT_ENDPOINT = '/api/script';
  const TTS_ENDPOINT = '/api/tts';
  const STORAGE_KEY = 'shopAutoVideoSettings';
  const SHOP_CACHE_KEY = 'shopAutoVideoShopCache';

  const RARITY_SCORES = {
    common: 0.2, uncommon: 0.3, rare: 0.45, epic: 0.6, legendary: 0.8,
    mythic: 1.0, exotic: 0.9, marvel: 0.85, dc: 0.85, icon: 0.75,
    gaming: 0.8, dark: 0.7, frozen: 0.7, lava: 0.7, slurp: 0.65,
    shadow: 0.7, starwars: 0.85
  };

  let settings = loadSettings();
  let shopData = null;
  let currentScript = null;
  let currentVideoBlob = null;
  let currentThumbnailBlob = null;
  let isTestMode = false;
  let wakeLock = null;

  const $ = (id) => document.getElementById(id);
  const els = {
    creatorCode: $('creatorCode'),
    creatorName: $('creatorName'),
    targetDuration: $('targetDuration'),
    voiceSelect: $('voiceSelect'),
    videoFormat: $('videoFormat'),
    themeSelect: $('themeSelect'),
    thresholdTop: $('thresholdTop'),
    thresholdGreat: $('thresholdGreat'),
    weightItems: $('weightItems'),
    weightRarity: $('weightRarity'),
    weightCollab: $('weightCollab'),
    weightDiscount: $('weightDiscount'),
    introText: $('introText'),
    outroText: $('outroText'),
    upcomingSkins: $('upcomingSkins'),
    upcomingSourceUrl: $('upcomingSourceUrl'),
    logoFile: $('logoFile'),
    musicFile: $('musicFile'),
    saveSettingsBtn: $('saveSettingsBtn'),
    testModeBtn: $('testModeBtn'),
    generateBtn: $('generateBtn'),
    progressContainer: $('progressContainer'),
    progressFill: $('progressFill'),
    progressText: $('progressText'),
    logPanel: $('logPanel'),
    logContent: $('logContent'),
    previewSection: $('previewSection'),
    previewVideo: $('previewVideo'),
    downloadVideoLink: $('downloadVideoLink'),
    downloadThumbBtn: $('downloadThumbBtn'),
    copySection: $('copySection'),
    outputTitle: $('outputTitle'),
    outputDescription: $('outputDescription'),
    outputTags: $('outputTags'),
    copyTitleBtn: $('copyTitleBtn'),
    copyDescBtn: $('copyDescBtn'),
    copyTagsBtn: $('copyTagsBtn'),
    testOutput: $('testOutput'),
    testContent: $('testContent'),
    footerCreator: $('footerCreator'),
    footerCode: $('footerCode')
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {
      creatorCode: 'malofn',
      creatorName: '22Malo_',
      targetDuration: 60,
      voice: 'Zephyr',
      videoFormat: '1920x1080',
      theme: 'default',
      thresholdTop: 9,
      thresholdGreat: 7,
      weightItems: 0.3,
      weightRarity: 0.25,
      weightCollab: 0.2,
      weightDiscount: 0.25,
      introText: 'Ciao ragazzi, benvenuti al Valore dello Shop!',
      outroText: 'Grazie per aver guardato, iscriviti e usa il codice creator!',
      upcomingSkins: '',
      upcomingSourceUrl: '',
      logoDataUrl: null,
      musicDataUrl: null
    };
  }

  function saveSettingsToStorage() {
    settings.creatorCode = els.creatorCode.value.trim();
    settings.creatorName = els.creatorName.value.trim();
    settings.targetDuration = parseInt(els.targetDuration.value, 10) || 60;
    settings.voice = els.voiceSelect.value;
    settings.videoFormat = els.videoFormat.value;
    settings.theme = els.themeSelect.value;
    settings.thresholdTop = parseFloat(els.thresholdTop.value) || 9;
    settings.thresholdGreat = parseFloat(els.thresholdGreat.value) || 7;
    settings.weightItems = parseFloat(els.weightItems.value) || 0.3;
    settings.weightRarity = parseFloat(els.weightRarity.value) || 0.25;
    settings.weightCollab = parseFloat(els.weightCollab.value) || 0.2;
    settings.weightDiscount = parseFloat(els.weightDiscount.value) || 0.25;
    settings.introText = els.introText.value.trim();
    settings.outroText = els.outroText.value.trim();
    settings.upcomingSkins = els.upcomingSkins.value.trim();
    settings.upcomingSourceUrl = els.upcomingSourceUrl.value.trim();

    if (els.logoFile.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        settings.logoDataUrl = e.target.result;
        persistSettings();
      };
      reader.readAsDataURL(els.logoFile.files[0]);
    } else {
      persistSettings();
    }

    if (els.musicFile.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        settings.musicDataUrl = e.target.result;
        persistSettings();
      };
      reader.readAsDataURL(els.musicFile.files[0]);
    } else {
      persistSettings();
    }

    applyTheme(settings.theme);
    updateFooter();
    log('Impostazioni salvate.');
  }

  function persistSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      log('Errore salvataggio impostazioni: ' + e.message);
    }
  }

  function applyTheme(theme) {
    document.body.classList.remove('theme-green', 'theme-red');
    if (theme === 'green') document.body.classList.add('theme-green');
    if (theme === 'red') document.body.classList.add('theme-red');
  }

  function updateFooter() {
    els.footerCreator.textContent = settings.creatorName || '22Malo_';
    els.footerCode.textContent = settings.creatorCode || 'malofn';
  }

  function log(msg) {
    els.logPanel.classList.remove('hidden');
    const time = new Date().toLocaleTimeString('it-IT');
    els.logContent.textContent += '[' + time + '] ' + msg + '\n';
    els.logContent.scrollTop = els.logContent.scrollHeight;
  }

  function setProgress(pct, text) {
    els.progressContainer.classList.remove('hidden');
    els.progressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (text) els.progressText.textContent = text;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function retry(fn, attempts = 3, delayMs = 1000, label = 'operazione') {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        log('Tentativo ' + i + '/' + attempts + ' fallito per ' + label + ': ' + e.message);
        if (i < attempts) await sleep(delayMs * i);
      }
    }
    throw lastErr;
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        log('Wake Lock attivo.');
      } else {
        log('Wake Lock non supportato.');
      }
    } catch (e) {
      log('Wake Lock non disponibile: ' + e.message);
    }
  }
  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release(); wakeLock = null; }
  }

  async function fetchShop() {
    const cached = localStorage.getItem(SHOP_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date && isToday(parsed.date)) {
          log('Shop caricato dalla cache locale (stesso giorno).');
          return parsed.data;
        }
      } catch (e) { /* ignore */ }
    }
    const data = await retry(async () => {
      const res = await fetch(SHOP_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (json.status !== 200 || !json.data) throw new Error('Risposta shop non valida');
      return json.data;
    }, 3, 1500, 'shop');

    if (cached) {
      try {
        const prev = JSON.parse(cached);
        if (prev.date !== data.date && prev.hash === data.hash) {
          log('⚠️ Lo shop sembra identico a quello precedente.');
        }
      } catch (e) { /* ignore */ }
    }
    localStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({ date: data.date, hash: data.hash, data: data }));
    return data;
  }

  function isToday(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }

  function calculateScore(entry) {
    const items = entry.items || [];
    const itemCount = items.length;
    const price = entry.finalPrice || 0;
    const regularPrice = entry.regularPrice || price;

    let itemsScore = 0;
    if (itemCount > 0 && price > 0) {
      const perItem = price / itemCount;
      itemsScore = Math.min(1, Math.max(0, (2000 - perItem) / 2000));
    } else if (itemCount === 0) {
      itemsScore = 0.1;
    }

    let raritySum = 0, rarityCount = 0;
    items.forEach(it => {
      const r = (it.rarity && it.rarity.value) || 'common';
      raritySum += RARITY_SCORES[r] !== undefined ? RARITY_SCORES[r] : 0.3;
      rarityCount++;
    });
    const rarityScore = rarityCount > 0 ? raritySum / rarityCount : 0.2;

    let collabScore = 0;
    items.forEach(it => {
      if (it.series && it.series.value) collabScore = 1;
    });

    let discountScore = 0;
    if (regularPrice > price && regularPrice > 0) {
      discountScore = Math.min(1, (regularPrice - price) / regularPrice * 2);
    }

    let bundleBonus = 0;
    if (entry.bundle) {
      const sumSingles = items.reduce((acc, it) => acc + (it.price || 0), 0);
      if (sumSingles > price && sumSingles > 0) {
        bundleBonus = Math.min(0.5, (sumSingles - price) / sumSingles);
      }
    }

    const w = settings;
    const totalWeight = w.weightItems + w.weightRarity + w.weightCollab + w.weightDiscount;
    let raw = (
      itemsScore * w.weightItems +
      rarityScore * w.weightRarity +
      collabScore * w.weightCollab +
      discountScore * w.weightDiscount
    ) / (totalWeight || 1);

    raw = Math.min(1, raw + bundleBonus);
    return Math.round(raw * 100) / 10;
  }

  function getJudgment(score) {
    const tTop = settings.thresholdTop;
    const tGreat = settings.thresholdGreat;
    if (score >= tTop) return { text: 'COMPRALO SUBITO', color: '#4caf50' };
    if (score >= tGreat) return { text: 'OTTIMO ACQUISTO', color: '#8bc34a' };
    if (score >= 5) return { text: 'SE TI PIACE, PRENDILO', color: '#ffc107' };
    if (score >= 3) return { text: 'ASPETTA UNO SCONTO', color: '#ff9800' };
    return { text: 'SALVA I TUOI V-BUCKS', color: '#f44336' };
  }

  function rankEntries(shop) {
    const all = [];
    const featured = shop.featured && shop.featured.entries ? shop.featured.entries : [];
    const daily = shop.daily && shop.daily.entries ? shop.daily.entries : [];
    [...featured, ...daily].forEach(entry => {
      if (!entry.items || entry.items.length === 0) return;
      const score = calculateScore(entry);
      const judgment = getJudgment(score);
      all.push({ entry, score, judgment });
    });
    all.sort((a, b) => b.score - a.score);
    return all;
  }

  async function fetchUpcomingSkins() {
    let list = [];
    const text = settings.upcomingSkins;
    if (text) {
      text.split('\n').forEach(line => {
        const parts = line.split('|').map(s => s.trim());
        if (parts[0]) list.push({ name: parts[0], date: parts[1] || null });
      });
    }
    if (settings.upcomingSourceUrl) {
      try {
        const res = await fetch(settings.upcomingSourceUrl);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            json.forEach(item => {
              if (item.name) list.push({ name: item.name, date: item.date || null });
            });
          }
        }
      } catch (e) {
        log('Impossibile leggere la fonte skin in arrivo: ' + e.message);
      }
    }
    return list;
  }

  async function generateScript(ranked, upcoming) {
    const payload = {
      creatorCode: settings.creatorCode,
      creatorName: settings.creatorName,
      targetDuration: settings.targetDuration,
      introText: settings.introText,
      outroText: settings.outroText,
      items: ranked.slice(0, 5).map(r => ({
        name: r.entry.items[0] ? r.entry.items[0].name : (r.entry.bundle ? r.entry.bundle.name : 'Bundle'),
        price: r.entry.finalPrice,
        regularPrice: r.entry.regularPrice,
        score: r.score,
        judgment: r.judgment.text,
        image: r.entry.items[0] ? (r.entry.items[0].images && r.entry.items[0].images.featured) : null,
        bundle: !!r.entry.bundle,
        removalDate: r.entry.bundle ? r.entry.bundle.removalDate : null
      })),
      upcomingSkins: upcoming
    };

    const result = await retry(async () => {
      const res = await fetch(SCRIPT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    }, 3, 2000, 'script Gemini');

    if (!result || !result.segmenti) throw new Error('Risposta script non valida');
    return result;
  }

  function fallbackScript(ranked, upcoming) {
    const top = ranked[0];
    const itemName = top.entry.items[0] ? top.entry.items[0].name : 'questo bundle';
    const segments = [
      { testo: settings.introText, immagine: null, voto: null, giudizio: null },
      { testo: 'Oggi il miglior acquisto è ' + itemName + ' con un voto di ' + top.score + ' su 10. ' + top.judgment.text + '.', immagine: top.entry.items[0] ? top.entry.items[0].images.featured : null, voto: top.score, giudizio: top.judgment.text },
      { testo: 'Ricorda di usare il codice creator ' + settings.creatorCode + '.', immagine: null, voto: null, giudizio: null },
      { testo: settings.outroText, immagine: null, voto: null, giudizio: null }
    ];
    if (upcoming.length > 0) {
      segments.splice(2, 0, { testo: 'In arrivo: ' + upcoming.map(u => u.name).join(', ') + '.', immagine: null, voto: null, giudizio: null });
    }
    return {
      titolo_video: 'Valore dello Shop – ' + new Date().toLocaleDateString('it-IT'),
      descrizione_youtube: 'Il miglior acquisto di oggi: ' + itemName + '. Codice creator: ' + settings.creatorCode,
      tag: ['fortnite', 'shop', 'valore dello shop', settings.creatorName],
      segmenti: segments
    };
  }

  async function generateTTS(text) {
    try {
      const res = await fetch(TTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: settings.voice })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      if (blob.size < 100) throw new Error('Audio troppo piccolo');
      return blob;
    } catch (e) {
      log('TTS server fallito: ' + e.message + '. Uso Web Speech API.');
      return null;
    }
  }

  function speakWebSpeech(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        log('Web Speech API non supportata.');
        return resolve();
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'it-IT';
      utter.rate = 1.0;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  }

  async function renderVideo(script, ranked) {
    const format = settings.videoFormat.split('x').map(Number);
    const width = format[0];
    const height = format[1];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    let voiceBlob = null;
    if (!isTestMode) {
      const fullText = script.segmenti.map(s => s.testo).join(' ');
      voiceBlob = await generateTTS(fullText);
    }

    const videoStream = canvas.captureStream(30);
    const audioStream = dest.stream;

    let voiceSource = null;
    if (voiceBlob) {
      const arrayBuf = await voiceBlob.arrayBuffer();
      const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
      voiceSource = audioCtx.createBufferSource();
      voiceSource.buffer = audioBuf;
      voiceSource.connect(dest);
    }

    let musicSource = null;
    if (settings.musicDataUrl) {
      try {
        const resp = await fetch(settings.musicDataUrl);
        const buf = await resp.arrayBuffer();
        const musicBuf = await audioCtx.decodeAudioData(buf);
        musicSource = audioCtx.createBufferSource();
        musicSource.buffer = musicBuf;
        musicSource.loop = true;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.15;
        musicSource.connect(gain);
        gain.connect(dest);
      } catch (e) {
        log('Musica non caricata: ' + e.message);
      }
    }

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ]);

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) mimeType = 'video/mp4;codecs=h264,aac';

    const recorder = new MediaRecorder(combinedStream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const recordingPromise = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };
    });

    recorder.start(100);
    if (voiceSource) voiceSource.start();
    if (musicSource) musicSource.start();

    const segments = script.segmenti;

    const imageCache = {};
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.immagine && !imageCache[seg.immagine]) {
        imageCache[seg.immagine] = await loadImage(seg.immagine).catch(() => null);
      }
      if (ranked[i] && ranked[i].entry.items[0] && ranked[i].entry.items[0].images.featured && !imageCache[ranked[i].entry.items[0].images.featured]) {
        imageCache[ranked[i].entry.items[0].images.featured] = await loadImage(ranked[i].entry.items[0].images.featured).catch(() => null);
      }
    }

    let logoImg = null;
    if (settings.logoDataUrl) {
      logoImg = await loadImage(settings.logoDataUrl).catch(() => null);
    }

    const totalChars = segments.reduce((acc, s) => acc + s.testo.length, 0) || 1;
    const totalDurationMs = Math.max(10000, settings.targetDuration * 1000);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segDuration = Math.max(2000, (seg.testo.length / totalChars) * totalDurationMs);
      const segStart = performance.now();

      const img = seg.immagine ? imageCache[seg.immagine] : null;
      const rankItem = ranked[i];
      const fallbackImg = rankItem && rankItem.entry.items[0] ? imageCache[rankItem.entry.items[0].images.featured] : null;
      const finalImg = img || fallbackImg;

      await new Promise((resolve) => {
        function drawFrame() {
          const now = performance.now();
          const t = Math.min(1, (now - segStart) / segDuration);

          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(0, 0, width, height);

          if (finalImg) {
            const scale = 1 + 0.1 * t;
            const iw = width * 0.6 * scale;
            const ih = height * 0.5 * scale;
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.drawImage(finalImg, (width - iw) / 2, (height - ih) / 2 - 40, iw, ih);
            ctx.restore();
          }

          if (seg.voto !== null && seg.voto !== undefined) {
            const popScale = 1 + 0.3 * Math.sin(t * Math.PI * 2);
            ctx.save();
            ctx.font = 'bold ' + Math.round(height * 0.08 * popScale) + 'px system-ui';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 10;
            ctx.fillText(String(seg.voto), width / 2, height * 0.75);
            ctx.restore();
          }

          if (seg.giudizio) {
            const judgmentColor = getJudgment(seg.voto || 0).color;
            ctx.save();
            ctx.font = 'bold ' + Math.round(height * 0.035) + 'px system-ui';
            ctx.fillStyle = judgmentColor;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 8;
            ctx.fillText(seg.giudizio, width / 2, height * 0.84);
            ctx.restore();
          }

          ctx.save();
          ctx.font = Math.round(height * 0.03) + 'px system-ui';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          wrapText(ctx, seg.testo, width / 2, height * 0.94, width * 0.9, height * 0.035);
          ctx.restore();

          if (logoImg) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            const lw = width * 0.12;
            ctx.drawImage(logoImg, 20, 20, lw, lw);
            ctx.restore();
          }

          if (t < 1) {
            requestAnimationFrame(drawFrame);
          } else {
            resolve();
          }
        }
        drawFrame();
      });

      setProgress((i + 1) / segments.length * 100, 'Rendering segmento ' + (i + 1) + '/' + segments.length);
    }

    recorder.stop();
    if (voiceSource) try { voiceSource.stop(); } catch (e) {}
    if (musicSource) try { musicSource.stop(); } catch (e) {}

    const videoBlob = await recordingPromise;
    audioCtx.close();
    return videoBlob;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY -= lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function generateThumbnail(script, ranked) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    if (ranked.length > 0 && ranked[0].entry.items[0]) {
      const best = ranked[0];
      const imgUrl = best.entry.items[0].images.featured;
      try {
        const img = await loadImage(imgUrl);
        ctx.drawImage(img, 200, 100, 500, 500);
      } catch (e) { /* ignore */ }

      ctx.font = 'bold 120px system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 20;
      ctx.fillText(String(best.score), 900, 350);

      ctx.font = 'bold 48px system-ui';
      ctx.fillStyle = best.judgment.color;
      ctx.fillText(best.judgment.text, 900, 450);
    }

    ctx.font = 'bold 56px system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 12;
    ctx.fillText('VALORE DELLO SHOP', 640, 80);

    if (settings.logoDataUrl) {
      try {
        const logo = await loadImage(settings.logoDataUrl);
        ctx.drawImage(logo, 20, 20, 100, 100);
      } catch (e) { /* ignore */ }
    }

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  async function handleGenerate() {
    els.generateBtn.disabled = true;
    els.logContent.textContent = '';
    els.previewSection.classList.add('hidden');
    els.copySection.classList.add('hidden');
    els.testOutput.classList.add('hidden');
    setProgress(0, 'Avvio…');
    await requestWakeLock();

    try {
      setProgress(5, 'Scarico lo shop…');
      shopData = await fetchShop();
      log('Shop scaricato: ' + (shopData.hash ? shopData.hash.substring(0, 8) : 'ok'));

      setProgress(15, 'Calcolo punteggi…');
      const ranked = rankEntries(shopData);
      log('Trovati ' + ranked.length + ' item/bundle.');
      if (ranked.length === 0) throw new Error('Nessun item trovato nello shop.');

      const upcoming = await fetchUpcomingSkins();
      if (upcoming.length > 0) log('Skin in arrivo: ' + upcoming.map(u => u.name).join(', '));

      setProgress(25, 'Genero il parlato con Gemini…');
      let script;
      try {
        script = await generateScript(ranked, upcoming);
        log('Script generato da Gemini.');
      } catch (e) {
        log('Gemini fallito, uso script di ripiego: ' + e.message);
        script = fallbackScript(ranked, upcoming);
      }
      currentScript = script;

      els.outputTitle.value = script.titolo_video || '';
      els.outputDescription.value = script.descrizione_youtube || '';
      els.outputTags.value = (script.tag || []).join(', ');
      els.copySection.classList.remove('hidden');

      if (isTestMode) {
        els.testOutput.classList.remove('hidden');
        els.testContent.textContent = JSON.stringify({
          punteggi: ranked.slice(0, 5).map(r => ({ nome: r.entry.items[0] ? r.entry.items[0].name : 'Bundle', voto: r.score, giudizio: r.judgment.text })),
          script: script
        }, null, 2);
        setProgress(100, 'Test completato.');
        log('Modalità test: nessun video generato.');
        releaseWakeLock();
        els.generateBtn.disabled = false;
        return;
      }

      setProgress(40, 'Genero la voce e monto il video…');
      const videoBlob = await renderVideo(script, ranked);
      currentVideoBlob = videoBlob;

      setProgress(90, 'Genero la miniatura…');
      currentThumbnailBlob = await generateThumbnail(script, ranked);

      const videoUrl = URL.createObjectURL(videoBlob);
      els.previewVideo.src = videoUrl;
      els.downloadVideoLink.href = videoUrl;
      els.downloadVideoLink.download = 'valore-shop.' + (videoBlob.type.includes('mp4') ? 'mp4' : 'webm');
      els.previewSection.classList.remove('hidden');

      setProgress(100, 'Completato!');
      log('Video pronto (' + (videoBlob.size / 1024 / 1024).toFixed(1) + ' MB).');
    } catch (err) {
      log('ERRORE: ' + err.message);
      alert('Errore: ' + err.message);
    } finally {
      releaseWakeLock();
      els.generateBtn.disabled = false;
    }
  }

  function downloadThumbnail() {
    if (!currentThumbnailBlob) return;
    const url = URL.createObjectURL(currentThumbnailBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'miniatura.png';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      log(label + ' copiato negli appunti.');
    }).catch(err => {
      log('Impossibile copiare: ' + err.message);
    });
  }

  function init() {
    els.creatorCode.value = settings.creatorCode;
    els.creatorName.value = settings.creatorName;
    els.targetDuration.value = settings.targetDuration;
    els.voiceSelect.value = settings.voice;
    els.videoFormat.value = settings.videoFormat;
    els.themeSelect.value = settings.theme;
    els.thresholdTop.value = settings.thresholdTop;
    els.thresholdGreat.value = settings.thresholdGreat;
    els.weightItems.value = settings.weightItems;
    els.weightRarity.value = settings.weightRarity;
    els.weightCollab.value = settings.weightCollab;
    els.weightDiscount.value = settings.weightDiscount;
    els.introText.value = settings.introText;
    els.outroText.value = settings.outroText;
    els.upcomingSkins.value = settings.upcomingSkins;
    els.upcomingSourceUrl.value = settings.upcomingSourceUrl || '';

    applyTheme(settings.theme);
    updateFooter();

    els.saveSettingsBtn.addEventListener('click', saveSettingsToStorage);
    els.testModeBtn.addEventListener('click', () => {
      isTestMode = !isTestMode;
      els.testModeBtn.textContent = isTestMode ? '🧪 Test ON' : '🧪 Modalità Test';
      els.testModeBtn.classList.toggle('primary', isTestMode);
    });

    els.generateBtn.addEventListener('click', handleGenerate);
    els.downloadThumbBtn.addEventListener('click', downloadThumbnail);

    els.copyTitleBtn.addEventListener('click', () => copyToClipboard(els.outputTitle.value, 'Titolo'));
    els.copyDescBtn.addEventListener('click', () => copyToClipboard(els.outputDescription.value, 'Descrizione'));
    els.copyTagsBtn.addEventListener('click', () => copyToClipboard(els.outputTags.value, 'Tag'));

    els.themeSelect.addEventListener('change', () => {
      applyTheme(els.themeSelect.value);
    });

    log('App pronta. Premi "Genera video" per iniziare.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
