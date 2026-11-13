/* ==========================================================
   ALL THE WORDS LIVE HERE. This is the only file you need to edit.

   - Anything that says TODO is a placeholder for you to replace.
   - Keep the quote marks and commas as they are, and put your text
     between the quotes. If your text has a double quote in it, write \"
   - To check for leftovers: open any page with ?dev=1 on the end of the
     address. The grey bar at the bottom says if any TODO is left.
   ========================================================== */
window.CONTENT = {
  herName: "Rid",

  /* ---------- Page 1: the candle ---------- */
  entrance: {
    title: "Make a wish.",
    lead: "Blow out the candle. Press and hold the button, and give it a proper breath.",
    holdLabel: "Hold to blow",
    tries: 4,        // how many breaths before the candle finally goes out
    holdMs: 1400,    // how long one breath has to last, in milliseconds
    tooShort: "A little longer. Keep holding.",
    // One line after each breath that does NOT put it out. Needs (tries - 1) lines.
    grew: [
      "It flickered, then grew. It is a magic candle, so that happens.",
      "Bigger. It is not going down without a fight.",
      "Okay. One more proper breath."
    ],
    out: "Out. Make your wish.",
    enter: "Open the map",
    skip: "Already made your wish? Go to the map."
  },

  /* ---------- The map ---------- */
  hub: {
    title: "The map",
    intro: "Each star opens after the one before it. You can come back to any of them whenever you like.",
    lockedHint: "Opens after the star before it",
    dateHint: "Opens on your birthday",
    rooms: {
      music:   { name: "Music room" },
      quest:   { name: "The quest" },
      letters: { name: "Letters" },
      gallery: { name: "Gallery" },
      words:   { name: "Words" },
      final:   { name: "The last star" },
      secret:  { name: "Something hidden" }
    }
  },

  /* ---------- Music room ---------- */
  music: {
    title: "Music room",
    intro: "TODO: one or two lines about why there is a music room.",
    // The 96 is real: it is what Spotify showed for your Blend.
    blend: { percent: 96, label: "Our Blend", note: "TODO: a line about the Blend, or delete this note." },
    idleLabel: "Pick a song to drop the needle",
    nowLabel: "Now spinning",
    progress: "{n} of {total} played",
    // spotifyId is the part of a track link after /track/ and before the ?. Leave "" for no player.
    tracks: [
      { title: "TODO: song 1", artist: "TODO: artist", why: "TODO: placeholder caption. One or two lines on why this song made you think of her.", spotifyId: "" },
      { title: "TODO: song 2", artist: "TODO: artist", why: "TODO: placeholder caption. Keep it light, a small memory or a tiny joke works better than a big statement.", spotifyId: "" },
      { title: "TODO: song 3", artist: "TODO: artist", why: "TODO: placeholder caption. Something about the first time you heard it and who you pictured.", spotifyId: "" },
      { title: "TODO: song 4", artist: "TODO: artist", why: "TODO: placeholder caption. A song that matches how she texts or talks.", spotifyId: "" },
      { title: "TODO: song 5", artist: "TODO: artist", why: "TODO: placeholder caption. The one you are a little nervous to include.", spotifyId: "" }
    ]
  },

  /* ---------- Quest (trivia) ---------- */
  quest: {
    title: "The quest",
    intro: "Answer each question to open a hidden message. Wrong answers cost nothing.",
    tryAgain: "Not that one. Try another.",
    hintPrefix: "A hint: ",
    unlockLabel: "A hidden message opened",
    next: "Next question",
    finish: "See what you found",
    collectedTitle: "What you opened",
    doneLine: "That was all of them.",
    // answer = position of the right option, counting from 0 (0 is the first option)
    questions: [
      { q: "TODO: question 1", options: ["TODO: right answer", "TODO: wrong answer", "TODO: wrong answer"], answer: 0, hint: "", reward: "TODO: hidden message 1" },
      { q: "TODO: question 2", options: ["TODO: wrong answer", "TODO: right answer", "TODO: wrong answer"], answer: 1, hint: "", reward: "TODO: hidden message 2" },
      { q: "TODO: question 3", options: ["TODO: wrong answer", "TODO: wrong answer", "TODO: right answer"], answer: 2, hint: "", reward: "TODO: hidden message 3" },
      { q: "TODO: question 4", options: ["TODO: right answer", "TODO: wrong answer", "TODO: wrong answer"], answer: 0, hint: "", reward: "TODO: hidden message 4" },
      { q: "TODO: question 5", options: ["TODO: wrong answer", "TODO: right answer", "TODO: wrong answer"], answer: 1, hint: "", reward: "TODO: hidden message 5" }
    ]
  },

  /* ---------- Letters: seven of them ---------- */
  letters: {
    title: "Letters",
    intro: "Seven letters. Each one has its own name and its own reason. Open them in any order.",
    sealed: "Sealed",
    read: "Read",
    close: "Close",
    items: [
      { name: "Letter one",   meaning: "TODO: what this letter is for.", body: ["TODO: write letter one."] },
      { name: "Letter two",   meaning: "TODO: what this letter is for.", body: ["TODO: write letter two."] },
      { name: "Letter three", meaning: "TODO: what this letter is for.", body: ["TODO: write letter three."] },
      { name: "Letter four",  meaning: "TODO: what this letter is for.", body: ["TODO: write letter four."] },
      { name: "Letter five",  meaning: "TODO: what this letter is for.", body: ["TODO: write letter five."] },
      { name: "Letter six",   meaning: "TODO: what this letter is for.", body: ["TODO: write letter six."] },
      { name: "Letter seven", meaning: "TODO: what this letter is for.", body: ["TODO: write letter seven."] }
    ]
  },

  /* ---------- Gallery ---------- */
  gallery: {
    title: "Gallery",
    intro: "TODO: one line before the photos start.",
    // Put photos in the photos folder named 001.jpg, 002.jpg ... up to count.
    folder: "photos/",
    ext: "jpg",
    pad: 3,
    count: 100,
    missing: "Photo {n} goes here",
    // Captions by photo number. Add as many as you like:
    captions: {
      // 1: "Caption for photo 001",
      // 2: "Caption for photo 002"
    }
  },

  /* ---------- Words: plain on purpose ---------- */
  words: {
    title: "TODO: title",
    lines: [
      "TODO: write this last, once you know where you two stand. Plain words, your voice."
    ],
    signoff: "",
    toast: "Another star lit up on the map."
  },

  /* ---------- The last star ---------- */
  final: {
    title: "Happy birthday, Rid.",
    lines: ["TODO: your birthday message."],
    // To keep this page shut until her birthday, set a date like "2026-12-16T00:00:00+05:30".
    unlockAt: null,
    lockedTitle: "Not yet.",
    lockedLine: "This one opens on your birthday.",
    // The hidden star in the top corner of this page opens the secret page.
    egg: { label: "A small star", toast: "You found something hidden.", linkText: "Open the secret" }
  },

  /* ---------- Secret page (only reachable through the hidden star) ---------- */
  secret: {
    title: "You found it.",
    lines: ["TODO: the secret message."]
  }
};
