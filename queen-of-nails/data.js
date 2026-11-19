/* Contenu de l'affichage. Modifier ici : textes, prestations, prix.
   ⚠ Les prix ci-dessous sont des EXEMPLES à remplacer. */
window.QON = {
  brand: "Queen of Nails",
  tagline: "Onglerie & beauté des mains",
  slideSeconds: 11,
  // Mode panorama : s'active seul après X minutes sans toucher la télécommande
  panoramaAfterMinutes: 3,
  panoramaSeconds: 120,      // durée totale du panorama avant retour au menu
  panoSceneSeconds: 25,      // durée de chaque scène du panorama
  panoScenes: ["mix", "realisations", "formes", "longueurs", "couleurs", "designs"],  // ordre / scènes actives
  // Photos de réalisations (chemins relatifs, ex. "photos/01.jpg"). Vide = décors générés.
  gallery: [],
  quotes: ["Des ongles qui vous ressemblent.", "Prenez un moment pour vous.", "Le détail qui change tout.", "Chaque ongle, une petite œuvre."],
  // Musique d'ambiance (jouée par la page TV). volume : 0 à 100.
  music: {
    enabled: true, volume: 30, shuffle: true,
    tracks: [
      { src: "music/a-cup-of-tea.mp3", title: "A cup of tea", on: true },
      { src: "music/contemplation.mp3", title: "Contemplation", on: true },
      { src: "music/dust.mp3", title: "Dust", on: true },
      { src: "music/elevator.mp3", title: "Elevator", on: true },
      { src: "music/elevator-2.mp3", title: "Elevator 2", on: true },
      { src: "music/i-do-know.mp3", title: "I Do Know", on: true },
      { src: "music/just-you-and-me.mp3", title: "Just you and me", on: true },
      { src: "music/fouler-l-horizon.mp3", title: "Fouler l'horizon", on: true },
      { src: "music/champ-de-tournesol.mp3", title: "Champ de tournesol", on: true },
      { src: "music/bleu.mp3", title: "Bleu", on: true },
      { src: "music/serenade.mp3", title: "Serenade", on: true },
      { src: "music/the-love-cycle.mp3", title: "The love cycle", on: true },
      { src: "music/gone-fishin.mp3", title: "Gone fishin'", on: true },
      { src: "music/jazz-doux.mp3", title: "Jazz doux", on: true },
      { src: "music/lydian.mp3", title: "Lydian", on: true },
      { src: "music/pretty.mp3", title: "Pretty", on: true },
      { src: "music/bossa.mp3", title: "Bossa", on: true },
      { src: "music/sunny-side-up.mp3", title: "Sunny side up", on: true }
    ]
  },
  // Photos : ordre d'affichage « recent » (les plus récentes d'abord), « random » (aléatoire) ou « list » (ordre de la liste).
  galleryOrder: "recent",
  // Diapos du catalogue d'ongles dans le diaporama (en plus du panorama) : formes, longueurs, couleurs, designs.
  catalogSlides: ["formes", "couleurs", "designs"],
  // Catalogue : éléments masqués { formes: ["stiletto"] }, noms changés { coffin: "Ballerine" }, couleurs ajoutées [{ name, hex }].
  catalog: { hide: {}, names: {}, colors: [] },
  // Demandes envoyées depuis l'appli de gestion (traitées à la prochaine session de travail).
  requests: [],
  // QR code affiché à la TV : lien au choix (Instagram, réservation, avis Google…). Vide = adresse de ce site.
  qr: { url: "", kicker: "Garde-nous dans ta poche", title: "Scanne & retrouve nos tarifs", text: "Vise le code avec l’appareil photo de ton téléphone.", label: "Nos tarifs" },
  // Renseigner pour les afficher sur la dernière diapo (laisser "" pour masquer)
  contact: { phone: "", instagram: "", address: "", hours: "" },
  sections: [
    {
      id: "manucure",
      title: "Manucure",
      kicker: "Les essentiels",
      intro: "Des mains soignées, un vernis impeccable.",
      items: [
        { name: "Manucure express", note: "Limage, cuticules, soin", time: "30 min", price: 25 },
        { name: "Manucure + vernis classique", note: "Large choix de couleurs", time: "45 min", price: 35 },
        { name: "Vernis semi-permanent", note: "Tenue jusqu'à 3 semaines", time: "50 min", price: 40 },
        { name: "Dépose + soin", note: "Retrait en douceur", time: "30 min", price: 20 }
      ]
    },
    {
      id: "pose",
      title: "Pose gel & capsules",
      kicker: "Longueur & tenue",
      intro: "Une forme sur mesure, un rendu naturel ou spectaculaire.",
      items: [
        { name: "Pose gel", note: "Sur ongles naturels", time: "1 h 30", price: 55 },
        { name: "Capsules + gel", note: "Forme et longueur au choix", time: "1 h 45", price: 65 },
        { name: "Remplissage", note: "Toutes les 3 à 4 semaines", time: "1 h 15", price: 45 },
        { name: "Dépose complète", note: "Gel ou résine", time: "40 min", price: 25 }
      ]
    },
    {
      id: "art",
      title: "Nail art & soins",
      kicker: "Les finitions",
      intro: "Le détail qui change tout.",
      items: [
        { name: "Nail art", note: "Par ongle, selon le motif", time: "", price: 3, from: true },
        { name: "French ou baby boomer", note: "Supplément", time: "", price: 10 },
        { name: "Soin paraffine", note: "Mains douces et nourries", time: "20 min", price: 20 },
        { name: "Pédicure semi-permanent", note: "Soin + vernis", time: "1 h", price: 50 }
      ]
    }
  ]
};
