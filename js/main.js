let lang = localStorage.getItem("lang") || "fr";
const $ = (id) => document.getElementById(id);
const t = (k) => I18N[lang][k];

/* ---------- Placeholders (tant qu'il n'y a pas de vraies photos) ---------- */
function placeholder(i) {
  const hues = [["#2e9e6b", "#ff7eb6"], ["#14532d", "#9be3bb"], ["#ff7eb6", "#d9f3e4"]][i % 3];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${hues[0]}'/><stop offset='1' stop-color='${hues[1]}'/></linearGradient></defs><rect width='300' height='400' fill='url(#g)'/><text x='150' y='215' font-size='64' text-anchor='middle'>💚</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ---------- i18n ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $("lang").textContent = lang === "fr" ? "EN" : "FR";
  renderGallery(); renderPoem(); renderSnaps(); startTyping(); tick();
}
$("lang").onclick = () => { lang = lang === "fr" ? "en" : "fr"; localStorage.setItem("lang", lang); applyLang(); };

/* ---------- Texte qui s'écrit ---------- */
let typeTimer;
function startTyping() {
  clearTimeout(typeTimer);
  const lines = t("typed"); let l = 0, c = 0, del = false;
  (function step() {
    const s = lines[l];
    $("typed").textContent = s.slice(0, c);
    if (!del && c === s.length) { del = true; typeTimer = setTimeout(step, 1800); return; }
    if (del && c === 0) { del = false; l = (l + 1) % lines.length; }
    c += del ? -1 : 1;
    typeTimer = setTimeout(step, del ? 30 : 70);
  })();
}

/* ---------- Compteur ---------- */
function tick() {
  const diff = Math.max(0, Date.now() - new Date(CONFIG.startDate).getTime());
  const v = [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60];
  $("counter").innerHTML = ["d", "h", "m", "s"].map((k, i) => `<div><b>${v[i]}</b><span>${t(k)}</span></div>`).join("");
}
setInterval(tick, 1000);

/* ---------- Galerie + lightbox ---------- */
let photoList = [], lbIndex = 0;
function renderGallery() {
  const real = CONFIG.photos.length > 0;
  photoList = real ? CONFIG.photos : [0, 1, 2, 3, 4, 5].map((i) => ({ src: placeholder(i), fr: t("photos_empty"), en: t("photos_empty") }));
  $("gallery").innerHTML = "";
  photoList.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<img src="${p.src}" alt="" loading="lazy"><div class="cap">${p[lang] || ""}</div>`;
    card.onclick = () => openLb(i);
    // effet 3D qui suit la souris
    card.onmousemove = (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale(1.05)`;
    };
    card.onmouseleave = () => (card.style.transform = "");
    $("gallery").appendChild(card);
  });
}
function openLb(i) { lbIndex = i; showLb(); $("lightbox").hidden = false; }
function showLb() { const p = photoList[lbIndex]; $("lbImg").src = p.src; $("lbCap").textContent = p[lang] || ""; }
function stepLb(d) { lbIndex = (lbIndex + d + photoList.length) % photoList.length; showLb(); }
$("lbClose").onclick = () => ($("lightbox").hidden = true);
$("lbPrev").onclick = () => stepLb(-1);
$("lbNext").onclick = () => stepLb(1);
document.addEventListener("keydown", (e) => {
  if ($("lightbox").hidden) return;
  if (e.key === "Escape") $("lightbox").hidden = true;
  if (e.key === "ArrowLeft") stepLb(-1);
  if (e.key === "ArrowRight") stepLb(1);
});

/* ---------- Poèmes ---------- */
let poemIdx = 0;
function renderPoem() {
  const p = POEMS[poemIdx];
  const el = $("poem");
  el.style.animation = "none"; el.offsetHeight; el.style.animation = "";
  el.innerHTML = `<h3>${p.title[lang]}</h3>${p.text[lang]}`;
  $("poemDots").innerHTML = POEMS.map((_, i) => `<i class="${i === poemIdx ? "on" : ""}" data-i="${i}"></i>`).join("");
  $("poemDots").querySelectorAll("i").forEach((d) => (d.onclick = () => { poemIdx = +d.dataset.i; renderPoem(); }));
}
$("prevPoem").onclick = () => { poemIdx = (poemIdx - 1 + POEMS.length) % POEMS.length; renderPoem(); };
$("nextPoem").onclick = () => { poemIdx = (poemIdx + 1) % POEMS.length; renderPoem(); };

/* ---------- Snaps ---------- */
function renderSnaps() {
  const g = $("snapGrid");
  if (!CONFIG.videos.length) { g.innerHTML = `<div class="snap"><div class="empty">${t("snaps_empty")}</div></div>`; return; }
  g.innerHTML = CONFIG.videos.map((v) => `<div class="snap"><video src="${v}" controls playsinline preload="metadata"></video></div>`).join("");
}

/* ---------- Raisons ---------- */
let reasonIdx = -1;
$("reasonBtn").onclick = (e) => {
  const list = REASONS[lang];
  let n; do { n = Math.floor(Math.random() * list.length); } while (n === reasonIdx && list.length > 1);
  reasonIdx = n; $("reasonBox").textContent = list[n];
  hearts(e.clientX, e.clientY, 6);
};

/* ---------- Surprise ---------- */
$("surprise").onclick = (e) => {
  const l = $("letter"); l.hidden = false; l.textContent = LETTER[lang];
  l.scrollIntoView({ behavior: "smooth", block: "center" });
  hearts(innerWidth / 2, innerHeight / 2, 40);
};
function hearts(x, y, n) {
  for (let i = 0; i < n; i++) {
    const h = document.createElement("span");
    h.className = "heart-fx"; h.textContent = ["💚", "💗", "🌸", "🍃"][i % 4];
    h.style.left = x + (Math.random() - 0.5) * 240 + "px"; h.style.top = y + (Math.random() - 0.5) * 80 + "px";
    h.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(h); setTimeout(() => h.remove(), 2400);
  }
}

/* ---------- Pétales / feuilles qui tombent ---------- */
(function () {
  const cv = $("petals"), ctx = cv.getContext("2d");
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
  size(); addEventListener("resize", size);
  const colors = ["#ff9fcb", "#ffc2de", "#6fcf97", "#a8e6c3"];
  const ps = Array.from({ length: 36 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: 5 + Math.random() * 8,
    s: 0.4 + Math.random() * 0.9, d: Math.random() * 6.28, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  let mx = -999, my = -999;
  addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => {
      p.y += p.s; p.d += 0.02; p.x += Math.sin(p.d) * 0.6;
      const dx = p.x - mx, dy = p.y - my;
      if (dx * dx + dy * dy < 6400) { p.x += dx * 0.05; p.y += dy * 0.05; } // fuient la souris
      if (p.y > cv.height + 20) { p.y = -20; p.x = Math.random() * cv.width; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.d);
      ctx.fillStyle = p.c; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r / 2, 0, 0, 6.28); ctx.fill(); ctx.restore();
    });
    requestAnimationFrame(loop);
  })();
})();

applyLang();
