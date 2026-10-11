// ✏️ TOUT CE QUI SE MODIFIE EST ICI. Pas besoin de toucher au reste.

const CONFIG = {
  // Date de votre début (AAAA-MM-JJ) -> sert au compteur
  startDate: "2024-01-01",

  // Photos : mets tes fichiers dans /photos et ajoute une ligne par photo.
  // fr/en = légende qui apparaît au survol.
  photos: [
    // { src: "photos/nous1.jpg", fr: "Notre premier selfie", en: "Our first selfie" },
  ],

  // Vidéos Snap : exporte-les en .mp4 et mets-les dans /videos
  videos: [
    // "videos/snap1.mp4",
  ],
};

// Poèmes d'exemple : remplace-les par les tiens ou par ceux qu'elle aime.
const POEMS = [
  {
    title: { fr: "Vert espoir", en: "Green Hope" },
    text: {
      fr: "Il y a du vert dans tes yeux quand tu ris,\ndu rose sur tes joues quand je te dis\nque le monde est plus doux depuis que tu es là,\net que mon cœur, c'est toi qu'il choisira.",
      en: "There is green in your eyes when you laugh,\npink on your cheeks when I tell you half\nof how the world got softer since you came,\nand how my heart will always say your name.",
    },
  },
  {
    title: { fr: "Petit matin", en: "Little Morning" },
    text: {
      fr: "Si le matin avait un visage,\nil aurait ton sourire en partage.\nChaque jour avec toi est une page\nque j'écris sans jamais tourner l'âge.",
      en: "If morning had a face to show,\nit would wear your smile, soft and slow.\nEvery day with you is a page I write,\nand I never want to turn off the light.",
    },
  },
  {
    title: { fr: "Pour Arielle", en: "For Arielle" },
    text: {
      fr: "Je n'ai pas les mots des grands poètes,\nmais j'ai ce site, ces photos, cette fête\nde petits riens qui disent tout bas :\nmerci d'être toi, merci d'être là.",
      en: "I don't have the words of the great poets,\nbut I have this site, these photos, these small moments\nthat whisper quietly: thank you for being you,\nthank you for being here.",
    },
  },
];

// Les raisons : ajoute-en autant que tu veux.
const REASONS = {
  fr: [
    "Ton sourire illumine toutes mes journées.",
    "Tu me fais rire même quand je boude.",
    "Tu es toujours là pour moi.",
    "Tes petites vidéos Snap me font fondre.",
    "Avec toi, tout est plus simple.",
  ],
  en: [
    "Your smile lights up all my days.",
    "You make me laugh even when I'm sulking.",
    "You're always there for me.",
    "Your little Snap videos melt my heart.",
    "With you, everything feels easier.",
  ],
};

// Lettre finale (bouton surprise)
const LETTER = {
  fr: "Arielle,\n\nCe site est ma façon de te dire\nce que les mots seuls n'arrivent pas toujours à dire.\nMerci pour ta douceur, ton rire et ta lumière.\n\nJe t'aime. 💚💗",
  en: "Arielle,\n\nThis site is my way of saying\nwhat words alone can't always say.\nThank you for your softness, your laugh and your light.\n\nI love you. 💚💗",
};

// Textes de l'interface
const I18N = {
  fr: {
    nav_photos: "Photos", nav_poems: "Poèmes", nav_snaps: "Snaps", nav_reasons: "Raisons",
    hero_kicker: "Pour toi, ma petite amie",
    typed: ["Tu es ma couleur préférée.", "Mon vert, mon rose, mon tout.", "Ce site n'est que pour toi 💚"],
    photos_title: "Nos souvenirs", photos_sub: "Clique sur une photo pour la voir en grand.",
    poems_title: "Quelques poèmes pour toi",
    snaps_title: "Tes vidéos Snap", snaps_sub: "Parce que j'adore te voir t'amuser.",
    snaps_empty: "Ajoute tes vidéos dans le dossier /videos",
    photos_empty: "Ajoute tes photos dans le dossier /photos",
    reasons_title: "Pourquoi je t'aime", reasons_sub: "Clique pour découvrir une raison.",
    reasons_idle: "💗", reasons_btn: "Une raison de plus",
    surprise_btn: "Une dernière surprise 🎁",
    footer: "Fait avec amour, rien que pour Arielle 💚",
    d: "jours", h: "heures", m: "minutes", s: "secondes",
  },
  en: {
    nav_photos: "Photos", nav_poems: "Poems", nav_snaps: "Snaps", nav_reasons: "Reasons",
    hero_kicker: "For you, my girlfriend",
    typed: ["You are my favorite color.", "My green, my pink, my everything.", "This site is only for you 💚"],
    photos_title: "Our memories", photos_sub: "Click a photo to see it bigger.",
    poems_title: "A few poems for you",
    snaps_title: "Your Snap videos", snaps_sub: "Because I love watching you have fun.",
    snaps_empty: "Add your videos to the /videos folder",
    photos_empty: "Add your photos to the /photos folder",
    reasons_title: "Why I love you", reasons_sub: "Click to discover a reason.",
    reasons_idle: "💗", reasons_btn: "One more reason",
    surprise_btn: "One last surprise 🎁",
    footer: "Made with love, just for Arielle 💚",
    d: "days", h: "hours", m: "minutes", s: "seconds",
  },
};
