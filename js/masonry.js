/* Masonry (version JS pur + GSAP) — mêmes props que le composant React.
 *   const m = new Masonry(element, { items: [{ id, img, caption, height? }], ... })
 * Les photos arrivent (par le bas, floutées) quand la galerie devient visible,
 * se replacent en douceur au redimensionnement, et zooment légèrement au survol.
 * item.height (optionnel) : sinon on garde le ratio réel de l'image.
 */
(function () {
  const QUERIES = ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"];
  const COLUMNS = [5, 4, 3, 2];

  class Masonry {
    constructor(el, opts) {
      Object.assign(
        this,
        { ease: "power3.out", duration: 0.6, stagger: 0.05, animateFrom: "bottom", scaleOnHover: true, hoverScale: 0.95, blurToFocus: true, colorShiftOnHover: false, onItemClick: null },
        opts
      );
      this.el = el;
      this.el.classList.add("list");
      this.nodes = new Map();
      this.grid = [];
      this.width = 0;
      this.ready = false;     // images chargées
      this.visible = false;   // section entrée à l'écran
      this.hasMounted = false;
      this.columns = this._columns();

      this._build();
      this._preload().then(() => { this.ready = true; this._layout(); });

      this.ro = new ResizeObserver(([e]) => { this.width = e.contentRect.width; this._layout(); });
      this.ro.observe(el);
      this.io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { this.visible = true; this.io.disconnect(); this._layout(); } }, { threshold: 0.15 });
      this.io.observe(el);
      QUERIES.forEach((q) => matchMedia(q).addEventListener("change", () => { this.columns = this._columns(); this._layout(); }));
    }

    _columns() {
      const i = QUERIES.findIndex((q) => matchMedia(q).matches);
      return i === -1 ? 2 : COLUMNS[i];
    }

    _build() {
      this.items.forEach((item) => {
        const w = document.createElement("div");
        w.className = "item-wrapper";
        w.dataset.key = item.id;
        w.style.opacity = 0;
        w.innerHTML = `<div class="item-img"><div class="cap"></div>${this.colorShiftOnHover ? '<div class="color-overlay"></div>' : ""}</div>`;
        w.querySelector(".item-img").style.backgroundImage = `url("${item.img}")`;
        w.querySelector(".cap").textContent = item.caption || "";
        w.addEventListener("click", () => this.onItemClick && this.onItemClick(item));
        w.addEventListener("mouseenter", () => this._hover(w, true));
        w.addEventListener("mouseleave", () => this._hover(w, false));
        this.el.appendChild(w);
        this.nodes.set(item.id, w);
      });
    }

    // met à jour les légendes (changement de langue) sans rejouer l'animation
    setCaptions(map) {
      this.items.forEach((it) => { it.caption = map[it.id] || ""; this.nodes.get(it.id).querySelector(".cap").textContent = it.caption; });
    }

    _preload() {
      return Promise.all(
        this.items.map((it) => new Promise((res) => {
          const im = new Image();
          im.onload = im.onerror = () => { it._ratio = im.naturalWidth ? im.naturalHeight / im.naturalWidth : 4 / 3; res(); };
          im.src = it.img;
        }))
      );
    }

    _initialPos(item) {
      let dir = this.animateFrom;
      if (dir === "random") dir = ["top", "bottom", "left", "right"][Math.floor(Math.random() * 4)];
      const r = this.el.getBoundingClientRect();
      switch (dir) {
        case "top": return { x: item.x, y: -200 };
        case "bottom": return { x: item.x, y: window.innerHeight + 200 };
        case "left": return { x: -200, y: item.y };
        case "right": return { x: window.innerWidth + 200, y: item.y };
        case "center": return { x: r.width / 2 - item.w / 2, y: r.height / 2 - item.h / 2 };
        default: return { x: item.x, y: item.y + 100 };
      }
    }

    _layout() {
      if (!this.width || !this.ready) return;
      const cols = new Array(this.columns).fill(0), cw = this.width / this.columns;
      this.grid = this.items.map((it) => {
        const c = cols.indexOf(Math.min(...cols));
        const h = it.height ? it.height / 2 : cw * (it._ratio || 4 / 3);
        const g = { id: it.id, x: cw * c, y: cols[c], w: cw, h };
        cols[c] += h;
        return g;
      });
      this.el.style.height = Math.max(...cols) + "px";

      if (!this.hasMounted) {
        if (!this.visible) return; // l'intro se joue quand la galerie apparaît
        this.grid.forEach((g, i) => {
          const sel = this.nodes.get(g.id), p = this._initialPos(g);
          gsap.fromTo(
            sel,
            { opacity: 0, x: p.x, y: p.y, width: g.w, height: g.h, ...(this.blurToFocus && { filter: "blur(10px)" }) },
            { opacity: 1, x: g.x, y: g.y, width: g.w, height: g.h, ...(this.blurToFocus && { filter: "blur(0px)" }), duration: 0.8, ease: "power3.out", delay: i * this.stagger }
          );
        });
        this.hasMounted = true;
      } else {
        this.grid.forEach((g) => gsap.to(this.nodes.get(g.id), { x: g.x, y: g.y, width: g.w, height: g.h, duration: this.duration, ease: this.ease, overwrite: "auto" }));
      }
    }

    _hover(w, on) {
      if (this.scaleOnHover) gsap.to(w, { scale: on ? this.hoverScale : 1, duration: 0.3, ease: "power2.out" });
      const o = w.querySelector(".color-overlay");
      if (this.colorShiftOnHover && o) gsap.to(o, { opacity: on ? 0.3 : 0, duration: 0.3 });
    }
  }

  window.Masonry = Masonry;
})();
