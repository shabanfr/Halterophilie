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
  panoScenes: ["mix", "formes", "longueurs", "couleurs", "designs"],  // ordre / scènes actives
  // Photos de réalisations (chemins relatifs, ex. "photos/01.jpg"). Vide = décors générés.
  gallery: [],
  quotes: ["Des ongles qui vous ressemblent.", "Prenez un moment pour vous.", "Le détail qui change tout.", "Chaque ongle, une petite œuvre."],
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
