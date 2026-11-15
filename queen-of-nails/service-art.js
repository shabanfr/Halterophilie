/* Queen of Nails — illustrations animées des prestations (SVG inline, sans dépendance).
   API : window.QONArt.keys                -> ["manucure","pose","art","pedicure","soin","depose","defaut"]
         window.QONArt.match(texte)        -> clé devinée depuis un titre / id de catégorie
         window.QONArt.scene(clé, opts)    -> "<div class=\"sa-scene sa-<clé>\"><svg…></svg></div>"
           opts (facultatif) : color "#hex" (teinte du vernis), label (texte aria-label), cls (classe en plus)
   Styles et animations : service-art.css (classes sa-*, ids SVG sa<n>…). viewBox 560×400 (7:5). */
(function () {
  "use strict";

  var KEYS = ["manucure", "pose", "art", "pedicure", "soin", "depose", "defaut"];
  var W = 560, H = 400, uid = 0;

  /* ---------- utilitaires ---------- */
  function n(v) { return Math.round(v * 10) / 10; }
  function hex(c) {
    c = String(c || "").replace("#", "");
    if (c.length === 3) { c = c.charAt(0) + c.charAt(0) + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2); }
    if (!/^[0-9a-fA-F]{6}$/.test(c)) { return null; }
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }
  function mix(a, b, t) {
    var x = hex(a) || [209, 139, 148], y = hex(b) || [255, 255, 255], i, s = "#", v;
    for (i = 0; i < 3; i++) { v = Math.round(x[i] + (y[i] - x[i]) * t).toString(16); s += v.length < 2 ? "0" + v : v; }
    return s;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function stops(list) {
    var s = "", i;
    for (i = 0; i < list.length; i++) {
      s += "<stop offset=\"" + list[i][0] + "\" stop-color=\"" + list[i][1] + "\"" +
        (list[i].length > 2 ? " stop-opacity=\"" + list[i][2] + "\"" : "") + "/>";
    }
    return s;
  }
  function lin(id, x1, y1, x2, y2, list) {
    return "<linearGradient id=\"" + id + "\" x1=\"" + x1 + "\" y1=\"" + y1 + "\" x2=\"" + x2 + "\" y2=\"" + y2 + "\">" + stops(list) + "</linearGradient>";
  }

  /* Contour d'ongle : centré en x = 0, pointe en y = 0, cuticule en y = L, demi-largeur a. */
  function nailD(a, L) {
    return "M" + n(-a) + "," + n(L * 0.5) + " C" + n(-a) + "," + n(L * 0.18) + " " + n(-a * 0.5) + ",0 0,0 C" + n(a * 0.5) + ",0 " + n(a) + "," + n(L * 0.18) + " " + n(a) + "," + n(L * 0.5) +
      " L" + n(a) + "," + n(L - a * 0.75) + " C" + n(a) + "," + n(L - a * 0.15) + " " + n(a * 0.55) + "," + n(L) + " 0," + n(L) +
      " C" + n(-a * 0.55) + "," + n(L) + " " + n(-a) + "," + n(L - a * 0.15) + " " + n(-a) + "," + n(L - a * 0.75) + "Z";
  }
  function glossD(a, L) {
    return "M" + n(-a * 0.52) + "," + n(L * 0.74) + " V" + n(L * 0.42) + " Q" + n(-a * 0.52) + "," + n(L * 0.2) + " " + n(-a * 0.18) + "," + n(L * 0.12);
  }
  function gloss(a, L, cls) {
    return "<path" + (cls ? " class=\"" + cls + "\"" : "") + " d=\"" + glossD(a, L) + "\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\"" + (a > 40 ? ".62" : ".78") + "\" stroke-width=\"" + n(Math.min(9, Math.max(2.4, a * 0.2))) + "\" stroke-linecap=\"round\"/>";
  }

  /* Contexte de scène : identifiants uniques + dégradés communs. */
  function ctx(opts) {
    var id = "sa" + (++uid), color = hex(opts.color) ? opts.color : "#D98F96";
    if (color.charAt(0) !== "#") { color = "#" + color; }
    var c = { id: id, color: color, k: 0, defs: "" };
    c.defs +=
      lin(id + "k", 0, 0, 0, 1, [[0, "#FBE2D7"], [0.5, "#F3CFC0"], [0.84, "#EEC4B3", 0.9], [1, "#EEC4B3", 0]]) +
      lin(id + "e", 0, 0, 0, 1, [[0, "#D9A593", 0.75], [0.7, "#D9A593", 0.45], [1, "#D9A593", 0]]) +
      lin(id + "n", 0, 0, 0, 1, [[0, "#FFF3EF"], [1, "#F3D0C7"]]) +
      lin(id + "r", 0, 0, 1, 1, [[0, mix(color, "#ffffff", 0.42)], [0.5, color], [1, mix(color, "#5A1830", 0.36)]]) +
      lin(id + "g", 0, 0, 1, 1, [[0, "#EDD3AE"], [1, "#B98F66"]]) +
      "<radialGradient id=\"" + id + "b\" cx=\".5\" cy=\".5\" r=\".5\">" + stops([[0, "#FFFFFF", 0.9], [0.6, "#FFFFFF", 0.5], [1, "#FFFFFF", 0]]) + "</radialGradient>";
    return c;
  }
  function url(c, s) { return "url(#" + c.id + s + ")"; }
  function backdrop(c) {
    return "<ellipse cx=\"280\" cy=\"206\" rx=\"272\" ry=\"192\" fill=\"" + url(c, "b") + "\"/>";
  }

  /* Doigt vu de dessus (pointe en haut), fondu vers la base.
     o : base, a, L, ext, fill ("n" naturel | "r" verni | couleur), inner (HTML rogné dans l'ongle), over (HTML par-dessus), bare */
  function finger(c, x, tip, w, o) {
    o = o || {};
    var r = w / 2, base = o.base || H, a = o.a || r - 6, L = o.L || w * 1.22, ext = o.ext == null ? 10 : o.ext;
    var fill = o.fill || "n", f = fill.charAt(0) === "#" ? fill : url(c, fill), s, cid;
    s = "<path d=\"M" + n(x - r) + "," + base + " L" + n(x - r) + "," + n(tip + r) + " A" + n(r) + "," + n(r) + " 0 0 1 " + n(x + r) + "," + n(tip + r) + " L" + n(x + r) + "," + base +
      "\" fill=\"" + url(c, "k") + "\" stroke=\"" + url(c, "e") + "\" stroke-width=\"1.6\"/>";
    if (o.bare) { return s; }
    s += "<g transform=\"translate(" + n(x) + "," + n(tip - ext) + ")\">" +
      "<path d=\"" + nailD(a, L) + "\" fill=\"" + f + "\"/>";
    if (o.inner) {
      cid = c.id + "c" + (++c.k);
      c.defs += "<clipPath id=\"" + cid + "\"><path d=\"" + nailD(a, L) + "\"/></clipPath>";
      s += "<g clip-path=\"url(#" + cid + ")\">" + o.inner + "</g>";
    }
    s += (o.noGloss ? "" : gloss(a, L)) + (o.over || "") +
      "<path d=\"" + nailD(a, L) + "\" fill=\"none\" stroke=\"#8E4A5C\" stroke-opacity=\".34\" stroke-width=\"1.2\"/></g>";
    return s;
  }

  /* Étincelle à 4 branches (centre = origine locale). */
  function spark(x, y, s, cls, fill) {
    return "<g transform=\"translate(" + x + "," + y + ")\"><path class=\"sa-tw" + (cls ? " " + cls : "") + "\" d=\"M0," + (-s) + " Q0,0 " + s + ",0 Q0,0 0," + s + " Q0,0 " + (-s) + ",0 Q0,0 0," + (-s) + "Z\" fill=\"" + (fill || "#C9A06F") + "\"/></g>";
  }

  /* Pinceau de vernis (pointe des poils = origine, manche vers le haut-droite). */
  function polishBrush(c) {
    return "<g transform=\"rotate(30)\">" +
      "<rect x=\"-2.2\" y=\"-60\" width=\"4.4\" height=\"36\" fill=\"#D9C3BA\"/>" +
      "<path d=\"M-6.5,-27 L6.5,-27 L4.5,-3 Q0,3 -4.5,-3Z\" fill=\"" + mix(c.color, "#5A1830", 0.12) + "\"/>" +
      "<path d=\"M-2.5,-25 L-1.6,-4\" stroke=\"#fff\" stroke-opacity=\".6\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>" +
      "<rect x=\"-14\" y=\"-134\" width=\"28\" height=\"76\" rx=\"10\" fill=\"" + url(c, "g") + "\"/>" +
      "<rect x=\"-14\" y=\"-72\" width=\"28\" height=\"14\" rx=\"5\" fill=\"#A67C55\" opacity=\".55\"/>" +
      "<path d=\"M-7,-124 V-82\" stroke=\"#fff\" stroke-opacity=\".65\" stroke-width=\"3\" stroke-linecap=\"round\"/></g>";
  }
  /* Pinceau fin de nail art. */
  function linerBrush(c) {
    return "<g transform=\"rotate(34)\">" +
      "<path d=\"M-3,-22 L3,-22 L0,0Z\" fill=\"#3B2229\"/>" +
      "<rect x=\"-3.8\" y=\"-46\" width=\"7.6\" height=\"25\" rx=\"1.5\" fill=\"" + url(c, "g") + "\"/>" +
      "<path d=\"M-4.4,-46 L4.4,-46 L2.6,-172 Q0,-179 -2.6,-172Z\" fill=\"#A8566B\"/>" +
      "<path d=\"M-1.6,-52 L-1,-158\" stroke=\"#fff\" stroke-opacity=\".45\" stroke-width=\"1.6\" stroke-linecap=\"round\"/></g>";
  }

  /* ---------- scènes ---------- */
  var SCENES = {};

  /* Manucure : lime, puis pinceau qui pose un trait de vernis glossy. */
  SCENES.manucure = function (c) {
    var xs = [170, 246, 322, 398], tips = [152, 118, 128, 172], w = 62, a = 25, L = 78, i, s = backdrop(c);
    for (i = 0; i < 4; i++) {
      if (i === 1) {
        s += finger(c, xs[i], tips[i], w, {
          a: a, L: L, ext: 12,
          inner: "<g transform=\"translate(0," + L + ")\"><rect class=\"sa-m-paint\" x=\"" + (-a) + "\" y=\"" + (-L) + "\" width=\"" + (2 * a) + "\" height=\"" + (L + 20) + "\" rx=\"" + (a - 3) + "\" fill=\"" + url(c, "r") + "\"/></g>",
          over: gloss(a, L, "sa-m-gl")
        });
      } else {
        s += finger(c, xs[i], tips[i], w, { a: a, L: L, ext: 12, fill: i === 0 ? "r" : "n" });
      }
    }
    /* poussière de limage */
    s += "<g transform=\"translate(246,104)\"><circle class=\"sa-m-dust\" cx=\"-20\" cy=\"2\" r=\"2.4\" fill=\"#D9A593\"/>" +
      "<circle class=\"sa-m-dust sa-d2\" cx=\"8\" cy=\"0\" r=\"2\" fill=\"#D18B94\"/><circle class=\"sa-m-dust sa-d3\" cx=\"26\" cy=\"4\" r=\"2.6\" fill=\"#D9A593\"/></g>";
    /* lime */
    s += "<g transform=\"translate(246,105) rotate(-16)\"><g class=\"sa-m-file\">" +
      "<rect x=\"-70\" y=\"-21\" width=\"200\" height=\"20\" rx=\"10\" fill=\"" + url(c, "r") + "\"/>" +
      "<rect x=\"-62\" y=\"-17\" width=\"184\" height=\"5\" rx=\"2.5\" fill=\"#fff\" opacity=\".45\"/>" +
      "<rect x=\"-70\" y=\"-21\" width=\"200\" height=\"20\" rx=\"10\" fill=\"none\" stroke=\"" + url(c, "g") + "\" stroke-width=\"2\"/></g></g>";
    /* pinceau */
    s += "<g transform=\"translate(246,178)\"><g class=\"sa-m-brush\">" + polishBrush(c) + "</g></g>";
    s += spark(206, 96, 13, "sa-m-sp") + spark(292, 84, 9, "sa-m-sp sa-d2", "#D18B94") + spark(284, 176, 7, "sa-m-sp sa-d3");
    return s;
  };

  /* Pose gel / capsules : les capsules se posent, la lampe UV s'allume. */
  SCENES.pose = function (c) {
    var xs = [176, 246, 316, 386], tips = [236, 208, 216, 248], w = 58, a = 23, L = 70, CL = 104, i, s = backdrop(c), id = c.id;
    c.defs += "<radialGradient id=\"" + id + "h\" cx=\".5\" cy=\".5\" r=\".5\">" + stops([[0, "#C39AFF", 0.9], [0.35, "#DDA0EC", 0.55], [0.7, "#F5B5D2", 0.22], [1, "#F5B5D2", 0]]) + "</radialGradient>" +
      lin(id + "l", 0, 0, 0, 1, [[0, "#FFFFFF"], [0.6, "#FBEDEA"], [1, "#EFD2CE"]]) +
      lin(id + "v", 0, 0, 1, 0, [[0, "#D7A8FF"], [0.5, "#F4B6E4"], [1, "#D7A8FF"]]) +
      "<clipPath id=\"" + id + "q\"><rect x=\"0\" y=\"128\" width=\"560\" height=\"290\"/></clipPath>";
    /* halo */
    s += "<g clip-path=\"url(#" + id + "q)\"><g transform=\"translate(280,128)\"><ellipse class=\"sa-p-halo\" cx=\"0\" cy=\"-6\" rx=\"200\" ry=\"236\" fill=\"" + url(c, "h") + "\"/></g></g>";
    for (i = 0; i < 4; i++) { s += finger(c, xs[i], tips[i], w, { a: a, L: L }); }
    /* capsules */
    s += "<g class=\"sa-p-caps\">";
    for (i = 0; i < 4; i++) {
      s += "<g transform=\"translate(" + xs[i] + "," + (tips[i] - 10 - (CL - L)) + ")\"><g class=\"sa-p-cap sa-p-c" + (i + 1) + "\">" +
        "<path d=\"" + nailD(a, CL) + "\" fill=\"#FFFFFF\" fill-opacity=\".62\" stroke=\"#fff\" stroke-width=\"1.4\"/>" +
        "<path class=\"sa-p-gel\" d=\"" + nailD(a, CL) + "\" fill=\"" + url(c, "r") + "\"/>" +
        gloss(a, CL) +
        "<path d=\"" + nailD(a, CL) + "\" fill=\"none\" stroke=\"#8E4A5C\" stroke-opacity=\".3\" stroke-width=\"1.1\"/></g></g>";
    }
    s += "</g>";
    /* lampe */
    s += "<path d=\"M118,112 C118,52 190,20 280,20 C370,20 442,52 442,112 Q442,128 426,128 H134 Q118,128 118,112Z\" fill=\"" + url(c, "l") + "\" stroke=\"#D18B94\" stroke-opacity=\".4\" stroke-width=\"1.6\"/>" +
      "<path d=\"M150,98 C156,62 206,40 262,36\" fill=\"none\" stroke=\"#fff\" stroke-width=\"6\" stroke-linecap=\"round\" opacity=\".9\"/>" +
      "<rect x=\"146\" y=\"114\" width=\"268\" height=\"9\" rx=\"4.5\" fill=\"#E8D3DA\"/>" +
      "<rect class=\"sa-p-led\" x=\"146\" y=\"114\" width=\"268\" height=\"9\" rx=\"4.5\" fill=\"" + url(c, "v") + "\"/>" +
      "<circle cx=\"280\" cy=\"70\" r=\"9\" fill=\"none\" stroke=\"" + url(c, "g") + "\" stroke-width=\"2.4\"/>" +
      "<circle class=\"sa-p-led\" cx=\"280\" cy=\"70\" r=\"4\" fill=\"#C9A0FF\"/>";
    s += spark(118, 196, 11, "sa-p-sp") + spark(452, 178, 13, "sa-p-sp sa-d2", "#C39BE8") + spark(470, 262, 8, "sa-p-sp sa-d3");
    return s;
  };

  /* Nail art : pinceau fin, trait doré, fleur, points. */
  SCENES.art = function (c) {
    var a = 78, L = 232, x = 280, tip = 106, ext = 34, i, s = backdrop(c), inner, fx = 8, fy = 98;
    c.defs += lin(c.id + "a", 0, 0, 0, 1, [[0, "#FBE3DD"], [1, "#EDC3BC"]]);
    inner = "<g class=\"sa-a-all\">" +
      "<path class=\"sa-a-line\" d=\"M-56,198 C-12,180 34,172 56,126\" fill=\"none\" stroke=\"" + url(c, "g") + "\" stroke-width=\"5\" stroke-linecap=\"round\"/>" +
      "<path class=\"sa-a-line sa-a-line2\" d=\"M-44,214 C-6,200 30,196 50,166\" fill=\"none\" stroke=\"#C9A06F\" stroke-opacity=\".55\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>";
    for (i = 0; i < 5; i++) {
      inner += "<g transform=\"translate(" + fx + "," + fy + ") rotate(" + (i * 72) + ")\"><ellipse class=\"sa-a-pop sa-a-p" + (i + 1) + "\" cx=\"0\" cy=\"-19\" rx=\"11.5\" ry=\"17\" fill=\"#FFFFFF\" stroke=\"#D18B94\" stroke-opacity=\".55\" stroke-width=\"1.2\"/></g>";
    }
    inner += "<g transform=\"translate(" + fx + "," + fy + ")\"><circle class=\"sa-a-pop sa-a-p6\" r=\"7.5\" fill=\"" + url(c, "g") + "\"/></g>" +
      "<g transform=\"translate(20,38)\"><circle class=\"sa-a-pop sa-a-p7\" r=\"6\" fill=\"#A8566B\"/></g>" +
      "<g transform=\"translate(39,52)\"><circle class=\"sa-a-pop sa-a-p8\" r=\"4.8\" fill=\"#C9A06F\"/></g>" +
      "<g transform=\"translate(52,72)\"><circle class=\"sa-a-pop sa-a-p9\" r=\"3.6\" fill=\"#A8566B\"/></g></g>";
    s += finger(c, x, tip, 188, { a: a, L: L, ext: ext, fill: "a", inner: inner });
    s += "<g transform=\"translate(" + x + "," + (tip - ext) + ")\"><g class=\"sa-a-brush\">" + linerBrush(c) + "</g></g>";
    s += spark(152, 120, 14, "sa-a-sp") + spark(410, 92, 10, "sa-a-sp sa-d2", "#D18B94") + spark(420, 250, 12, "sa-a-sp sa-d3") + spark(138, 262, 8, "sa-a-sp sa-d2", "#D18B94");
    return s;
  };

  /* Pédicure : pied, bain, pétales, bulles. */
  SCENES.pedicure = function (c) {
    var id = c.id, s = backdrop(c), i, t, nw, nh;
    var toes = [[214, 130, 31, 42, -6], [270, 122, 20.5, 35, -2], [312, 136, 18.5, 32, 5], [349, 157, 17, 28, 11], [380, 184, 15.5, 24, 18]];
    var petal = "M0,-15 C11,-11 13,5 0,15 C-13,5 -11,-11 0,-15Z";
    c.defs += lin(id + "f", 0, 0, 0, 1, [[0, "#FBE2D7"], [0.45, "#F3CFC0"], [0.8, "#EEC4B3", 0.85], [1, "#EEC4B3", 0.25]]) +
      lin(id + "w", 0, 0, 0, 1, [[0, "#F3BFC6", 0.7], [1, "#E9A9B4", 0.55]]) +
      lin(id + "x", 0, 0, 0, 1, [[0, "#FFFFFF", 0.85], [1, "#FBE4E2", 0.6]]) +
      lin(id + "o", 0, 0, 0, 1, [[0, "#FFFFFF", 0.0], [1, "#FFFFFF", 0.95]]) +
      "<clipPath id=\"" + id + "q\"><path d=\"M52,262 H508 V304 C508,372 420,394 280,394 C140,394 52,372 52,304Z\"/></clipPath>";
    /* pétales qui tombent */
    s += "<g transform=\"translate(104,60)\"><path class=\"sa-f-fall\" d=\"" + petal + "\" fill=\"" + url(c, "r") + "\"/></g>" +
      "<g transform=\"translate(462,40)\"><path class=\"sa-f-fall sa-d2\" d=\"" + petal + "\" fill=\"#EFB7BE\"/></g>";
    /* pied */
    for (i = 0; i < toes.length; i++) {
      t = toes[i];
      s += "<ellipse transform=\"translate(" + t[0] + "," + t[1] + ") rotate(" + t[4] + ")\" rx=\"" + t[2] + "\" ry=\"" + t[3] + "\" fill=\"#FAE0D4\" stroke=\"#D9A593\" stroke-opacity=\".6\" stroke-width=\"1.4\"/>";
    }
    s += "<path d=\"M226,400 C214,340 178,262 189,178 C194,154 232,146 258,150 C292,152 322,162 346,178 C370,192 392,208 398,226 C404,268 364,332 358,400Z\" fill=\"" + url(c, "f") + "\"/>" +
      "<path d=\"M226,400 C214,340 178,262 189,178 M398,226 C404,268 364,332 358,400\" fill=\"none\" stroke=\"#D9A593\" stroke-opacity=\".55\" stroke-width=\"1.6\"/>";
    for (i = 0; i < toes.length; i++) {
      t = toes[i]; nw = t[2] * 1.26; nh = t[2] * 1.2;
      s += "<g transform=\"translate(" + t[0] + "," + t[1] + ") rotate(" + t[4] + ")\">" +
        "<rect x=\"" + n(-nw / 2) + "\" y=\"" + n(-t[3] * 0.72) + "\" width=\"" + n(nw) + "\" height=\"" + n(nh) + "\" rx=\"" + n(nw * 0.36) + "\" fill=\"" + url(c, "r") + "\" stroke=\"#8E4A5C\" stroke-opacity=\".3\" stroke-width=\"1\"/>" +
        "<path d=\"M" + n(-nw * 0.26) + "," + n(-t[3] * 0.72 + nh * 0.72) + " V" + n(-t[3] * 0.72 + nh * 0.34) + "\" stroke=\"#fff\" stroke-opacity=\".8\" stroke-width=\"" + n(Math.max(2, nw * 0.11)) + "\" stroke-linecap=\"round\"/>" +
        "<rect class=\"sa-f-shine sa-f-s" + (i + 1) + "\" x=\"" + n(-nw / 2) + "\" y=\"" + n(-t[3] * 0.72) + "\" width=\"" + n(nw) + "\" height=\"" + n(nh) + "\" rx=\"" + n(nw * 0.36) + "\" fill=\"#fff\"/></g>";
    }
    /* eau */
    s += "<g clip-path=\"url(#" + id + "q)\">" +
      "<path class=\"sa-f-wave\" d=\"M-160,304 q40,-16 80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 V410 H-160Z\" fill=\"" + url(c, "w") + "\"/>" +
      "<path class=\"sa-f-wave sa-f-wave2\" d=\"M-160,326 q40,14 80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0 V410 H-160Z\" fill=\"" + url(c, "x") + "\"/></g>" +
      "<path d=\"M52,280 V304 C52,372 140,394 280,394 C420,394 508,372 508,304 V280\" fill=\"none\" stroke=\"#fff\" stroke-width=\"3.2\" stroke-linecap=\"round\"/>" +
      "<path d=\"M66,318 C74,360 130,380 220,386\" fill=\"none\" stroke=\"" + url(c, "g") + "\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\".7\"/>";
    /* pétales flottants */
    s += "<g transform=\"translate(112,306) rotate(62)\"><path class=\"sa-f-bob\" d=\"" + petal + "\" fill=\"" + url(c, "r") + "\"/></g>" +
      "<g transform=\"translate(152,338) rotate(-58)\"><path class=\"sa-f-bob sa-d2\" d=\"" + petal + "\" fill=\"#EFB7BE\"/></g>" +
      "<g transform=\"translate(436,312) rotate(-70)\"><path class=\"sa-f-bob sa-d3\" d=\"" + petal + "\" fill=\"" + url(c, "r") + "\"/></g>" +
      "<g transform=\"translate(410,346) rotate(48)\"><path class=\"sa-f-bob\" d=\"" + petal + "\" fill=\"#F6CDD0\"/></g>";
    /* bulles */
    var bub = [[92, 286, 9, ""], [136, 282, 6, " sa-d2"], [448, 284, 8, " sa-d3"], [484, 290, 5.5, " sa-d4"], [120, 290, 4.5, " sa-d5"], [466, 280, 4, " sa-d2"]];
    for (i = 0; i < bub.length; i++) {
      s += "<g transform=\"translate(" + bub[i][0] + "," + bub[i][1] + ")\"><g class=\"sa-f-bub" + bub[i][3] + "\"><circle r=\"" + bub[i][2] + "\" fill=\"#fff\" fill-opacity=\".55\" stroke=\"#fff\" stroke-width=\"1.6\"/>" +
        "<circle cx=\"" + n(-bub[i][2] * 0.3) + "\" cy=\"" + n(-bub[i][2] * 0.3) + "\" r=\"" + n(bub[i][2] * 0.22) + "\" fill=\"#fff\"/></g></g>";
    }
    s += spark(170, 96, 11, "sa-f-sp") + spark(424, 130, 13, "sa-f-sp sa-d3") + spark(300, 74, 8, "sa-f-sp sa-d2", "#D18B94");
    return s;
  };

  /* Soin / paraffine : la main plonge dans la coupe, vapeur, goutte. */
  SCENES.soin = function (c) {
    var id = c.id, s = backdrop(c), xs = [-81, -27, 27, 81], tips = [16, -8, 0, 26], w = 48, i, hand = "", coat = "", r = w / 2;
    c.defs += lin(id + "l", 0, 0, 0, 1, [[0, "#FFFFFF"], [0.55, "#FAE9E5"], [1, "#EDCBC7"]]) +
      "<clipPath id=\"" + id + "q\"><rect x=\"0\" y=\"-140\" width=\"560\" height=\"429\"/></clipPath>";
    var steam = "M0,0 C-12,-14 12,-28 0,-42 C-12,-56 12,-70 0,-84";
    s += "<g transform=\"translate(128,236)\"><path class=\"sa-s-steam\" d=\"" + steam + "\" fill=\"none\" stroke=\"#D18B94\" stroke-opacity=\".5\" stroke-width=\"5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(432,240)\"><path class=\"sa-s-steam sa-d2\" d=\"" + steam + "\" fill=\"none\" stroke=\"#D18B94\" stroke-opacity=\".5\" stroke-width=\"5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(470,222) scale(.75)\"><path class=\"sa-s-steam sa-d3\" d=\"" + steam + "\" fill=\"none\" stroke=\"#C9A06F\" stroke-opacity=\".5\" stroke-width=\"5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(92,224) scale(.75)\"><path class=\"sa-s-steam sa-d4\" d=\"" + steam + "\" fill=\"none\" stroke=\"#C9A06F\" stroke-opacity=\".5\" stroke-width=\"5\" stroke-linecap=\"round\"/></g>";
    /* coupe */
    s += "<ellipse cx=\"280\" cy=\"386\" rx=\"120\" ry=\"9\" fill=\"#A8566B\" opacity=\".12\"/>" +
      "<path d=\"M112,288 C114,362 188,388 280,388 C372,388 446,362 448,288Z\" fill=\"" + url(c, "l") + "\" stroke=\"#D18B94\" stroke-opacity=\".4\" stroke-width=\"1.6\"/>" +
      "<path d=\"M136,318 C150,356 200,374 262,378\" fill=\"none\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\" opacity=\".9\"/>" +
      "<ellipse cx=\"280\" cy=\"288\" rx=\"168\" ry=\"27\" fill=\"#F6DCD6\" stroke=\"" + url(c, "g") + "\" stroke-width=\"2.6\"/>" +
      "<ellipse cx=\"280\" cy=\"290\" rx=\"154\" ry=\"21\" fill=\"#FFF8F1\"/>" +
      "<path d=\"M176,292 C214,280 250,300 290,290 C326,281 356,296 388,288\" fill=\"none\" stroke=\"#F1D6CC\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>";
    /* main (pointes vers le bas) */
    for (i = 0; i < 4; i++) {
      hand += finger(c, xs[i], tips[i], w, { a: 18, L: 52, ext: 4, base: 186, fill: "r" });
      coat += "<path d=\"M" + (xs[i] - r - 1) + "," + (tips[i] + 78) + " L" + (xs[i] - r - 1) + "," + (tips[i] + r) + " A" + (r + 1) + "," + (r + 1) + " 0 0 1 " + (xs[i] + r + 1) + "," + (tips[i] + r) + " L" + (xs[i] + r + 1) + "," + (tips[i] + 78) +
        " Q" + xs[i] + "," + (tips[i] + 66) + " " + (xs[i] - r - 1) + "," + (tips[i] + 78) + "Z\" fill=\"#FFF9F3\" fill-opacity=\".93\" stroke=\"#EDD2C8\" stroke-width=\"1.2\"/>" +
        "<path d=\"M" + (xs[i] - r * 0.5) + "," + (tips[i] + 62) + " V" + (tips[i] + 22) + "\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\"/>";
    }
    s += "<g clip-path=\"url(#" + id + "q)\"><g class=\"sa-s-hand\"><g transform=\"translate(280,236) scale(1,-1)\">" + hand + "<g class=\"sa-s-coat\">" + coat + "</g></g></g></g>";
    /* ondes à la surface */
    s += "<g transform=\"translate(280,290)\"><ellipse class=\"sa-s-rip\" rx=\"120\" ry=\"15\" fill=\"none\" stroke=\"#E8C4BA\" stroke-width=\"2.2\"/></g>" +
      "<g transform=\"translate(280,290)\"><ellipse class=\"sa-s-rip sa-s-rip2\" rx=\"120\" ry=\"15\" fill=\"none\" stroke=\"#E8C4BA\" stroke-width=\"2.2\"/></g>" +
      "<g transform=\"translate(253,292)\"><ellipse class=\"sa-s-rip3\" rx=\"30\" ry=\"6\" fill=\"none\" stroke=\"#E2B9AE\" stroke-width=\"2\"/></g>";
    /* goutte */
    s += "<g transform=\"translate(253,196)\"><path class=\"sa-s-drop\" d=\"M0,-11 C5,-3 7,1 7,5 A7,7 0 1 1 -7,5 C-7,1 -5,-3 0,-11Z\" fill=\"#FFF9F3\" stroke=\"#E6C6BB\" stroke-width=\"1.3\"/></g>";
    s += spark(396, 150, 12, "sa-s-sp") + spark(160, 132, 9, "sa-s-sp sa-d2", "#D18B94");
    return s;
  };

  /* Dépose : coton imbibé, vernis qui se dissout en volutes. */
  SCENES.depose = function (c) {
    var a = 78, L = 232, x = 280, tip = 106, ext = 34, s = backdrop(c), i, cot = "", sh = "", inner;
    var P = [[-44, 4, 30], [0, -14, 38], [44, 2, 31], [-22, 22, 29], [24, 22, 30], [0, 4, 36]];
    for (i = 0; i < P.length; i++) {
      sh += "<circle cx=\"" + P[i][0] + "\" cy=\"" + (P[i][1] + 6) + "\" r=\"" + (P[i][2] + 1) + "\" fill=\"#E7CBC4\"/>";
      cot += "<circle cx=\"" + P[i][0] + "\" cy=\"" + P[i][1] + "\" r=\"" + P[i][2] + "\" fill=\"#FFFDFB\"/>";
    }
    inner = "<rect class=\"sa-d-pol\" x=\"" + (-a) + "\" y=\"0\" width=\"" + (2 * a) + "\" height=\"" + L + "\" fill=\"" + url(c, "r") + "\"/>";
    s += finger(c, x, tip, 188, { a: a, L: L, ext: ext, inner: inner });
    var vol = "M0,0 C-16,-12 -10,-36 8,-34 C22,-32 20,-12 6,-12 C-2,-12 -2,-22 5,-23";
    s += "<g transform=\"translate(176,230)\"><path class=\"sa-d-vol\" d=\"" + vol + "\" fill=\"none\" stroke=\"" + c.color + "\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(388,196) scale(-1,1)\"><path class=\"sa-d-vol sa-d2\" d=\"" + vol + "\" fill=\"none\" stroke=\"" + mix(c.color, "#5A1830", 0.25) + "\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(170,150) scale(.8)\"><path class=\"sa-d-vol sa-d3\" d=\"" + vol + "\" fill=\"none\" stroke=\"#E3A9B1\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(392,110) scale(-.8,.8)\"><path class=\"sa-d-vol sa-d4\" d=\"" + vol + "\" fill=\"none\" stroke=\"" + c.color + "\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g>" +
      "<g transform=\"translate(280,96) scale(.9)\"><path class=\"sa-d-vol sa-d5\" d=\"" + vol + "\" fill=\"none\" stroke=\"#E3A9B1\" stroke-width=\"4.5\" stroke-linecap=\"round\"/></g>";
    s += "<g transform=\"translate(" + x + "," + (tip - ext) + ")\"><g class=\"sa-d-cot\">" + sh + cot +
      "<g class=\"sa-d-tint\"><circle cx=\"-22\" cy=\"22\" r=\"29\" fill=\"" + c.color + "\"/><circle cx=\"24\" cy=\"22\" r=\"30\" fill=\"" + c.color + "\"/><circle cx=\"0\" cy=\"8\" r=\"30\" fill=\"" + c.color + "\"/></g>" +
      "<path d=\"M-52,-8 C-40,-30 -14,-40 6,-40\" fill=\"none\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\"/></g></g>";
    s += spark(398, 250, 13, "sa-d-sp") + spark(160, 96, 10, "sa-d-sp sa-d2", "#D18B94") + spark(246, 150, 9, "sa-d-sp sa-d3", "#fff");
    return s;
  };

  /* Défaut : couronne de la marque + trois ongles. */
  SCENES.defaut = function (c) {
    var id = c.id, s = backdrop(c), i, a = 32, L = 106, g, cat = window.QONCatalog && typeof window.QONCatalog.nailSVG === "function" ? window.QONCatalog : null;
    var N = [[172, 214, "#EBC4B8", "french", -8], [280, 200, c.color, "", 0], [388, 214, "#A8566B", "fleurs", 8]], cid, svg;
    /* couronne (tracés de icons/mark.svg) */
    s += "<g transform=\"translate(280,110)\"><g class=\"sa-x-crown\"><g transform=\"translate(-102,-90) scale(1.7)\">" +
      "<path d=\"M16 74 L24 34 L46 56 L60 22 L74 56 L96 34 L104 74 Z\" fill=\"none\" stroke=\"" + url(c, "g") + "\" stroke-width=\"3.2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>" +
      "<path d=\"M18 85 H102\" stroke=\"" + url(c, "g") + "\" stroke-width=\"3.2\" stroke-linecap=\"round\"/>" +
      "<circle cx=\"24\" cy=\"31\" r=\"4\" fill=\"" + url(c, "g") + "\"/><circle cx=\"60\" cy=\"18\" r=\"4.6\" fill=\"" + url(c, "g") + "\"/><circle cx=\"96\" cy=\"31\" r=\"4\" fill=\"" + url(c, "g") + "\"/>" +
      "<path d=\"M52 76 V58 Q52 46 60 46 Q68 46 68 58 V76 Z\" fill=\"" + url(c, "r") + "\"/>" +
      "<path d=\"M56 72 V59 Q56 52 59.4 50.4\" fill=\"none\" stroke=\"#fff\" stroke-opacity=\".7\" stroke-width=\"2.2\" stroke-linecap=\"round\"/></g></g></g>";
    for (i = 0; i < 3; i++) {
      svg = "";
      if (cat) {
        try { svg = cat.nailSVG(N[i][3] ? { shape: "amande", length: 104, design: N[i][3], w: 96 } : { shape: "amande", length: 104, color: N[i][2], w: 96 }).replace("class=\"cat-nail\"", "class=\"sa-cat\""); } catch (e) { svg = ""; }
      }
      s += "<g transform=\"translate(" + N[i][0] + "," + N[i][1] + ") rotate(" + N[i][4] + ")\"><g class=\"sa-x-nail sa-x-n" + (i + 1) + "\">";
      if (svg) {
        s += "<g transform=\"translate(-48,-6)\">" + svg + "</g>";
      } else {
        cid = id + "c" + (++c.k);
        c.defs += "<clipPath id=\"" + cid + "\"><path d=\"" + nailD(a, L) + "\"/></clipPath>";
        if (!c.sh) { c.sh = 1; c.defs += lin(id + "o", 0, 0, 1, 0, [[0, "#FFFFFF", 0], [0.5, "#FFFFFF", 0.75], [1, "#FFFFFF", 0]]); }
        g = N[i][2] === c.color ? url(c, "r") : N[i][2];
        s += "<path d=\"" + nailD(a, L) + "\" fill=\"" + g + "\"/>" +
          "<path d=\"" + nailD(a, L) + "\" fill=\"" + url(c, "y") + "\"/>" +
          "<g clip-path=\"url(#" + cid + ")\"><g transform=\"rotate(24)\"><rect class=\"sa-x-shine sa-x-s" + (i + 1) + "\" x=\"-13\" y=\"-60\" width=\"26\" height=\"240\" fill=\"" + url(c, "o") + "\"/></g></g>" +
          gloss(a, L) + "<path d=\"" + nailD(a, L) + "\" fill=\"none\" stroke=\"#8E4A5C\" stroke-opacity=\".34\" stroke-width=\"1.2\"/>";
      }
      s += "</g></g>";
    }
    c.defs += lin(id + "y", 0, 0, 0, 1, [[0, "#FFFFFF", 0.22], [0.5, "#FFFFFF", 0], [1, "#3B1420", 0.2]]);
    s += "<path d=\"M170,350 H390\" stroke=\"" + url(c, "g") + "\" stroke-width=\"1.6\" stroke-linecap=\"round\" opacity=\".55\"/>" +
      spark(120, 120, 13, "sa-x-sp") + spark(440, 96, 10, "sa-x-sp sa-d2", "#D18B94") + spark(462, 214, 12, "sa-x-sp sa-d3") + spark(104, 232, 8, "sa-x-sp sa-d4", "#D18B94") + spark(280, 28, 7, "sa-x-sp sa-d2");
    return s;
  };

  var LABELS = {
    manucure: "Manucure et vernis", pose: "Pose gel et capsules sous lampe UV", art: "Nail art au pinceau fin",
    pedicure: "Pédicure, bain aux pétales de rose", soin: "Soin des mains à la paraffine", depose: "Dépose en douceur", defaut: "Queen of Nails"
  };

  /* ---------- API ---------- */
  function norm(t) {
    t = String(t == null ? "" : t).toLowerCase();
    if (t.normalize) { t = t.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    else { t = t.replace(/[éèêë]/g, "e").replace(/[àâä]/g, "a").replace(/[îï]/g, "i").replace(/[ôö]/g, "o").replace(/[ùûü]/g, "u").replace(/ç/g, "c"); }
    return t.replace(/œ/g, "oe");
  }
  function match(text) {
    var t = norm(text).replace(/^\s+|\s+$/g, "");
    if (KEYS.indexOf(t) >= 0) { return t; }
    if (/depos|retrait|dissolv/.test(t)) { return "depose"; }
    if (/pedicur|pied|orteil|beaute des pieds/.test(t)) { return "pedicure"; }
    if (/(^|[^a-z])art([^a-z]|$)|nail ?art|deco|design|motif|strass|french|baby ?boomer/.test(t)) { return "art"; }
    if (/gel|capsule|pose|resine|acryl|remplissage|rallonge|extension|chablon/.test(t)) { return "pose"; }
    if (/soin|paraffine|massage|gommage|hydrat|spa|masque/.test(t)) { return "soin"; }
    if (/manucur|vernis|semi|main|ongle|lim/.test(t)) { return "manucure"; }
    return "defaut";
  }
  function scene(key, opts) {
    opts = opts || {};
    if (!SCENES[key]) { key = match(key); }
    var c = ctx(opts), body = SCENES[key](c);
    return "<div class=\"sa-scene sa-" + key + (opts.cls ? " " + esc(opts.cls) : "") + "\">" +
      "<svg class=\"sa-svg\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + W + " " + H + "\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" aria-label=\"" + esc(opts.label || LABELS[key]) + "\" focusable=\"false\">" +
      "<defs>" + c.defs + "</defs>" + body + "</svg></div>";
  }

  window.QONArt = { keys: KEYS, match: match, scene: scene };
})();
