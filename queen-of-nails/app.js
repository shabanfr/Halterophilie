/* Queen of Nails — affichage TV + appli téléphone (PWA). Sans dépendance (hors qr.js). */
(function () {
  var D = window.QON;
  var qs = location.search;
  var isTV = window.innerWidth >= 1100 || /[?&]tv=1/.test(qs);
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

  var slides = [], qrSVG = "";

  // 1. Hero
  slides.push('<section class="slide hero">' +
    '<div class="mark">' + logo() + '</div>' +
    '<h1>Queen <em>of</em> Nails</h1>' +
    '<p>' + D.tagline + '</p>' +
    '<div class="hands">' + nails(isTV ? 1.0 : 0.62) + '</div></section>');

  // 2-4. Prestations
  D.sections.forEach(function (s, i) {
    var rows = s.items.map(function (it) {
      return '<div class="row"><div class="name"><b>' + it.name + '</b><span>' + (it.note || "") + '</span></div>' +
        (it.time ? '<span class="time">' + it.time + '</span>' : "") + money(it) + "</div>";
    }).join("");
    slides.push('<section class="slide menu" data-id="' + s.id + '">' + top() +
      '<div class="left"><div class="kicker">' + s.kicker + '</div><h2>' + titleHTML(s.title) + '</h2>' +
      '<p class="intro">' + s.intro + '</p><div class="nails-wrap">' + nails(0.9) + '</div></div>' +
      '<div class="right"><div class="list">' + rows + '</div></div></section>');
  });

  // 5. Réservation / installation
  var c = D.contact || {};
  var lines = "";
  if (c.phone) lines += "<li><b>Tél.</b>" + c.phone + "</li>";
  if (c.instagram) lines += "<li><b>Instagram</b>" + c.instagram + "</li>";
  if (c.address) lines += "<li><b>Adresse</b>" + c.address + "</li>";
  if (c.hours) lines += "<li><b>Horaires</b>" + c.hours + "</li>";
  slides.push('<section class="slide book">' + top() +
    '<div class="qr" id="qr"></div>' +
    '<div class="txt"><div class="kicker">Garde-nous dans ta poche</div>' +
    '<h2>Scanne &amp; <em>retrouve</em> nos tarifs</h2>' +
    '<p>Ouvre l’appareil photo de ton téléphone, vise le code, puis « Sur l’écran d’accueil ».</p>' +
    (lines ? "<ul>" + lines + "</ul>" : "") +
    '<div class="install"><b>iPhone :</b> bouton Partager, puis « Sur l’écran d’accueil ».<br><b>Android :</b> menu ⋮, puis « Installer l’application ».</div>' +
    '</div></section>');

  stage.innerHTML = slides.join("");
  var els = stage.getElementsByClassName("slide");

  // QR code vers l'adresse de l'appli
  try {
    var url = location.origin + location.pathname.replace(/index\.html$/, "");
    var qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    var box = document.getElementById("qr");
    qrSVG = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
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

  function runBar() {
    bar.className = "";
    void bar.offsetWidth;
    bar.firstChild.style.animationDuration = dur + "ms";
    bar.className = "run" + (paused ? " paused" : "");
  }
  function show(i) {
    i = (i + els.length) % els.length;
    if (cur >= 0) { els[cur].classList.remove("on"); dotEls[cur].classList.remove("on"); }
    cur = i;
    els[cur].classList.add("on");
    dotEls[cur].classList.add("on");
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    runBar();
    if (!paused) timer = setTimeout(function () { show(cur + 1); }, dur);
  }
  function togglePause() {
    paused = !paused;
    if (paused) { clearTimeout(timer); bar.className = "run paused"; } else { schedule(); }
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
  D.sections.forEach(function (s) { s.items.forEach(function (it) { flat.push({ kicker: s.kicker, it: it }); }); });
  function svcCard(n) {
    var o = flat[n % flat.length];
    return '<div class="pc svc"><small>' + o.kicker + '</small><b>' + o.it.name + '</b><span>' + (o.it.from ? "dès " : "") + o.it.price + ' €</span></div>';
  }
  var Q = D.quotes && D.quotes.length ? D.quotes : [D.tagline];
  function quoteCard(n) { return '<div class="pc quote"><p>« ' + Q[n % Q.length] + ' »</p></div>'; }
  function brandCard() { return '<div class="pc brand">' + logo() + "<b>" + D.brand + "</b><small>" + D.tagline + "</small></div>"; }
  function rowHTML(off) {
    var out = [], g = D.gallery || [], gi = 0, n = 0;
    for (var i = 0; i < 10; i++) {
      var t = (i + off) % 5;
      if (t === 0) out.push(g.length ? photoCard(g[gi++ % g.length]) : artCard(i + off));
      else if (t === 1) out.push(svcCard(i + off));
      else if (t === 2) out.push(artCard(i + off + 1));
      else if (t === 3) out.push(quoteCard(i * 3 + off));
      else out.push(i % 2 ? brandCard() : svcCard(i + off + 3));
    }
    var one = out.join("");
    return '<div class="prow">' + one + one + "</div>";
  }
  var pano = document.createElement("section");
  pano.id = "pano";
  pano.innerHTML = top() + '<div class="rows">' + rowHTML(0) + rowHTML(2) + "</div>" +
    (qrSVG ? '<div class="pqr">' + qrSVG + "<span>Nos tarifs</span></div>" : "");
  document.body.appendChild(pano);

  var mode = "menu", idleT = null, idleMs = (D.panoramaAfterMinutes || 3) * 60000;
  function enterPano() {
    if (mode === "pano") return;
    mode = "pano";
    clearTimeout(timer);
    bar.className = "";
    document.body.classList.add("is-pano");
    pano.classList.add("on");
  }
  function exitPano() {
    mode = "menu";
    document.body.classList.remove("is-pano");
    pano.classList.remove("on");
    show(0);
  }
  function bump() { clearTimeout(idleT); idleT = setTimeout(enterPano, idleMs); }
  window.addEventListener("keydown", function (e) {
    var k = e.keyCode;
    if (mode === "pano") { e.preventDefault(); exitPano(); bump(); return; }
    bump();
    if (k === 39 || k === 40 || k === 34 || k === 87) { e.preventDefault(); show(cur + 1); }
    else if (k === 37 || k === 38 || k === 33) { e.preventDefault(); show(cur - 1); }
    else if (k === 13 || k === 32 || k === 179 || k === 23) { e.preventDefault(); togglePause(); }
  });
  // Rechargement quotidien (récupère les mises à jour du contenu)
  setTimeout(function () { location.reload(); }, 6 * 3600 * 1000);

  if ("serviceWorker" in navigator) try { navigator.serviceWorker.register("sw.js"); } catch (e) {}
  var start = /[?&]slide=(\d+)/.exec(qs);
  show(start ? parseInt(start[1], 10) : 0);
  bump();
  if (/[?&]pano=1/.test(qs)) enterPano();
  if (/[?&]still=1/.test(qs)) { paused = true; clearTimeout(timer); bar.className = "run paused"; }
})();
