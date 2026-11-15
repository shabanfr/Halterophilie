# Queen of Nails — affichage TV + PWA

Site statique (HTML/CSS/JS, sans build). TV (≥1100 px ou `?tv=1`) : diaporama + télécommande. Téléphone : liste verticale + PWA installable (plein écran, sans barre d'URL).

- Contenu / prix : `data.js` (prix actuels = EXEMPLES).
- Télécommande : ◀ ▶ (ou ▲ ▼) = diapo précédente/suivante, OK = pause.
- Test local : `python3 -m http.server` puis `http://localhost:8000/?tv=1` ou `?phone=1`.
- Hébergement : n'importe quel hébergeur statique (GitHub Pages, Netlify, Cloudflare Pages) ; le QR pointe vers l'URL de la page.
- TV : Fully Kiosk Browser → URL du site, « Start on boot », plein écran.
