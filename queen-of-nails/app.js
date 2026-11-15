/* Queen of Nails — affichage TV + appli téléphone (PWA). Sans dépendance (hors qr.js). */
function boot(D, rawJSON) {
  // Adresse du site pour les QR codes : réglage « siteUrl », sinon l'adresse réseau annoncée par le serveur de la TV, sinon l'adresse courante.
  var BASE = D.siteUrl || window.QON_BASE || (location.origin + location.pathname.replace(/[^\/]*$/, ""));
  var qs = location.search;
  var isTV = window.innerWidth >= 1100 || /[?&]tv=1/.test(qs) || /Android TV|AFT|BRAVIA|SmartTV|Fully/i.test(navigator.userAgent);
  if (/[?&]phone=1/.test(qs)) isTV = false;
  var root = document.documentElement;
  root.className = isTV ? "tv" : "phone";
  try {
    if (window.navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches)) root.className += " standalone";
  } catch (e) {}

  var stage = document.getElementById("stage");
  var NAILCOLORS = [
    ["#F6D3CC", "#E7A9AE"], ["#EBC9BE", "#D18B94"], ["#F3E1CB", "#D9B48B"],
    ["#E9B8BC", "#B9637A"], ["#F8E3DE", "#E3A2A9"]
  ];
  var uid = 0;

  function nailSVG(w, h, c) {
    var id = "n" + (uid++);
    return '<svg width="' + w + 'rem" height="' + h + 'rem" viewBox="0 0 40 ' + (h / w * 40).toFixed(1) + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      '<path d="M2 ' + (h / w * 40 - 1) + ' V20 Q2 2 20 2 Q38 2 38 20 V' + (h / w * 40 - 1) + ' Z" fill="url(#' + id + ')"/>' +
      '<path d="M8 ' + (h / w * 40 - 12) + ' V20 Q8 9 17 7.6" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="3" stroke-linecap="round"/></svg>';
  }
  function nails(scale, hs) {
    var out = '<div class="nails">';
    var hh = hs || [7.4, 9.2, 10.2, 9.2, 7.4];
    for (var i = 0; i < hh.length; i++) out += nailSVG(4.2 * scale, hh[i] * scale, NAILCOLORS[i % NAILCOLORS.length]);
    return out + "</div>";
  }
  function logo(cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 120 100" aria-hidden="true"><use href="#logo-mark"/></svg>'; }
  function top() {
    return '<div class="top">' + logo() + '<div><b>' + D.brand + '</b><small>' + D.tagline + '</small></div></div>';
  }
  function money(it) {
    return '<span class="price">' + (it.from ? "<small>dès</small>" : "") + it.price + '<i>€</i></span>';
  }
  function titleHTML(t) {
    var parts = t.split(" ");
    if (parts.length < 2) return "<em>" + t + "</em>";
    var last = parts.pop();
    return parts.join(" ") + " <em>" + last + "</em>";
  }

  var slides = [], qrSVG = "", QQ = D.qr || {};
  function esc2(v, d) { return String(v || d).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  // 1. Hero
  slides.push('<section class="slide hero">' +
    '<div class="mark">' + logo() + '</div>' +
    '<h1>Queen <em>of</em> Nails</h1>' +
    '<p>' + D.tagline + '</p>' +
    '<div class="hands">' + nails(isTV ? 1.0 : 0.62) + '</div></section>');

  // 2-4. Prestations
  var SECS = D.sections.filter(function (x) { return !x.hidden; });
  SECS.forEach(function (s, i) {
    var rows = s.items.map(function (it) {
      return '<div class="row"><div class="name"><b>' + it.name + '</b><span>' + (it.note || "") + '</span></div>' +
        (it.time ? '<span class="time">' + it.time + '</span>' : "") + money(it) + "</div>";
    }).join("");
    slides.push('<section class="slide menu" data-id="' + s.id + '">' + top() +
      '<div class="left"><div class="kicker">' + s.kicker + '</div><h2>' + titleHTML(s.title) + '</h2>' +
      '<p class="intro">' + s.intro + '</p><div class="art-wrap">' + (window.QONArt ? window.QONArt.scene(s.art || window.QONArt.match(s.id + " " + s.title)) : nails(0.9)) + '</div></div>' +
      '<div class="right"><div class="list">' + rows + '</div></div></section>');
  });

  // 4b. Réalisations (si des photos ont été ajoutées)
  var GAL = D.gallery || [];
  if (GAL.length) {
    slides.push('<section class="slide menu gal">' + top() +
      '<div class="left"><div class="kicker">' + esc2(D.galleryKicker, "Nos réalisations") + '</div><h2>' + titleHTML(esc2(D.galleryTitle, "Vos plus belles créations")) +
      '</h2><p class="intro">' + esc2(D.galleryText, "Chaque ongle est unique, comme vous.") + '</p></div>' +
      '<div class="right"><div class="gal-row"></div></div></section>');
  }

  // 5. Réservation / installation
  var c = D.contact || {};
  var lines = "";
  if (c.phone) lines += "<li><b>Tél.</b>" + c.phone + "</li>";
  if (c.instagram) lines += "<li><b>Instagram</b>" + c.instagram + "</li>";
  if (c.address) lines += "<li><b>Adresse</b>" + c.address + "</li>";
  if (c.hours) lines += "<li><b>Horaires</b>" + c.hours + "</li>";
  slides.push('<section class="slide book">' + top() +
    '<div class="qr" id="qr"></div>' +
    '<div class="txt"><div class="kicker">' + esc2(QQ.kicker, "Garde-nous dans ta poche") + '</div>' +
    '<h2>' + titleHTML(esc2(QQ.title, "Scanne & retrouve nos tarifs")) + '</h2>' +
    '<p>' + esc2(QQ.text, "Vise le code avec l’appareil photo de ton téléphone.") + '</p>' +
    (lines ? "<ul>" + lines + "</ul>" : "") +
    '<div class="install"><b>iPhone :</b> bouton Partager, puis « Sur l’écran d’accueil ».<br><b>Android :</b> menu ⋮, puis « Installer l’application ».</div>' +
    '</div></section>');

  stage.innerHTML = slides.join("");
  var els = stage.getElementsByClassName("slide");
  var galOff = 0;
  function galFill(el) {
    var row = el.querySelector(".gal-row");
    if (!row || !GAL.length) return;
    var n = Math.min(4, GAL.length), h = "";
    for (var gi = 0; gi < n; gi++) h += '<div class="gal-ph" style="background-image:url(' + GAL[(galOff + gi) % GAL.length] + ')"></div>';
    galOff = (galOff + n) % GAL.length;
    row.innerHTML = h;
  }
  for (var gk = 0; gk < els.length; gk++) if (/\bgal\b/.test(els[gk].className)) galFill(els[gk]);

  // QR code vers l'adresse de l'appli
  try {
    var url = QQ.url || BASE;
    var qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    var box = document.getElementById("qr");
    qrSVG = qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true });
    if (box) box.innerHTML = qrSVG;
  } catch (e) {}

  // Étincelles décoratives
  (function () {
    var host = document.getElementById("sparks"), s = "";
    var pos = [[8, 22, 1.7], [22, 78, 1.2], [38, 12, 1.0], [56, 86, 1.5], [71, 18, 1.3], [84, 64, 1.8], [92, 30, 1.0], [47, 52, 0.9]];
    for (var i = 0; i < pos.length; i++) {
      s += '<i style="left:' + pos[i][0] + '%;top:' + pos[i][1] + '%;width:' + pos[i][2] + 'rem;height:' + pos[i][2] +
        'rem;animation-delay:' + (i * 0.9).toFixed(1) + 's"><svg viewBox="0 0 24 24"><use href="#spark"/></svg></i>';
    }
    host.innerHTML = s;
  })();

  if (!isTV) {
    if ("serviceWorker" in navigator) try { navigator.serviceWorker.register("sw.js"); } catch (e) {}
    return;
  }

  // ---------- Mode TV : diaporama + télécommande ----------
  var dots = document.getElementById("dots"), bar = document.getElementById("bar");
  var d = "";
  for (var k = 0; k < els.length; k++) d += "<i></i>";
  dots.innerHTML = d;
  var dotEls = dots.getElementsByTagName("i");
  var cur = -1, timer = null, paused = false, dur = (D.slideSeconds || 11) * 1000;

  function durOf(i) { var c = els[i].className; return ((/\bgal\b/.test(c) ? 10 : /menu/.test(c) ? 16 : /book/.test(c) ? 12 : 7) * (D.slideSeconds || 11) / 11) * 1000; }
  function runBar() {
    bar.className = "";
    void bar.offsetWidth;
    bar.firstChild.style.animationDuration = dur + "ms";
    bar.className = "run" + (paused ? " paused" : "");
  }
  function show(i) {
    if (typeof newData !== "undefined" && newData && navigator.onLine && cur >= 0) { location.reload(); return; }
    i = (i + els.length) % els.length;
    if (cur >= 0) { els[cur].classList.remove("on"); dotEls[cur].classList.remove("on"); }
    cur = i;
    dur = durOf(cur);
    if (/\bgal\b/.test(els[cur].className)) galFill(els[cur]);
    els[cur].classList.add("on");
    dotEls[cur].classList.add("on");
    schedule();
    if (typeof pubSoon === "function") pubSoon();
  }
  function schedule() {
    clearTimeout(timer);
    runBar();
    if (!paused) timer = setTimeout(function () { show(cur + 1); }, dur);
  }
  var keysT;
  function flashKeys() { document.body.classList.add("keys"); clearTimeout(keysT); keysT = setTimeout(function () { document.body.classList.remove("keys"); }, 5000); }
  var pauseT = null;
  function togglePause() {
    paused = !paused;
    document.body.classList.toggle("paused", paused);
    clearTimeout(pauseT);
    if (paused) {
      clearTimeout(timer); bar.className = "run paused";
      pauseT = setTimeout(function () { if (paused) togglePause(); }, 60000);   // la pause ne reste jamais bloquée
    } else { schedule(); }
  }

  // ---------- Mode panorama (cliente en cours de soin) ----------
  var ARTS = [["#F6D3CC", "#E7A9AE"], ["#F3E1CB", "#D9B48B"], ["#E9B8BC", "#B9637A"], ["#F8E3DE", "#D18B94"], ["#EBC9BE", "#C9828B"], ["#F5DDD7", "#BE9468"]];
  function artCard(i) {
    var a = ARTS[i % ARTS.length], b = ARTS[(i + 2) % ARTS.length];
    var ns = nailSVG(5.2, 12, a) + nailSVG(5.2, 14, b) + nailSVG(5.2, 11, ARTS[(i + 4) % ARTS.length]);
    var pos = ["left:3rem;top:4.6rem;transform:rotate(-14deg)", "left:10.4rem;top:2.6rem;transform:rotate(4deg)", "left:17.8rem;top:5.2rem;transform:rotate(16deg)"];
    var parts = ns.split("</svg>");
    var h = "";
    for (var j = 0; j < 3; j++) h += '<div style="position:absolute;' + pos[j] + '">' + parts[j] + "</svg></div>";
    return '<div class="pc art" style="background:linear-gradient(150deg,' + a[0] + "," + b[0] + ')">' + h +
      '<svg class="st" viewBox="0 0 24 24" style="left:' + (2 + (i * 7) % 18) + 'rem;top:' + (1.4 + (i * 3) % 6) + 'rem"><use href="#spark"/></svg></div>';
  }
  function photoCard(src) { return '<div class="pc photo" style="background-image:url(' + src + ')"></div>'; }
  var flat = [];
  SECS.forEach(function (s) { s.items.forEach(function (it) { flat.push({ kicker: s.kicker, it: it }); }); });
  function svcCard(n) {
    var o = flat[n % flat.length];
    return '<div class="pc svc"><small>' + o.kicker + '</small><b>' + o.it.name + '</b><span>' + (o.it.from ? "dès " : "") + o.it.price + ' €</span></div>';
  }
  var Q = D.quotes && D.quotes.length ? D.quotes : [D.tagline];
  function quoteCard(n) { return '<div class="pc quote"><p>«\u00a0' + Q[n % Q.length] + '\u00a0»</p></div>'; }
  function brandCard() { return '<div class="pc brand">' + logo() + "<b>" + D.brand + "</b><small>" + D.tagline + "</small></div>"; }
  function rowHTML(off) {
    var out = [], g = D.gallery || [], gi = 0, n = 0;
    for (var i = 0; i < 10; i++) {
      var t = (i + off) % 5;
      if (t === 0) out.push(g.length ? photoCard(g[gi++ % g.length]) : artCard(i + off));
      else if (t === 1) out.push(svcCard(i + off));
      else if (t === 2) out.push(artCard(i + off + 1));
      else if (t === 3) out.push(quoteCard(i * 3 + (off ? 1 : 0)));
      else out.push(i % 2 ? brandCard() : svcCard(i + off + 3));
    }
    var one = out.join("");
    return '<div class="prow">' + one + one + "</div>";
  }
  var pano = document.createElement("section");
  pano.id = "pano";
  var cat = (window.QONCatalog && window.QONCatalog.scenes) ? window.QONCatalog.scenes(D) : [];
  if (GAL.length) {
    cat.push({ id: "realisations", html: '<div class="cat-scene gal-scene"><div class="gs-h"><span>Nos réalisations</span><b>Vos plus belles <em>créations</em></b></div>' +
      '<div class="gs-frames"><i class="gs-f gs-l"></i><i class="gs-f gs-c"></i><i class="gs-f gs-r"></i></div></div>' });
  }
  var catHTML = "";
  for (var ci = 0; ci < cat.length; ci++) catHTML += cat[ci].html;
  pano.innerHTML = top() + '<div class="rows">' + rowHTML(0) + rowHTML(2) + '</div><div class="scenes">' + catHTML + "</div>" +
    (qrSVG ? '<div class="pqr">' + qrSVG + "<span>" + esc2(QQ.label, "Nos tarifs") + "</span></div>" : "");
  document.body.appendChild(pano);

  var catEls = {}, catNodes = pano.querySelectorAll(".scenes .cat-scene");
  for (var cj = 0; cj < cat.length && cj < catNodes.length; cj++) catEls[cat[cj].id] = catNodes[cj];
  var wanted = (D.panoScenes && D.panoScenes.length) ? D.panoScenes : ["mix", "formes", "longueurs", "couleurs", "designs"];
  var sceneList = wanted.filter(function (id) { return id === "mix" || catEls[id]; });
  if (!sceneList.length) sceneList = ["mix"];
  var sceneIdx = 0, sceneT = null, sceneMs = (D.panoSceneSeconds || 25) * 1000;
  var galT = null, galK = 0;
  function galTick() {
    var fr = pano.querySelectorAll(".gs-f");
    if (!fr.length || !GAL.length) return;
    for (var q = 0; q < fr.length; q++) {
      fr[q].style.backgroundImage = "url(" + GAL[(galK + q) % GAL.length] + ")";
      fr[q].className = fr[q].className.replace(/ gs-in/g, "");
      void fr[q].offsetWidth;
      fr[q].className += " gs-in";
    }
    galK = (galK + 1) % GAL.length;
  }
  function setScene(i) {
    sceneIdx = i % sceneList.length;
    var id = sceneList[sceneIdx];
    clearInterval(galT);
    if (id === "realisations") { galTick(); galT = setInterval(galTick, 5000); }
    pano.classList.toggle("scene-other", id !== "mix");
    for (var k in catEls) catEls[k].classList.toggle("on", k === id);
    clearTimeout(sceneT);
    if (sceneList.length > 1) sceneT = setTimeout(function () { setScene(sceneIdx + 1); }, sceneMs);
  }
  function clearScenes() {
    clearTimeout(sceneT); clearInterval(galT);
    for (var k in catEls) catEls[k].classList.remove("on");
    pano.classList.remove("scene-other");
  }
  var newData = false;
  setInterval(function () {
    try {
      fetch("data.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (t) { if (t !== rawJSON) newData = true; });
    } catch (e) {}
  }, 15 * 1000);

  var mode = "menu", idleT = null, idleMs = (D.panoramaAfterMinutes || 3) * 60000;
  function enterPano() {
    if (mode === "pano") return;
    mode = "pano";
    if (navigator.onLine && (newData || Date.now() - t0 > 6 * 3600 * 1000)) { location.reload(); return; }
    clearTimeout(timer);
    bar.className = "";
    document.body.classList.add("is-pano");
    pano.classList.add("on");
    setScene(0);
    if (typeof pubSoon === "function") pubSoon();
    clearTimeout(panoT);
    panoT = setTimeout(function () { exitPano(); bump(loopMs()); }, PANO_MS);
  }
  function exitPano() {
    clearTimeout(panoT);
    mode = "menu";
    document.body.classList.remove("is-pano");
    pano.classList.remove("on");
    clearScenes();
    if (newData && navigator.onLine) { location.reload(); return; }
    show(0);
  }
  var panoT = null, PANO_MS = (D.panoramaSeconds || 120) * 1000;
  function bump(ms) { clearTimeout(idleT); idleT = setTimeout(enterPano, ms || idleMs); }
  function loopMs() { var t = 0; for (var q = 0; q < els.length; q++) t += durOf(q); return t + 500; }


  // ---------- Musique d'ambiance (jouée par la page) ----------
  var M = D.music || { enabled: false, tracks: [] };
  var audio = new Audio();
  audio.preload = "auto";
  var mTracks = [], mIdx = -1, mBlocked = false, mFails = 0, mVol = (M.volume == null ? 30 : M.volume);
  (function () {
    mTracks = (M.tracks || []).filter(function (t) { return t.on !== false && t.src; });
    if (M.shuffle) for (var i = mTracks.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = mTracks[i]; mTracks[i] = mTracks[j]; mTracks[j] = t; }
  })();
  function mPlay(i) {
    if (!mTracks.length || M.enabled === false) return;
    mIdx = (i + mTracks.length) % mTracks.length;
    audio.src = mTracks[mIdx].src;
    audio.volume = Math.max(0, Math.min(1, mVol / 100));
    var p = audio.play();
    if (p && p.catch) p.catch(function () { mBlocked = true; });
    if (typeof pubSoon === "function") pubSoon();
  }
  audio.addEventListener("ended", function () { mFails = 0; mPlay(mIdx + 1); });
  audio.addEventListener("playing", function () { mBlocked = false; mFails = 0; });
  audio.addEventListener("error", function () { if (++mFails < mTracks.length) setTimeout(function () { mPlay(mIdx + 1); }, 800); });
  function mState() { return { title: mIdx >= 0 && mTracks[mIdx] ? mTracks[mIdx].title : "", playing: !audio.paused, vol: Math.round(mVol), on: M.enabled !== false && mTracks.length > 0 }; }
  function mCmd(c) {
    if (c.cmd === "mnext") mPlay(mIdx + 1);
    else if (c.cmd === "mprev") mPlay(mIdx - 1);
    else if (c.cmd === "mpause") { if (audio.paused) { if (mIdx < 0) mPlay(0); else audio.play().catch(function () {}); } else audio.pause(); }
    else if (c.cmd === "mvol") { mVol = Math.max(0, Math.min(100, mVol + (Number(c.n) || 0))); audio.volume = mVol / 100; }
    setTimeout(function () { if (typeof pubSoon === "function") pubSoon(); }, 300);
  }
  if (M.enabled !== false) mPlay(M.shuffle ? 0 : 0);

  // ---------- Télécommande à distance (depuis l'appli du téléphone) ----------
  // Messages simples (« next », « pause »…) échangés via un salon ntfy.sh à code secret ; aucune donnée personnelle.
  var RC_BASE = "https://ntfy.sh/", RC_LOCAL = false;   // RC_LOCAL : relais fourni par le serveur de la TV (sans internet)
  var rcCode = "";
  try { rcCode = localStorage.getItem("qon-rc") || ""; } catch (e) {}
  if (!rcCode) {
    for (var rq = 0; rq < 8; rq++) rcCode += "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32));
    try { localStorage.setItem("qon-rc", rcCode); } catch (e) {}
  }
  var rcTopic = "qon-" + rcCode.toLowerCase();
  function pubState() {
    try {
      var st = { slide: cur, total: els.length, mode: mode, paused: paused, scene: sceneList[sceneIdx], music: mState(), t: Date.now() };
      fetch(RC_LOCAL ? "__state" : RC_BASE + rcTopic + "-s", { method: "POST", body: JSON.stringify(st) });
    } catch (e) {}
  }
  var pubT = null;
  function pubSoon() { clearTimeout(pubT); pubT = setTimeout(pubState, 400); }
  function rcAct(c) {
    if (c.cmd === "hello") { hidePair(); pubState(); return; }
    if (/^m(next|prev|pause|vol)$/.test(c.cmd)) { mCmd(c); return; }
    bump();
    if (c.cmd === "next" || c.cmd === "prev") {
      if (mode === "pano") exitPano();
      else show(cur + (c.cmd === "next" ? 1 : -1));
    } else if (c.cmd === "goto") {
      if (mode === "pano") exitPano();
      show(parseInt(c.n, 10) || 0);
    } else if (c.cmd === "pause") {
      if (mode === "menu") togglePause();
    } else if (c.cmd === "pair") { showPair(); }
    else if (c.cmd === "pano") { enterPano(); }
    else if (c.cmd === "menu") { if (mode === "pano") exitPano(); }
    else if (c.cmd === "scene") { if (mode === "pano") setScene(sceneIdx + 1); }
    pubSoon();
  }
  var pairEl = document.createElement("div");
  pairEl.id = "pair";
  try {
    var pq = qrcode(0, "M");
    pq.addData(BASE + "admin.html#rc=" + rcCode);
    pq.make();
    pairEl.innerHTML = '<div class="pq">' + pq.createSvgTag({ cellSize: 4, margin: 8, scalable: true }) + '</div><div><b>Télécommande</b><span>Scanne pour piloter la TV</span><em>' + rcCode + "</em></div>";
  } catch (e) {}
  document.body.appendChild(pairEl);
  var pairT = null;
  function hidePair() { clearTimeout(pairT); pairEl.classList.remove("on"); }
  function showPair() { pairEl.classList.add("on"); clearTimeout(pairT); pairT = setTimeout(hidePair, 120000); }
  setTimeout(function () { pairEl.classList.add("on"); }, 1500);
  setTimeout(hidePair, 120000);
  function rcListen() {
    if (!window.EventSource) return;
    var es;
    try { es = new EventSource(RC_LOCAL ? "__rc/events" : RC_BASE + rcTopic + "/sse"); } catch (e) { return; }
    es.onmessage = function (ev) {
      try {
        var m = JSON.parse(ev.data);
        if (m.event !== "message") return;
        rcAct(JSON.parse(m.message));
      } catch (e) {}
    };
  }
  try {
    fetch("__ping", { cache: "no-store" }).then(function (r) { RC_LOCAL = r.ok; }).catch(function () {}).then(rcListen);
  } catch (e) { rcListen(); }
  var _show = show;
  window.addEventListener("keydown", function (e) {
    var k = e.keyCode;
    if (mBlocked) { audio.play().catch(function () {}); }
    if (k === 82 && mode !== "pano") { e.preventDefault(); showPair(); return; }   // touche Menu : affiche le QR de jumelage
    if (mode === "pano") { e.preventDefault(); exitPano(); bump(); return; }
    bump();
    flashKeys();
    if (k === 39 || k === 40 || k === 34 || k === 87) { e.preventDefault(); show(cur + 1); }
    else if (k === 37 || k === 38 || k === 33) { e.preventDefault(); show(cur - 1); }
    else if (k === 13 || k === 32 || k === 179 || k === 23) { e.preventDefault(); togglePause(); }
  });
  // Rechargement toutes les 6 h, seulement en ligne et pendant le panorama (récupère les mises à jour)
  var t0 = Date.now();

  if ("serviceWorker" in navigator) try { navigator.serviceWorker.register("sw.js"); } catch (e) {}
  var sl = /[?&]slide=(\d+)/.exec(qs);
  show(sl ? parseInt(sl[1], 10) : 0);
  bump();
  if (/[?&]pano=1/.test(qs)) enterPano();
  if (/[?&]still=1/.test(qs)) { paused = true; clearTimeout(timer); bar.className = "run paused"; }
}

/* Contenu = data.js (valeurs par défaut) + data.json (modifié depuis l'appli d'administration). */
(function () {
  var base = window.QON, raw = "";
  function merge(j) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in j) o[k] = j[k]; return o; }
  function go(j) {
    var done = function () { boot(j ? merge(j) : base, raw); };
    if (!/^(localhost|127\.)/.test(location.hostname)) return done();
    try {
      fetch("__info", { cache: "no-store" }).then(function (r) { return r.json(); })
        .then(function (i) { if (i && i.url) window.QON_BASE = i.url; }).catch(function () {}).then(done);
    } catch (e) { done(); }
  }
  try {
    fetch("data.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (t) { raw = t; var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} go(j); })
      .catch(function () { go(null); });
  } catch (e) { go(null); }
})();
