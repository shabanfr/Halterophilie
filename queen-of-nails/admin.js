/* Queen of Nails — gestion du contenu depuis le téléphone.
   Brouillon sauvegardé sur le téléphone ; « Publier » écrit data.json et les photos dans le dépôt GitHub (via un jeton),
   le site se redéploie et la TV se met à jour toute seule. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var DEFAULTS = JSON.parse(JSON.stringify(window.QON));
  var SCENES = [
    { id: "mix", name: "Mélange (photos, tarifs, citations)" },
    { id: "formes", name: "Catalogue : les formes" },
    { id: "longueurs", name: "Catalogue : les longueurs" },
    { id: "couleurs", name: "Catalogue : les couleurs" },
    { id: "designs", name: "Catalogue : les designs" }
  ];
  var ARTS = [["", "Automatique"], ["manucure", "Manucure"], ["pose", "Pose gel / capsules"], ["art", "Nail art"], ["pedicure", "Pédicure"], ["soin", "Soin des mains"], ["depose", "Dépose"], ["defaut", "Couronne Queen of Nails"]];
  var state = null;            // contenu en cours d'édition
  var pending = {};
  var pendingAudio = {};     // chemin -> dataURL des nouvelles musiques (en mémoire seulement)            // chemin -> dataURL des nouvelles photos
  var cfg = { owner: "", repo: "", branch: "master", dir: "queen-of-nails/", token: "" };
  var tab = "prestations";
  var dirty = false;

  // ---------- stockage local ----------
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function guessCfg() {
    var h = location.hostname, p = location.pathname.split("/").filter(Boolean);
    if (/\.github\.io$/.test(h)) { cfg.owner = h.split(".")[0]; if (p.length > 1) cfg.repo = p[0]; }
    if (!cfg.repo) cfg.repo = "Halterophilie";
    if (!cfg.owner) cfg.owner = "shabanfr";
  }
  function loadCfg() {
    guessCfg();
    var s = lsGet("qon-cfg");
    if (s) { try { var o = JSON.parse(s), k; for (k in o) cfg[k] = o[k]; } catch (e) {} }
  }
  function saveDraft() {
    dirty = true;
    lsSet("qon-draft", JSON.stringify({ state: state, pending: pending }));
    badge();
  }
  function badge() { var b = $("#quickPublish"); if (b) b.textContent = dirty ? "Publier •" : "Publier"; }

  // ---------- état initial : brouillon > data.json publié > data.js ----------
  function init() {
    loadCfg();
    var hm = /[#&]rc=([A-Za-z0-9]{6,12})/.exec(location.hash);
    if (hm) { rcCode = hm[1].toUpperCase(); lsSet("qon-rc", rcCode); tab = "tele"; }
    var draft = lsGet("qon-draft");
    if (draft) {
      try { var d = JSON.parse(draft); state = d.state; pending = d.pending || {}; dirty = true; if (state.music && state.music.tracks) state.music.tracks = state.music.tracks.filter(function (t) { return !t._new; }); } catch (e) {}
    }
    if (state) { badge(); render(); return; }
    fetch("data.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { state = merge(DEFAULTS, j || {}); render(); })
      .catch(function () { state = JSON.parse(JSON.stringify(DEFAULTS)); render(); });
  }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return JSON.parse(JSON.stringify(o)); }

  // ---------- utilitaires ----------
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function setPath(obj, path, val) {
    var p = path.split("."), o = obj, i;
    for (i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = val;
  }
  function getPath(obj, path) { var p = path.split("."), o = obj, i; for (i = 0; i < p.length; i++) o = o[p[i]]; return o; }
  function move(arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  function say(msg, kind) {
    var s = $("#status"); s.hidden = !msg; s.textContent = msg || ""; s.className = "status" + (kind ? " " + kind : "");
    if (msg && kind === "ok") setTimeout(function () { if (s.textContent === msg) s.hidden = true; }, 4000);
  }

  // ---------- vues ----------
  function field(label, path, type, extra) {
    var v = getPath(state, path);
    return '<label>' + label + '</label><input type="' + (type || "text") + '" data-k="' + path + '" value="' + esc(v) + '"' + (extra || "") + '>';
  }
  function stepper(label, path, step, min, unit, max) {
    return '<label>' + label + '</label><div class="stepper"><button class="btn" type="button" data-step="' + path + '" data-d="-' + step + '" data-min="' + min + '" data-max="' + (max || 100000) + '">−</button>' +
      '<input type="number" inputmode="numeric" data-k="' + path + '" data-num="1" value="' + esc(getPath(state, path)) + '"><button class="btn" type="button" data-step="' + path + '" data-d="' + step + '" data-min="' + min + '" data-max="' + (max || 100000) + '">+</button></div>' +
      '<div class="hint" style="margin:4px 0 0">' + unit + '</div>';
  }
  function viewPrestations() {
    var h = '<h2>Tes <em>prestations</em></h2><p class="hint">Modifie un nom, une durée ou un prix : touche un champ et écris. N’oublie pas de publier à la fin.</p>';
    state.sections.forEach(function (s, si) {
      h += '<section class="card"><h3>Catégorie ' + (si + 1) + '</h3>' +
        field("Titre", "sections." + si + ".title") + field("Sous-titre (petit texte au-dessus)", "sections." + si + ".kicker") +
        '<label>Phrase d’accroche</label><textarea data-k="sections.' + si + '.intro" rows="2">' + esc(s.intro) + '</textarea>' +
        '<label class="chk"><input type="checkbox" data-show="sections.' + si + '.hidden"' + (s.hidden ? "" : " checked") + '>Afficher cette catégorie sur la TV</label>' +
        '<label>Illustration animée</label><select data-k="sections.' + si + '.art">' + ARTS.map(function (a) { return '<option value="' + a[0] + '"' + ((s.art || "") === a[0] ? " selected" : "") + '>' + a[1] + "</option>"; }).join("") + "</select>";
      s.items.forEach(function (it, ii) {
        var b = "sections." + si + ".items." + ii;
        h += '<div class="item">' + field("Prestation", b + ".name") + field("Détail (facultatif)", b + ".note") +
          '<div class="row2"><div>' + field("Durée", b + ".time", "text", ' placeholder="45 min"') + '</div><div>' +
          field("Prix (€)", b + ".price", "number", ' inputmode="decimal" data-num="1"') + '</div></div>' +
          '<label class="chk"><input type="checkbox" data-chk="' + b + '.from"' + (it.from ? " checked" : "") + '>Afficher « dès » devant le prix</label>' +
          '<div class="tools"><button class="btn small" type="button" data-act="item-up" data-si="' + si + '" data-ii="' + ii + '">↑</button>' +
          '<button class="btn small" type="button" data-act="item-down" data-si="' + si + '" data-ii="' + ii + '">↓</button>' +
          '<button class="btn small danger" type="button" data-act="item-del" data-si="' + si + '" data-ii="' + ii + '">Supprimer</button></div></div>';
      });
      h += '<div class="stack" style="margin-top:12px"><button class="btn" type="button" data-act="item-add" data-si="' + si + '">+ Ajouter une prestation</button>' +
        '<div class="tools" style="justify-content:flex-start"><button class="btn small" type="button" data-act="sec-up" data-si="' + si + '">Catégorie ↑</button>' +
        '<button class="btn small" type="button" data-act="sec-down" data-si="' + si + '">Catégorie ↓</button>' +
        '<button class="btn small danger" type="button" data-act="sec-del" data-si="' + si + '">Supprimer la catégorie</button></div></div></section>';
    });
    return h + '<button class="btn primary" type="button" data-act="sec-add" style="width:100%">+ Ajouter une catégorie</button>';
  }
  function viewPano() {
    var order = state.panoScenes && state.panoScenes.length ? state.panoScenes : [];
    var h = '<h2>Temps &amp; <em>panorama</em></h2><p class="hint">Le panorama s’affiche seul quand la télécommande n’est pas touchée : tes réalisations, les formes, couleurs et designs d’ongles.</p>';
    h += '<section class="card"><h3>Durées</h3>' +
      stepper("Chaque diapo du menu", "slideSeconds", 1, 5, "secondes (réf. : 11 s ; les tarifs restent un peu plus longs)") +
      stepper("Avant le panorama (sans toucher la télécommande)", "panoramaAfterMinutes", 1, 1, "minutes") +
      stepper("Durée totale du panorama", "panoramaSeconds", 10, 20, "secondes, puis retour au menu") +
      stepper("Chaque scène du panorama", "panoSceneSeconds", 5, 8, "secondes") + '</section>';
    h += '<section class="card"><h3>Scènes du panorama</h3><p class="hint">Coche celles à afficher et change l’ordre.</p>';
    var shown = {}, list = [];
    order.forEach(function (id) { shown[id] = true; list.push({ id: id, on: true }); });
    SCENES.forEach(function (s) { if (!shown[s.id]) list.push({ id: s.id, on: false }); });
    list.forEach(function (it, i) {
      var meta = SCENES.filter(function (s) { return s.id === it.id; })[0];
      if (!meta) return;
      h += '<div class="scene"><label class="chk"><input type="checkbox" data-scene="' + it.id + '"' + (it.on ? " checked" : "") + '>' + esc(meta.name) + '</label>' +
        '<div class="tools" style="margin:0"><button class="btn small" type="button" data-act="scene-up" data-id="' + it.id + '">↑</button>' +
        '<button class="btn small" type="button" data-act="scene-down" data-id="' + it.id + '">↓</button></div></div>';
    });
    h += '</section><section class="card"><h3>Citations</h3><p class="hint">Une par ligne. Elles défilent dans le panorama.</p>' +
      '<textarea id="quotes" rows="5">' + esc((state.quotes || []).join("\n")) + '</textarea></section>';
    return h;
  }
  function viewPhotos() {
    var g = state.gallery || [];
    var h = '<h2>Tes <em>photos</em></h2><p class="hint">Ajoute tes réalisations : elles défilent dans le panorama. Les photos sont réduites automatiquement pour la TV.</p>' +
      '<label class="btn primary" style="display:block;text-align:center;margin-bottom:14px">+ Ajouter des photos<input id="file" type="file" accept="image/*" multiple hidden></label>';
    if (!g.length) return h + '<div class="empty">Aucune photo pour l’instant.<br>Le panorama utilise des décors d’ongles.</div>';
    h += '<div class="grid">';
    g.forEach(function (src, i) {
      h += '<div class="ph"><img alt="" src="' + esc(pending[src] || src) + '">' + (pending[src] ? "<i>à publier</i>" : "") +
        '<button type="button" data-act="ph-del" data-i="' + i + '" aria-label="Retirer">✕</button></div>';
    });
    return h + "</div>";
  }
  function viewInfos() {
    state.qr = state.qr || JSON.parse(JSON.stringify(DEFAULTS.qr));
    return '<h2>Tes <em>infos</em></h2><p class="hint">Affichées sur la dernière diapo. Laisse vide pour ne rien montrer.</p><section class="card">' +
      field("Nom", "brand") + field("Slogan", "tagline") + field("Adresse du site pour les QR (facultatif)", "siteUrl", "url", ' placeholder="http://192.168.129.80:8080/"') + '</section><section class="card"><h3>Contact</h3>' +
      field("Téléphone", "contact.phone") + field("Instagram", "contact.instagram", "text", ' placeholder="@queenofnails"') +
      field("Adresse", "contact.address") + field("Horaires", "contact.hours", "text", ' placeholder="Mar–Sam 9h–19h"') + "</section>" +
      '<section class="card"><h3>QR code de la TV</h3><p class="hint">Les clientes le scannent avec leur téléphone. Mets le lien de ton choix : Instagram, réservation, avis Google… Laisse vide pour le site lui-même.</p>' +
      field("Lien du QR code", "qr.url", "url", ' placeholder="https://instagram.com/…"') + field("Petit titre", "qr.kicker") + field("Titre", "qr.title") +
      field("Texte", "qr.text") + field("Libellé du mini QR (panorama)", "qr.label") + "</section>";
  }
  function viewMusique() {
    var m = state.music = state.music || { enabled: true, volume: 30, shuffle: true, tracks: [] };
    var h = '<h2>Ta <em>musique</em></h2><p class="hint">La TV joue ces morceaux en continu. Ajoute les tiens : tu dois avoir le droit de les diffuser dans ton salon (SACEM/SPRE).</p>' +
      '<section class="card"><label class="chk"><input type="checkbox" data-chk="music.enabled"' + (m.enabled !== false ? " checked" : "") + '>Musique d’ambiance activée</label>' +
      '<label class="chk"><input type="checkbox" data-chk="music.shuffle"' + (m.shuffle ? " checked" : "") + '>Lecture aléatoire</label>' +
      stepper("Volume au démarrage", "music.volume", 5, 0, "sur 100 (réf. : 30)", 100) + '</section>';
    if (rcCode) {
      h += '<section class="card"><h3>En direct sur la TV</h3><div class="live" id="mlive"><i></i><span>…</span></div><div class="pad">' +
        '<button class="btn" type="button" data-rc="mprev">◀ Précédente</button><button class="btn" type="button" data-rc="mnext">Suivante ▶</button>' +
        '<button class="btn" type="button" data-rc="mpause">⏯ Pause / Lecture</button><button class="btn" type="button" data-rc="mvol" data-n="-5">Volume −</button>' +
        '<button class="btn" type="button" data-rc="mvol" data-n="5">Volume +</button></div></section>';
    }
    h += '<label class="btn primary" style="display:block;text-align:center;margin-bottom:14px">+ Ajouter de la musique<input id="afile" type="file" accept="audio/*" multiple hidden></label>';
    var tr = m.tracks || [];
    if (!tr.length) return h + '<div class="empty">Aucun morceau.</div>';
    h += '<section class="card"><h3>Morceaux (' + tr.length + ')</h3>';
    tr.forEach(function (t, i) {
      h += '<div class="item"><label class="chk" style="margin-top:0"><input type="checkbox" data-chk="music.tracks.' + i + '.on"' + (t.on !== false ? " checked" : "") + '>Jouer ce morceau' + (pendingAudio[t.src] ? '<span class="pill">à publier</span>' : "") + '</label>' +
        field("Titre", "music.tracks." + i + ".title") +
        '<div class="tools"><button class="btn small danger" type="button" data-act="trk-del" data-i="' + i + '">Supprimer</button></div></div>';
    });
    return h + "</section>";
  }
  // ---------- télécommande ----------
  var RC = "https://ntfy.sh/", RCL = false, rcCode = lsGet("qon-rc") || "", tvState = null, es = null, esCode = "";
  try { fetch("__ping", { cache: "no-store" }).then(function (r) { RCL = r.ok; if (RCL && !rcCode) rcCode = "LOCAL"; if (state) render(); }).catch(function () {}); } catch (e) {}
  function slideNames() {
    var n = ["Accueil"];
    state.sections.filter(function (x) { return !x.hidden; }).forEach(function (x) { n.push(x.title); });
    n.push("QR code");
    return n;
  }
  function send(cmd, n) {
    if (!rcCode) { say("Scanne le code sur la TV ou saisis-le.", "err"); return; }
    var o = { cmd: cmd }; if (n != null) o.n = n;
    fetch(RCL ? "__rc" : RC + "qon-" + rcCode.toLowerCase(), { method: "POST", body: JSON.stringify(o) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); })
      .catch(function () { say("Commande non envoyée (connexion ?).", "err"); });
  }
  function listen() {
    if (!rcCode || !window.EventSource || (es && esCode === rcCode)) return;
    if (es) es.close();
    esCode = rcCode;
    try {
      es = new EventSource(RCL ? "__state/events" : RC + "qon-" + rcCode.toLowerCase() + "-s/sse");
      es.onmessage = function (ev) {
        try { var m = JSON.parse(ev.data); if (m.event !== "message") return; tvState = JSON.parse(m.message); if (tab === "tele" || tab === "musique") paintLive(); } catch (e) {}
      };
    } catch (e) {}
  }
  function paintLive() {
    var el = $("#live"); if (!el) return;
    var fresh = tvState && Date.now() - tvState.t < 3 * 3600 * 1000;
    el.className = "live" + (fresh ? " on" : "");
    el.querySelector("span").textContent = fresh
      ? (tvState.mode === "pano" ? "TV : panorama" + (tvState.scene ? " · " + tvState.scene : "") : "TV : diapo " + (tvState.slide + 1) + "/" + tvState.total + (tvState.paused ? " · en pause" : ""))
      : "TV : en attente de réponse…";
    var ml = $("#mlive");
    if (ml && tvState && tvState.music) {
      ml.className = "live on";
      ml.querySelector("span").textContent = (tvState.music.playing ? "▶ " : "⏸ ") + (tvState.music.title || "—") + " · volume " + tvState.music.vol;
    }
    Array.prototype.forEach.call(document.querySelectorAll("#slides .btn"), function (b) {
      b.classList.toggle("cur", !!(fresh && tvState.mode === "menu" && Number(b.getAttribute("data-n")) === tvState.slide));
    });
  }
  function viewTele() {
    var h = '<h2>Ma <em>télécommande</em></h2><p class="hint">Pilote la TV depuis ton téléphone, sans la télécommande.</p>';
    if (!rcCode) {
      return h + '<section class="card"><h3>Jumelage <span class="pill">une seule fois</span></h3><p class="hint">Sur la TV, scanne le petit code qui s’affiche en haut à droite (il apparaît au démarrage). Ou saisis ici le code de 8 lettres affiché dessous.</p>' +
        '<label>Code de la TV</label><input type="text" id="rcin" autocapitalize="characters" autocomplete="off" placeholder="ABCD2345">' +
        '<button class="btn primary" type="button" data-act="rc-save" style="width:100%;margin-top:12px">Associer</button></section>';
    }
    h += '<div class="live" id="live"><i></i><span>TV : en attente de réponse…</span></div>' +
      '<section class="card"><div class="pad"><button class="btn" type="button" data-rc="prev">◀ Précédent</button><button class="btn" type="button" data-rc="next">Suivant ▶</button>' +
      '<button class="btn" type="button" data-rc="pause">⏯ Pause / Reprise</button><button class="btn" type="button" data-rc="scene">Scène suivante</button>' +
      '<button class="btn primary" type="button" data-rc="pano">Mode panorama</button><button class="btn primary" type="button" data-rc="menu">Retour au menu</button></div></section>' +
      '<section class="card slides" id="slides"><h3>Aller à une diapo</h3>';
    slideNames().forEach(function (n, i) { h += '<button class="btn" type="button" data-rc="goto" data-n="' + i + '">' + (i + 1) + ". " + esc(n) + "</button>"; });
    return h + '</section><button class="btn ghost" type="button" data-act="rc-forget">Dissocier cette TV</button>';
  }
  function viewPublier() {
    var n = Object.keys(pending).length;
    return '<h2>Mettre à jour <em>la TV</em></h2><p class="hint">' + (dirty ? "Tu as des modifications non publiées" + (n ? " (dont " + n + " nouvelle(s) photo(s))" : "") + "." : "Tout est publié.") + '</p>' +
      '<section class="card"><button id="publish" class="btn primary" type="button" style="width:100%">Publier sur la TV</button>' +
      '<p class="hint" style="margin-top:10px">La TV se met à jour toute seule en 1 à 5 minutes, quand elle passe en panorama.</p><pre class="log" id="log" hidden></pre></section>' +
      '<section class="card"><h3>Connexion GitHub <span class="pill">une seule fois</span></h3>' +
      field("Compte", "x", "text").replace('data-k="x" value=""', 'data-cfg="owner" value="' + esc(cfg.owner) + '"') +
      '<label>Dépôt</label><input type="text" data-cfg="repo" value="' + esc(cfg.repo) + '">' +
      '<label>Branche</label><input type="text" data-cfg="branch" value="' + esc(cfg.branch) + '">' +
      '<label>Jeton d’accès</label><input type="password" data-cfg="token" autocomplete="off" value="' + esc(cfg.token) + '" placeholder="github_pat_…">' +
      '<ol class="how"><li>GitHub, Settings, Developer settings, <b>Fine-grained tokens</b>, Generate.</li><li>Repository access : seulement ce dépôt.</li><li>Permissions : <b>Contents = Read and write</b>.</li><li>Colle le jeton ci-dessus. Il reste sur ce téléphone.</li></ol></section>' +
      '<section class="card"><h3>Sauvegarde</h3><div class="stack"><button class="btn" type="button" data-act="export">Copier le contenu (JSON)</button>' +
      '<button class="btn" type="button" data-act="import">Coller un contenu (JSON)</button>' +
      '<button class="btn danger" type="button" data-act="reset">Annuler mes modifications</button></div></section>';
  }
  function render() {
    var y = window.scrollY;
    $("#view").innerHTML = ({ prestations: viewPrestations, pano: viewPano, photos: viewPhotos, infos: viewInfos, musique: viewMusique, tele: viewTele, publier: viewPublier })[tab]();
    if (tab === "tele" || tab === "musique") { listen(); if (rcCode) send("hello"); paintLive(); }
    Array.prototype.forEach.call(document.querySelectorAll("#tabs button"), function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
    window.scrollTo(0, y);
    badge();
  }

  // ---------- événements ----------
  document.addEventListener("input", function (e) {
    var t = e.target, k = t.getAttribute("data-k");
    if (k) {
      var v = t.value;
      if (t.getAttribute("data-num")) v = v === "" ? "" : Number(String(v).replace(",", "."));
      setPath(state, k, v); saveDraft(); return;
    }
    if (t.id === "quotes") { state.quotes = t.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); saveDraft(); return; }
    var c = t.getAttribute("data-cfg");
    if (c) { cfg[c] = t.value.trim(); lsSet("qon-cfg", JSON.stringify(cfg)); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target, ck = t.getAttribute("data-chk"), sh = t.getAttribute("data-show");
    if (sh) { setPath(state, sh, !t.checked); saveDraft(); return; }
    if (ck) { setPath(state, ck, t.checked); saveDraft(); return; }
    var sc = t.getAttribute("data-scene");
    if (sc) {
      var arr = (state.panoScenes || []).slice();
      var i = arr.indexOf(sc);
      if (t.checked && i < 0) arr.push(sc); else if (!t.checked && i >= 0) arr.splice(i, 1);
      state.panoScenes = arr; saveDraft(); render(); return;
    }
    if (t.id === "file") addPhotos(t.files);
    if (t.id === "afile") addAudio(t.files);
  });
  $("#tabs").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    tab = b.getAttribute("data-tab"); render(); window.scrollTo(0, 0);
  });
  $("#quickPublish").addEventListener("click", function () { tab = "publier"; render(); window.scrollTo(0, 0); publish(); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var rcmd = b.getAttribute("data-rc");
    if (rcmd) { send(rcmd, b.getAttribute("data-n") != null ? Number(b.getAttribute("data-n")) : null); return; }
    var st = b.getAttribute("data-step");
    if (st) {
      var cur = Number(getPath(state, st)) || 0, d = Number(b.getAttribute("data-d")), mn = Number(b.getAttribute("data-min"));
      setPath(state, st, Math.min(Number(b.getAttribute("data-max")) || 1e9, Math.max(mn, cur + d))); saveDraft(); render(); return;
    }
    var a = b.getAttribute("data-act"); if (!a) { if (b.id === "publish") publish(); return; }
    var si = Number(b.getAttribute("data-si")), ii = Number(b.getAttribute("data-ii"));
    if (a === "item-up") move(state.sections[si].items, ii, -1);
    else if (a === "item-down") move(state.sections[si].items, ii, 1);
    else if (a === "item-del") { if (!confirmDel(b)) return; state.sections[si].items.splice(ii, 1); }
    else if (a === "item-add") state.sections[si].items.push({ name: "Nouvelle prestation", note: "", time: "", price: 0 });
    else if (a === "sec-up") move(state.sections, si, -1);
    else if (a === "sec-down") move(state.sections, si, 1);
    else if (a === "sec-del") { if (!confirmDel(b)) return; state.sections.splice(si, 1); }
    else if (a === "sec-add") state.sections.push({ id: "cat" + Date.now(), title: "Nouvelle catégorie", kicker: "", intro: "", items: [{ name: "Nouvelle prestation", note: "", time: "", price: 0 }] });
    else if (a === "scene-up" || a === "scene-down") {
      var id = b.getAttribute("data-id"), arr2 = (state.panoScenes || []).slice(), j = arr2.indexOf(id);
      if (j >= 0) { move(arr2, j, a === "scene-up" ? -1 : 1); state.panoScenes = arr2; }
    }
    else if (a === "ph-del") { var i2 = Number(b.getAttribute("data-i")), p = state.gallery[i2]; state.gallery.splice(i2, 1); delete pending[p]; }
    else if (a === "rc-save") { var v = ($("#rcin").value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); if (v.length < 6) { say("Code trop court.", "err"); return; } rcCode = v; lsSet("qon-rc", v); say("TV associée ✔", "ok"); render(); return; }
    else if (a === "rc-forget") { rcCode = ""; try { localStorage.removeItem("qon-rc"); } catch (e) {} if (es) { es.close(); es = null; esCode = ""; } render(); return; }
    else if (a === "trk-del") { if (!confirmDel(b)) return; var ti = Number(b.getAttribute("data-i")), tp = state.music.tracks[ti]; state.music.tracks.splice(ti, 1); if (tp) delete pendingAudio[tp.src]; }
    else if (a === "export") { copy(JSON.stringify(state, null, 2)); return; }
    else if (a === "import") { importJSON(); return; }
    else if (a === "reset") { resetAll(); return; }
    else return;
    saveDraft(); render();
  });
  // suppression en deux temps (pas de confirm() sur iOS en PWA)
  function confirmDel(b) {
    if (b.getAttribute("data-armed")) return true;
    b.setAttribute("data-armed", "1"); b.textContent = "Confirmer ?";
    setTimeout(function () { if (b.parentNode) { b.removeAttribute("data-armed"); b.textContent = "Supprimer"; } }, 3000);
    return false;
  }
  function copy(text) {
    try { navigator.clipboard.writeText(text).then(function () { say("Contenu copié.", "ok"); }, function () { fallbackCopy(text); }); }
    catch (e) { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); say("Contenu copié.", "ok"); } catch (e) { say("Copie impossible.", "err"); }
    document.body.removeChild(ta);
  }
  function importJSON() {
    var host = $("#view"), box = document.createElement("section");
    box.className = "card";
    box.innerHTML = '<h3>Coller le contenu</h3><textarea id="imp" rows="6" placeholder="{ … }"></textarea><div class="stack" style="margin-top:10px"><button class="btn primary" type="button" id="impok">Importer</button></div>';
    host.appendChild(box);
    $("#impok").addEventListener("click", function () {
      try { state = merge(DEFAULTS, JSON.parse($("#imp").value)); saveDraft(); render(); say("Contenu importé.", "ok"); }
      catch (e) { say("JSON invalide.", "err"); }
    });
  }
  function resetAll() {
    try { localStorage.removeItem("qon-draft"); } catch (e) {}
    pending = {}; dirty = false; state = null; say("");
    fetch("data.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { state = merge(DEFAULTS, j || {}); render(); say("Modifications annulées.", "ok"); })
      .catch(function () { state = merge(DEFAULTS, {}); render(); });
  }

  // ---------- photos ----------
  function resize(file, max, cb) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var r = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * r), h = Math.round(img.height * r);
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url); cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }
  function addPhotos(files) {
    var list = Array.prototype.slice.call(files || []), n = 0;
    if (!list.length) return;
    say("Préparation des photos…");
    (function next() {
      var f = list.shift();
      if (!f) { saveDraft(); render(); say(n + " photo(s) ajoutée(s). Pense à publier.", "ok"); return; }
      resize(f, 1000, function (data) {
        if (data) {
          var path = "photos/" + Date.now().toString(36) + n + ".jpg";
          state.gallery = state.gallery || []; state.gallery.push(path); pending[path] = data; n++;
        }
        next();
      });
    })();
  }

  function addAudio(files) {
    var list = Array.prototype.slice.call(files || []), n = 0;
    if (!list.length) return;
    say("Préparation de la musique…");
    (function next() {
      var f = list.shift();
      if (!f) { saveDraft(); render(); say(n + " morceau(x) ajouté(s). Publie avant de quitter cette page.", "ok"); return; }
      if (f.size > 15 * 1024 * 1024) { say("« " + f.name + " » dépasse 15 Mo, ignoré.", "err"); next(); return; }
      var rd = new FileReader();
      rd.onload = function () {
        var ext = /\.m4a$/i.test(f.name) || /mp4|aac/.test(f.type) ? "m4a" : "mp3";
        var path = "music/" + Date.now().toString(36) + n + "." + ext;
        state.music.tracks.push({ src: path, title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), on: true, _new: true });
        pendingAudio[path] = rd.result; n++; next();
      };
      rd.onerror = function () { next(); };
      rd.readAsDataURL(f);
    })();
  }

  // ---------- publication GitHub ----------
  function b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function api(method, path, body) {
    var url = "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
    if (method === "GET") url += "?ref=" + encodeURIComponent(cfg.branch) + "&t=" + Date.now();
    return fetch(url, {
      method: method,
      headers: { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; }); });
  }
  // Mode test local (serveur de développement sur localhost / réseau Tailscale) : écrit directement les fichiers.
  var isLocal = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.)/.test(location.hostname);
  function putFile(rel, content64, msg) {
    if (isLocal) {
      return fetch("/__save", { method: "POST", body: JSON.stringify({ path: rel, b64: content64 }) })
        .then(function (r) { if (!r.ok) throw new Error("enregistrement local refusé (" + r.status + ")"); });
    }
    var path = cfg.dir + rel;
    return api("GET", path).then(function (g) {
      var body = { message: msg, content: content64, branch: cfg.branch };
      if (g.status === 200 && g.json.sha) body.sha = g.json.sha;
      return api("PUT", path, body);
    }).then(function (r) {
      if (r.status !== 200 && r.status !== 201) throw new Error((r.json && r.json.message) || ("HTTP " + r.status));
    });
  }
  function log(t) { var l = $("#log"); if (l) { l.hidden = false; l.textContent += t + "\n"; } }
  var busy = false;
  function publish() {
    if (busy) return;
    if (!cfg.token && !isLocal) { tab = "publier"; render(); say("Colle d’abord ton jeton GitHub (section Connexion).", "err"); return; }
    busy = true; say("Publication en cours…");
    var paths = Object.keys(pending), apaths = Object.keys(pendingAudio), chain = Promise.resolve(), l = $("#log"); if (l) l.textContent = "";
    apaths.forEach(function (p) {
      chain = chain.then(function () { log("Musique " + p); return putFile(p, pendingAudio[p].split(",")[1], "Ajout musique"); });
    });
    paths.forEach(function (p) {
      chain = chain.then(function () { log("Photo " + p); return putFile(p, pending[p].split(",")[1], "Ajout photo"); });
    });
    chain.then(function () { log("Contenu (data.json)"); return putFile("data.json", b64(JSON.stringify(state, function (k, v) { return k === "_new" ? undefined : v; }, 2) + "\n"), "Mise à jour du contenu"); })
      .then(function () {
        pending = {}; pendingAudio = {}; dirty = false; try { localStorage.removeItem("qon-draft"); } catch (e) {}
        busy = false; log("Terminé. La TV se met à jour dans quelques minutes."); say("Publié ✔ La TV se met à jour dans quelques minutes.", "ok"); render();
      })
      .catch(function (err) { busy = false; log("Erreur : " + err.message); say("Échec de la publication : " + err.message, "err"); });
  }

  init();
})();
