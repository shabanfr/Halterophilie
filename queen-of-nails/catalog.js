/* Queen of Nails — catalogue d'ongles (mode panorama).
   Tout est dessiné en SVG inline, sans image ni dépendance.
   API : window.QONCatalog.scenes(D) -> [{id,title,subtitle,html}], window.QONCatalog.nailSVG(opts) -> "<svg…>" */
(function () {
  "use strict";

  var uid = 0;
  var T = 6;            // y de la pointe (bord libre)
  var XL = 16, XR = 84; // flancs de l'ongle

  var LENGTHS = { courte: 80, "mi-longue": 118, longue: 160, "extra-longue": 210 };

  /* ---------- utilitaires ---------- */
  function n(v) { return Math.round(v * 100) / 100; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function hex2rgb(h) {
    h = String(h).replace("#", "");
    if (h.length === 3) { h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
    var v = parseInt(h, 16);
    if (isNaN(v)) { v = 0xE8C1B5; }
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function mix(h, target, k) {
    var c = hex2rgb(h), t = hex2rgb(target), out = "#", i, x;
    for (i = 0; i < 3; i++) {
      x = Math.round(c[i] + (t[i] - c[i]) * k).toString(16);
      out += x.length < 2 ? "0" + x : x;
    }
    return out;
  }
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function vgrad(id, stops, y1, y2) {
    var s = "<linearGradient id=\"" + id + "\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"" + n(y1) + "\" x2=\"0\" y2=\"" + n(y2) + "\">";
    for (var i = 0; i < stops.length; i++) {
      s += "<stop offset=\"" + stops[i][0] + "\" stop-color=\"" + stops[i][1] + "\"" +
        (stops[i].length > 2 ? " stop-opacity=\"" + stops[i][2] + "\"" : "") + "/>";
    }
    return s + "</linearGradient>";
  }

  /* ---------- contour de l'ongle, vu de dessus (pointe en haut, cuticule en bas) ---------- */
  function outline(shape, L) {
    var B = T + L, c = 24, top, h;
    switch (shape) {
      case "carree":
        top = "L16," + (T + 4) + " Q16," + T + " 20," + T + " L80," + T + " Q84," + T + " 84," + (T + 4);
        break;
      case "squoval":
        top = "L16," + (T + 17) + " Q16," + T + " 33," + T + " L67," + T + " Q84," + T + " 84," + (T + 17);
        break;
      case "ronde":
        h = Math.min(32, L * 0.3);
        top = "L16," + n(T + h) + " C16," + n(T + h * 0.36) + " 31," + T + " 50," + T +
          " C69," + T + " 84," + n(T + h * 0.36) + " 84," + n(T + h);
        break;
      case "ovale":
        h = Math.min(70, L * 0.46);
        top = "L16," + n(T + h) + " C16.5," + n(T + h * 0.36) + " 34," + T + " 50," + T +
          " C66," + T + " 83.5," + n(T + h * 0.36) + " 84," + n(T + h);
        break;
      case "stiletto":
        h = L * 0.8;
        top = "L16," + n(T + h) + " C19," + n(T + h * 0.56) + " 44.5," + (T + 7) + " 50," + T +
          " C55.5," + (T + 7) + " 81," + n(T + h * 0.56) + " 84," + n(T + h);
        break;
      case "coffin":
        h = L * 0.72;
        top = "L16," + n(T + h) + " C16.5," + n(T + h * 0.78) + " 17.5," + n(T + h * 0.7) + " 19," + n(T + h * 0.62) +
          " L34.2," + (T + 4.5) + " Q35.2," + T + " 39.5," + T + " L60.5," + T + " Q64.8," + T + " 65.8," + (T + 4.5) +
          " L81," + n(T + h * 0.62) + " C82.5," + n(T + h * 0.7) + " 83.5," + n(T + h * 0.78) + " 84," + n(T + h);
        break;
      case "lipstick":
        h = Math.min(40, L * 0.27);
        top = "L16," + n(T + h + 5) + " Q16," + n(T + h) + " 20," + n(T + h - 2.4) +
          " L78.5," + n(T + 1.6) + " Q84," + (T - 0.4) + " 84," + (T + 6);
        break;
      default: /* amande */
        h = Math.min(130, L * 0.64);
        top = "L16," + n(T + h) + " C17," + n(T + h * 0.5) + " 37," + (T + 1.5) + " 50," + T +
          " C63," + (T + 1.5) + " 83," + n(T + h * 0.5) + " 84," + n(T + h);
    }
    return "M16," + (B - c) + " " + top + " L84," + (B - c) +
      " C84," + (B - 6) + " 68," + B + " 50," + B + " C32," + B + " 16," + (B - 6) + " 16," + (B - c) + " Z";
  }

  /* ---------- designs : renvoient { defs, body } (body est déjà découpé par le clipPath) ---------- */
  function sparkles(seed, count, L, fn, palette) {
    var r = rng(seed), out = "", i, x, y, s, col, B = T + L;
    for (i = 0; i < count; i++) {
      x = XL + 2 + r() * (XR - XL - 4);
      y = fn(r(), B);
      s = 1 + r() * r() * 2.6;
      col = palette[Math.floor(r() * palette.length)];
      if (i % 4 === 0) {
        out += "<path d=\"M" + n(x) + "," + n(y - s * 1.5) + " L" + n(x + s) + "," + n(y) + " L" + n(x) + "," + n(y + s * 1.5) +
          " L" + n(x - s) + "," + n(y) + "Z\" fill=\"" + col + "\"/>";
      } else {
        out += "<circle cx=\"" + n(x) + "\" cy=\"" + n(y) + "\" r=\"" + n(s) + "\" fill=\"" + col + "\" opacity=\"" + n(0.65 + r() * 0.35) + "\"/>";
      }
    }
    return out;
  }
  function flower(x, y, R, petal, heart, rot) {
    var out = "<g transform=\"translate(" + n(x) + " " + n(y) + ") rotate(" + rot + ")\">", i;
    for (i = 0; i < 5; i++) {
      out += "<ellipse cx=\"0\" cy=\"" + n(-R * 0.62) + "\" rx=\"" + n(R * 0.42) + "\" ry=\"" + n(R * 0.6) + "\" fill=\"" + petal +
        "\" stroke=\"#E7A9B4\" stroke-width=\".5\" transform=\"rotate(" + (i * 72) + ")\"/>";
    }
    return out + "<circle r=\"" + n(R * 0.27) + "\" fill=\"" + heart + "\"/></g>";
  }
  function leaf(x, y, R, rot) {
    return "<ellipse cx=\"" + n(x) + "\" cy=\"" + n(y) + "\" rx=\"" + n(R * 0.38) + "\" ry=\"" + n(R) + "\" fill=\"#9DB08F\" transform=\"rotate(" + rot + " " + n(x) + " " + n(y) + ")\"/>";
  }
  function gem(x, y, R) {
    var k = R * 0.62;
    return "<circle cx=\"" + n(x) + "\" cy=\"" + n(y + R * 0.18) + "\" r=\"" + n(R) + "\" fill=\"#8A5560\" opacity=\".28\"/>" +
      "<circle cx=\"" + n(x) + "\" cy=\"" + n(y) + "\" r=\"" + n(R) + "\" fill=\"#F7FAFF\" stroke=\"#AEB9CE\" stroke-width=\".6\"/>" +
      "<path d=\"M" + n(x) + "," + n(y - k) + " L" + n(x + k) + "," + n(y) + " L" + n(x) + "," + n(y + k) + " L" + n(x - k) + "," + n(y) + "Z\" fill=\"#D5E0F3\"/>" +
      "<path d=\"M" + n(x) + "," + n(y - k) + " L" + n(x + k) + "," + n(y) + " L" + n(x) + "," + n(y) + "Z\" fill=\"#FFFFFF\"/>" +
      "<path d=\"M" + n(x) + "," + n(y + k) + " L" + n(x - k) + "," + n(y) + " L" + n(x) + "," + n(y) + "Z\" fill=\"#B4C3DE\"/>" +
      "<circle cx=\"" + n(x - R * 0.42) + "\" cy=\"" + n(y - R * 0.45) + "\" r=\"" + n(R * 0.16) + "\" fill=\"#fff\"/>";
  }

  var DESIGNS = {
    french: function (id, L) {
      var B = T + L, ys = T + Math.max(20, L * 0.2);
      return {
        defs: vgrad(id + "b", [[0, "#F9DDD6"], [1, "#EFC2BC"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          "<path d=\"M0,0 H100 V" + n(ys + 20) + " Q50," + n(ys - 14) + " 0," + n(ys + 20) + "Z\" fill=\"#FFFDFB\"/>" +
          "<path d=\"M0," + n(ys + 20) + " Q50," + n(ys - 14) + " 100," + n(ys + 20) + "\" fill=\"none\" stroke=\"#E9BDB8\" stroke-width=\".8\" opacity=\".7\"/>"
      };
    },
    babyboomer: function (id, L) {
      var B = T + L;
      return {
        defs: vgrad(id + "b", [[0, "#FFFFFF"], [0.28, "#FFF7F5"], [0.62, "#F8D3D3"], [1, "#EEB2BA"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>"
      };
    },
    chrome: function (id, L) {
      var B = T + L;
      return {
        defs: "<linearGradient id=\"" + id + "b\" gradientUnits=\"userSpaceOnUse\" x1=\"16\" y1=\"" + T + "\" x2=\"84\" y2=\"" + B + "\">" +
          "<stop offset=\"0\" stop-color=\"#FFFFFF\"/><stop offset=\".16\" stop-color=\"#B4BAC6\"/><stop offset=\".3\" stop-color=\"#F6F7FA\"/>" +
          "<stop offset=\".47\" stop-color=\"#737B88\"/><stop offset=\".58\" stop-color=\"#E6E9EE\"/><stop offset=\".78\" stop-color=\"#9CA3AF\"/>" +
          "<stop offset=\"1\" stop-color=\"#F1F3F6\"/></linearGradient>",
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          "<path d=\"M16," + n(T + L * 0.66) + " C36," + n(T + L * 0.56) + " 60," + n(T + L * 0.5) + " 84," + n(T + L * 0.3) +
          " V" + n(T + L * 0.4) + " C62," + n(T + L * 0.58) + " 38," + n(T + L * 0.63) + " 16," + n(T + L * 0.74) + "Z\" fill=\"#4E5562\" opacity=\".4\"/>" +
          "<path d=\"M16," + n(T + L * 0.76) + " C38," + n(T + L * 0.65) + " 62," + n(T + L * 0.6) + " 84," + n(T + L * 0.42) +
          " V" + n(T + L * 0.46) + " C62," + n(T + L * 0.64) + " 38," + n(T + L * 0.69) + " 16," + n(T + L * 0.8) + "Z\" fill=\"#FFFFFF\" opacity=\".85\"/>"
      };
    },
    cateye: function (id, L) {
      var B = T + L, cy = T + L * 0.52;
      return {
        defs: vgrad(id + "b", [[0, "#3A1238"], [1, "#1E0A22"]], T, B) +
          "<linearGradient id=\"" + id + "c\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"" + n(cy - 26) + "\" x2=\"0\" y2=\"" + n(cy + 26) + "\">" +
          "<stop offset=\"0\" stop-color=\"#E77FC0\" stop-opacity=\"0\"/><stop offset=\".32\" stop-color=\"#E77FC0\" stop-opacity=\".55\"/>" +
          "<stop offset=\".5\" stop-color=\"#FFE9F6\" stop-opacity=\".98\"/><stop offset=\".68\" stop-color=\"#C98BE8\" stop-opacity=\".55\"/>" +
          "<stop offset=\"1\" stop-color=\"#C98BE8\" stop-opacity=\"0\"/></linearGradient>",
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          "<rect x=\"-40\" y=\"" + n(cy - 26) + "\" width=\"180\" height=\"52\" fill=\"url(#" + id + "c)\" transform=\"rotate(-58 50 " + n(cy) + ")\"/>" +
          sparkles(77, 26, L, function (v, b) { return T + 8 + v * (b - T - 16); }, ["#F6C3E6", "#D9B4F2"]).replace(/opacity="[^"]*"/g, "opacity=\".35\"")
      };
    },
    marbre: function (id, L) {
      var B = T + L;
      function y(k) { return n(T + L * k); }
      return {
        defs: vgrad(id + "b", [[0, "#FFFFFF"], [1, "#F1ECE9"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          "<g fill=\"none\" stroke-linecap=\"round\">" +
          "<path d=\"M10," + y(0.34) + " C30," + y(0.3) + " 34," + y(0.48) + " 52," + y(0.5) + " S78," + y(0.62) + " 92," + y(0.58) + "\" stroke=\"#C9C4C8\" stroke-width=\"6\" opacity=\".35\"/>" +
          "<path d=\"M10," + y(0.34) + " C30," + y(0.3) + " 34," + y(0.48) + " 52," + y(0.5) + " S78," + y(0.62) + " 92," + y(0.58) + "\" stroke=\"#77737B\" stroke-width=\"1.9\" opacity=\".8\"/>" +
          "<path d=\"M38," + y(0.44) + " C44," + y(0.6) + " 36," + y(0.7) + " 42," + y(0.84) + " S40," + y(0.96) + " 46," + y(1.02) + "\" stroke=\"#8C8890\" stroke-width=\"1.4\" opacity=\".7\"/>" +
          "<path d=\"M60," + y(0.04) + " C54," + y(0.14) + " 66," + y(0.22) + " 60," + y(0.32) + " S70," + y(0.44) + " 64," + y(0.53) + "\" stroke=\"#8C8890\" stroke-width=\"1.5\" opacity=\".65\"/>" +
          "<path d=\"M62," + y(0.24) + " C72," + y(0.24) + " 78," + y(0.3) + " 90," + y(0.27) + "\" stroke=\"#A29EA6\" stroke-width=\"1.1\" opacity=\".7\"/>" +
          "<path d=\"M12," + y(0.72) + " C24," + y(0.7) + " 30," + y(0.78) + " 41," + y(0.76) + "\" stroke=\"#A29EA6\" stroke-width=\"1.1\" opacity=\".7\"/>" +
          "<path d=\"M14," + y(0.4) + " C32," + y(0.37) + " 36," + y(0.54) + " 54," + y(0.555) + " S76," + y(0.66) + " 90," + y(0.635) + "\" stroke=\"#C9A268\" stroke-width=\"1.6\" opacity=\".95\"/>" +
          "</g>"
      };
    },
    fleurs: function (id, L) {
      var B = T + L;
      function y(k) { return T + L * k; }
      return {
        defs: vgrad(id + "b", [[0, "#FBE6E2"], [1, "#F2C7C6"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          leaf(33, y(0.68), 9, -50) + leaf(74, y(0.58), 8, 40) + leaf(62, y(0.42), 7, 35) +
          flower(56, y(0.73), 16, "#FFFFFF", "#DDAA45", 0) +
          flower(39, y(0.47), 12, "#FFFFFF", "#DDAA45", 24) +
          flower(58, y(0.27), 8.5, "#FFF4F6", "#DDAA45", 50) +
          "<circle cx=\"30\" cy=\"" + n(y(0.84)) + "\" r=\"1.6\" fill=\"#fff\"/><circle cx=\"70\" cy=\"" + n(y(0.47)) + "\" r=\"1.6\" fill=\"#fff\"/>" +
          "<circle cx=\"47\" cy=\"" + n(y(0.24)) + "\" r=\"1.3\" fill=\"#fff\"/>"
      };
    },
    lignes: function (id, L) {
      var B = T + L;
      function y(k) { return n(T + L * k); }
      return {
        defs: vgrad(id + "b", [[0, "#F4DCD0"], [1, "#E6C2B3"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          "<g fill=\"none\" stroke-linecap=\"round\">" +
          "<path d=\"M12," + y(0.92) + " C30," + y(0.74) + " 66," + y(0.62) + " 60," + y(0.36) + " S50," + y(0.12) + " 52," + y(0.0) + "\" stroke=\"#3B2229\" stroke-width=\"2.2\"/>" +
          "<path d=\"M12," + y(0.99) + " C36," + y(0.82) + " 74," + y(0.68) + " 68," + y(0.4) + " S56," + y(0.16) + " 58," + y(0.0) + "\" stroke=\"#B98A4E\" stroke-width=\"2.2\"/>" +
          "<path d=\"M24," + y(0.5) + " L46," + y(0.5) + "\" stroke=\"#3B2229\" stroke-width=\"1.8\"/>" +
          "</g>" +
          "<circle cx=\"34\" cy=\"" + y(0.42) + "\" r=\"3\" fill=\"#3B2229\"/>" +
          "<circle cx=\"72\" cy=\"" + y(0.8) + "\" r=\"2.6\" fill=\"#B98A4E\"/>"
      };
    },
    strass: function (id, L) {
      var B = T + L;
      return {
        defs: vgrad(id + "b", [[0, "#F8DAD6"], [1, "#EDBEC0"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          gem(25.5, B - 36, 3.4) + gem(74.5, B - 36, 3.4) + gem(35, B - 25.5, 5) + gem(65, B - 25.5, 5) +
          gem(50, B - 21, 8) + gem(50, B - 41, 5.6) + gem(50, B - 56, 4.2) + gem(50, B - 68, 3) + gem(50, B - 77, 2)
      };
    },
    paillettes: function (id, L) {
      var B = T + L;
      return {
        defs: vgrad(id + "b", [[0, "#EDB3A6"], [1, "#D4848C"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          sparkles(11, 95, L, function (v, b) { return T + 2 + v * (b - T - 4); }, ["#FFF6E0", "#F9DDA6", "#FFFFFF", "#E9BC7E", "#FFD3DA", "#C9935A"])
      };
    },
    dots: function (id, L) {
      var B = T + L, out = "", row = 0, x, y;
      for (y = T + 12; y < B - 4; y += 13.5) {
        for (x = (row % 2 ? 29.5 : 22.5); x < XR; x += 14) {
          out += "<circle cx=\"" + n(x) + "\" cy=\"" + n(y) + "\" r=\"3.1\"/>";
        }
        row++;
      }
      return {
        defs: vgrad(id + "b", [[0, "#F7BFC8"], [1, "#EC9CAB"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/><g fill=\"#FFFFFF\">" + out + "</g>"
      };
    },
    ombre: function (id, L) {
      var B = T + L;
      return {
        defs: vgrad(id + "b", [[0, "#FF9A6C"], [0.38, "#FA6F8E"], [0.72, "#C866B8"], [1, "#8B63CF"]], T, B),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>"
      };
    },
    glittertips: function (id, L) {
      var B = T + L;
      return {
        defs: vgrad(id + "b", [[0, "#F8DED5"], [1, "#EDC3BA"]], T, B) +
          vgrad(id + "c", [[0, "#D9A75C", 0.9], [0.45, "#E2B56F", 0.35], [1, "#E2B56F", 0]], T, T + L * 0.5),
        body: "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>" +
          "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + n(T + L * 0.5) + "\" fill=\"url(#" + id + "c)\"/>" +
          sparkles(5, 95, L, function (v, b) { return T + 1 + Math.pow(v, 2.3) * (b - T) * 0.64; }, ["#FFF3D0", "#F5D28C", "#FFFFFF", "#C98F3F", "#E8B866"])
      };
    }
  };
  var DESIGN_ALIAS = {
    "baby-boomer": "babyboomer", "baby boomer": "babyboomer", "cat-eye": "cateye", "oeil-de-chat": "cateye",
    marble: "marbre", flowers: "fleurs", lines: "lignes", "lignes minimalistes": "lignes", rhinestones: "strass",
    glitter: "paillettes", points: "dots", pois: "dots", "ombré": "ombre", "glitter-tips": "glittertips"
  };
  var SHAPE_ALIAS = {
    "carrée": "carree", square: "carree", round: "ronde", oval: "ovale", almond: "amande",
    ballerine: "coffin", ballerina: "coffin", "carré arrondi": "squoval"
  };

  /* ---------- nailSVG ----------
     opts : shape  "carree|squoval|ronde|ovale|amande|coffin|stiletto|lipstick"
            length "courte|mi-longue|longue|extra-longue" ou nombre (unités SVG, 64 à 260)
            color  "#hex" (ou colors : ["#haut", "#bas"] pour un dégradé)
            design clé de design (french, babyboomer, chrome, cateye, marbre, fleurs, lignes, strass, paillettes, dots, ombre, glittertips)
            metal  true : fini métallisé pour la couleur
            finger true : dessine le bout du doigt derrière l'ongle
            w      largeur (nombre = px, ou chaîne CSS « 6rem ») ; sinon la taille vient de la CSS (.cat-nail) */
  function nailSVG(opts) {
    opts = opts || {};
    var shape = String(opts.shape || "amande").toLowerCase();
    if (SHAPE_ALIAS[shape]) { shape = SHAPE_ALIAS[shape]; }
    var L = typeof opts.length === "number" ? opts.length : (LENGTHS[opts.length] || LENGTHS.longue);
    L = Math.max(64, Math.min(260, L));
    var B = T + L, finger = !!opts.finger, H = B + (finger ? 36 : 6);
    var id = "qc" + (++uid);
    var d = outline(shape, L);
    var color = opts.color || "#E8C1B5";
    var colors = opts.colors && opts.colors.length ? opts.colors : null;
    var design = opts.design ? String(opts.design).toLowerCase() : "";
    if (DESIGN_ALIAS[design]) { design = DESIGN_ALIAS[design]; }
    var defs = "", body = "", layer, edge;

    if (design && DESIGNS[design]) {
      layer = DESIGNS[design](id, L);
      defs += layer.defs; body = layer.body; edge = "#7A4350";
    } else {
      if (colors) {
        defs += vgrad(id + "b", colors.length > 2 ?
          [[0, colors[0]], [0.5, colors[1]], [1, colors[2]]] : [[0, colors[0]], [1, colors[1] || colors[0]]], T, B);
        color = colors[colors.length - 1];
      } else if (opts.metal) {
        defs += vgrad(id + "b", [[0, mix(color, "#ffffff", 0.55)], [0.3, color], [0.52, mix(color, "#ffffff", 0.7)],
          [0.72, mix(color, "#5a3a1a", 0.22)], [1, mix(color, "#ffffff", 0.3)]], T, B);
      } else {
        defs += vgrad(id + "b", [[0, mix(color, "#ffffff", 0.14)], [0.55, color], [1, mix(color, "#200810", 0.16)]], T, B);
      }
      body = "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "b)\"/>";
      edge = mix(color, "#3B1420", 0.55);
    }

    /* volume (flancs + cuticule) et reflet brillant, communs à tous les ongles */
    defs += "<clipPath id=\"" + id + "k\"><path d=\"" + d + "\"/></clipPath>" +
      "<linearGradient id=\"" + id + "s\" gradientUnits=\"userSpaceOnUse\" x1=\"16\" y1=\"0\" x2=\"84\" y2=\"0\">" +
      "<stop offset=\"0\" stop-color=\"#2A0A14\" stop-opacity=\".26\"/><stop offset=\".2\" stop-color=\"#2A0A14\" stop-opacity=\"0\"/>" +
      "<stop offset=\".76\" stop-color=\"#2A0A14\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#2A0A14\" stop-opacity=\".22\"/></linearGradient>" +
      vgrad(id + "u", [[0, "#2A0A14", 0], [1, "#2A0A14", 0.2]], B - 30, B) +
      vgrad(id + "g", [[0, "#FFFFFF", 0], [0.18, "#FFFFFF", 0.78], [0.7, "#FFFFFF", 0.5], [1, "#FFFFFF", 0]], T + L * 0.2, B - L * 0.16);

    var g0 = T + L * 0.2, g1 = B - L * 0.16;
    var gloss = "<path d=\"M30.5," + n(g0) + " C26," + n(g0 + (g1 - g0) * 0.3) + " 25," + n(g0 + (g1 - g0) * 0.7) + " 27.5," + n(g1) +
      " C31," + n(g0 + (g1 - g0) * 0.7) + " 33.5," + n(g0 + (g1 - g0) * 0.3) + " 36.5," + n(g0) + "Z\" fill=\"url(#" + id + "g)\"/>" +
      "<ellipse cx=\"66\" cy=\"" + n(B - 15) + "\" rx=\"9\" ry=\"2.6\" fill=\"#fff\" opacity=\".3\" transform=\"rotate(-14 66 " + n(B - 15) + ")\"/>";

    var skin = "";
    if (finger) {
      var yF = Math.max(T + 4, B - 62);
      defs += vgrad(id + "f", [[0, "#F8DFD2"], [0.55, "#F1CDBD"], [0.86, "#EEC6B6", 0.85], [1, "#EEC6B6", 0]], yF, H);
      skin = "<path d=\"M3," + H + " L3," + n(yF + 46) + " C3," + n(yF + 15) + " 23," + n(yF) + " 50," + n(yF) +
        " C77," + n(yF) + " 97," + n(yF + 15) + " 97," + n(yF + 46) + " L97," + H + "Z\" fill=\"url(#" + id + "f)\"/>" +
        "<path d=\"M13.4," + (B - 30) + " L13.4," + (B - 22) + " C13.4," + (B - 3) + " 31," + (B + 3.2) + " 50," + (B + 3.2) +
        " C69," + (B + 3.2) + " 86.6," + (B - 3) + " 86.6," + (B - 22) + " L86.6," + (B - 30) + "\" fill=\"none\" stroke=\"#D9A593\" stroke-width=\"1.6\" stroke-linecap=\"round\" opacity=\".75\"/>";
    }

    var style = "";
    if (typeof opts.w === "number") { style = " width=\"" + opts.w + "\" height=\"" + n(opts.w * H / 100) + "\""; }
    else if (opts.w) { style = " style=\"width:" + esc(opts.w) + ";height:auto\""; }

    return "<svg class=\"cat-nail\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 " + n(H) + "\"" + style +
      " aria-hidden=\"true\" focusable=\"false\"><defs>" + defs + "</defs>" + skin +
      "<g clip-path=\"url(#" + id + "k)\">" + body +
      "<rect x=\"0\" y=\"0\" width=\"100\" height=\"" + (B + 4) + "\" fill=\"url(#" + id + "s)\"/>" +
      "<rect x=\"0\" y=\"" + (B - 30) + "\" width=\"100\" height=\"34\" fill=\"url(#" + id + "u)\"/>" +
      gloss + "</g>" +
      "<path d=\"" + d + "\" fill=\"none\" stroke=\"" + edge + "\" stroke-opacity=\".42\" stroke-width=\"1\" stroke-linejoin=\"round\"/></svg>";
  }

  /* ---------- contenu ---------- */
  var SHAPES = [
    ["carree", "Carrée", "Nette et graphique"],
    ["squoval", "Squoval", "Carré arrondi"],
    ["ronde", "Ronde", "Naturelle et douce"],
    ["ovale", "Ovale", "Affine le doigt"],
    ["amande", "Amande", "Élégante, féminine"],
    ["coffin", "Coffin", "Dite «\u00a0ballerine\u00a0»"],
    ["stiletto", "Stiletto", "Pointue, audacieuse"],
    ["lipstick", "Lipstick", "Biseau asymétrique"]
  ];
  var SIZES = [
    ["courte", "Courte", "Naturelle et pratique"],
    ["mi-longue", "Mi-longue", "L’élégance au quotidien"],
    ["longue", "Longue", "Allongée, glamour"],
    ["extra-longue", "Extra-longue", "L’effet waouh"]
  ];
  var COLORS = [
    ["Nude rosé", "#E9C0B3"], ["Rose poudré", "#F0B5C0"], ["Rose bonbon", "#F2779F"], ["Rouge cerise", "#C1122E"],
    ["Bordeaux", "#6B1322"], ["Corail", "#FF7558"], ["Mauve lilas", "#B698D6"], ["Bleu glacier", "#B9DAEE"],
    ["Vert sauge", "#A2B598"], ["Noir", "#1D1518"], ["Blanc lait", "#FBF6F0"], ["Champagne", "#D8B77F", true]
  ];
  var STYLES = [
    ["french", "French"], ["babyboomer", "Baby boomer"], ["chrome", "Chrome miroir"], ["cateye", "Œil-de-chat"],
    ["marbre", "Marbre"], ["fleurs", "Fleurs"], ["lignes", "Lignes fines"], ["strass", "Strass"],
    ["paillettes", "Paillettes"], ["dots", "Pois"], ["ombre", "Ombré couleur"], ["glittertips", "Glitter tips"]
  ];

  function head(kicker, title, sub) {
    return "<div class=\"cat-head\"><div class=\"cat-kicker\">" + kicker + "</div>" +
      "<div class=\"cat-headrow\"><h2 class=\"cat-title\">" + title + "</h2><p class=\"cat-sub\">" + sub + "</p></div></div>";
  }
  function item(svg, name, desc, cls) {
    return "<div class=\"cat-item" + (cls ? " " + cls : "") + "\"><div class=\"cat-fig\">" + svg + "</div>" +
      "<div class=\"cat-name\">" + name + "</div>" + (desc ? "<div class=\"cat-desc\">" + desc + "</div>" : "") + "</div>";
  }
  function scene(mod, headHtml, items) {
    return "<div class=\"cat-scene cat-" + mod + "\">" + headHtml + "<div class=\"cat-grid\">" + items + "</div></div>";
  }

  function scenes(D) {
    var i, s, out = [];

    s = "";
    for (i = 0; i < SHAPES.length; i++) {
      s += item(nailSVG({ shape: SHAPES[i][0], length: 168, color: "#E7A3AE", finger: true }), SHAPES[i][1], SHAPES[i][2]);
    }
    out.push({
      id: "formes", title: "Les formes", subtitle: "Huit silhouettes, de la plus sage à la plus audacieuse",
      html: scene("formes", head("Catalogue · 1 / 4", "Les <em>formes</em>", "Huit silhouettes, de la plus sage à la plus audacieuse"), s)
    });

    s = "";
    for (i = 0; i < SIZES.length; i++) {
      s += item(nailSVG({ shape: "amande", length: SIZES[i][0], color: "#D98A9A", finger: true }), SIZES[i][1], SIZES[i][2]);
    }
    out.push({
      id: "longueurs", title: "Les longueurs", subtitle: "La même forme amande, de la plus courte à la plus longue",
      html: scene("longueurs", head("Catalogue · 2 / 4", "Les <em>longueurs</em>", "La même forme amande, de la plus courte à la plus longue"), s)
    });

    s = "";
    for (i = 0; i < COLORS.length; i++) {
      s += item(nailSVG({ shape: "ovale", length: 124, color: COLORS[i][1], metal: !!COLORS[i][2] }), COLORS[i][0], "", "cat-card");
    }
    out.push({
      id: "couleurs", title: "Les couleurs", subtitle: "Douze teintes tendance, finition brillante",
      html: scene("couleurs", head("Catalogue · 3 / 4", "Les <em>couleurs</em>", "Douze teintes tendance, finition brillante"), s)
    });

    s = "";
    for (i = 0; i < STYLES.length; i++) {
      s += item(nailSVG({ shape: "amande", length: 126, design: STYLES[i][0] }), STYLES[i][1], "", "cat-card");
    }
    out.push({
      id: "designs", title: "Les designs", subtitle: "Du plus discret au plus précieux, réalisés à la main",
      html: scene("designs", head("Catalogue · 4 / 4", "Les <em>designs</em>", "Du plus discret au plus précieux, réalisés à la main"), s)
    });

    return out;
  }

  window.QONCatalog = { scenes: scenes, nailSVG: nailSVG };
})();
