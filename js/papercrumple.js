/* PaperCrumple (version JS pur, three.js r128)
 * Mêmes props que le composant React :
 *   new PaperCrumple(element, { src, width, height, sceneHeight, ... })
 * Maintiens le clic / le doigt : le papier se froisse. Relâche : il se défroisse.
 * paper.setSource(canvasOuImage) change le contenu imprimé sur le papier.
 */
(function () {
  const DEFAULTS = {
    src: null, alt: "", width: 400, height: 400, sceneHeight: 360,
    releaseBehavior: "restore", // "restore" | "hold"
    crumpleAmount: 0.85, crumpleDuration: 0.55, releaseDuration: 0.4,
    foldCount: 6, foldSharpness: 0.6, wrinkleDepth: 0.65, creaseStrength: 0.18,
    paperColor: "#f4f0e8", paperTexture: 0.08,
    draggable: true, returnToOrigin: true, imageFit: "contain",
    roughness: 0.92, lightIntensity: 1.8, lightAngle: -35,
    shadow: true, shadowOpacity: 0.16,
    dragRotation: 10, dragRadius: 180, rotation: 0, seed: 7, detail: 64, disabled: false,
  };

  const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  class PaperCrumple {
    constructor(el, opts = {}) {
      this.o = Object.assign({}, DEFAULTS, opts);
      this.el = el;
      this.progress = 0; this.target = 0; this.held = false;
      this.pos = { x: 0, y: 0 }; this.posTarget = { x: 0, y: 0 };
      this.down = null; this.visible = true; this.last = performance.now();
      this.source = null;
      el.classList.add("paper-scene");
      el.style.height = this.o.sceneHeight + "px";
      el.style.maxWidth = this.o.width + "px";
      this.ok = this._init();
      if (this.ok && this.o.src) { const im = new Image(); im.onload = () => this.setSource(im); im.src = this.o.src; }
    }

    _init() {
      const o = this.o, THREE = window.THREE;
      if (!THREE) return false;
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (e) { return false; }
      const r = this.renderer;
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.shadowMap.enabled = !!o.shadow;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      this.el.appendChild(r.domElement);
      r.domElement.setAttribute("role", "img");
      r.domElement.setAttribute("aria-label", o.alt || "");
      r.domElement.style.touchAction = "none";
      r.domElement.style.cursor = o.disabled ? "default" : "grab";

      const scene = (this.scene = new THREE.Scene());
      const H = 3, W = H * (o.width / o.height);
      this.W = W; this.H = H;
      this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

      // lumière
      const a = (o.lightAngle * Math.PI) / 180;
      const light = new THREE.DirectionalLight(0xffffff, o.lightIntensity);
      light.position.set(Math.sin(a) * 5, 4, 5);
      light.castShadow = !!o.shadow;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.radius = 6;
      Object.assign(light.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
      scene.add(light, new THREE.AmbientLight(0xffffff, 0.55));

      // papier
      const g = (this.geo = new THREE.PlaneGeometry(W, H, o.detail, o.detail));
      this.orig = g.attributes.position.array.slice();
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
      this.tex = new THREE.CanvasTexture(document.createElement("canvas"));
      this.tex.encoding = THREE.sRGBEncoding;
      this.tex.anisotropy = 4;
      this.mat = new THREE.MeshStandardMaterial({ map: this.tex, vertexColors: true, roughness: o.roughness, metalness: 0, side: THREE.DoubleSide });
      this.mesh = new THREE.Mesh(g, this.mat);
      this.mesh.castShadow = this.mesh.receiveShadow = !!o.shadow;
      scene.add(this.mesh);

      if (o.shadow) {
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: o.shadowOpacity }));
        ground.position.z = -0.45; ground.receiveShadow = true; scene.add(ground);
      }

      // plis (déterministes grâce à seed)
      const rand = rng(o.seed);
      this.folds = Array.from({ length: o.foldCount }, () => {
        const ang = rand() * Math.PI;
        return { c: Math.cos(ang), s: Math.sin(ang), f: 1.5 + rand() * 3.2, p: rand(), amp: 0.5 + rand() * 0.5, sign: rand() < 0.5 ? -1 : 1 };
      });
      this.noise = Array.from({ length: 4 }, () => ({ fx: 5 + rand() * 9, fy: 5 + rand() * 9, px: rand() * 6.28, py: rand() * 6.28 }));

      this._bind();
      this._resize();
      new ResizeObserver(() => this._resize()).observe(this.el);
      new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; if (this.visible) this._loop(); }).observe(this.el);
      this._deform(0);
      this.mesh.rotation.z = (o.rotation * Math.PI) / 180;
      this._loop();
      return true;
    }

    /* ---- contenu imprimé : papier + grain + image/canvas ---- */
    setSource(src) {
      this.source = src;
      if (!this.ok) return;
      const o = this.o, S = 2;
      const cw = o.width * S, ch = o.height * S;
      const c = this.tex.image;
      c.width = cw; c.height = ch;
      const x = c.getContext("2d");
      x.fillStyle = o.paperColor; x.fillRect(0, 0, cw, ch);
      const rnd = rng(o.seed + 1);
      const n = Math.floor(cw * ch * o.paperTexture * 0.02);
      for (let i = 0; i < n; i++) {
        x.fillStyle = rnd() < 0.5 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.12)";
        x.fillRect(rnd() * cw, rnd() * ch, 1 + rnd() * 2, 1 + rnd() * 2);
      }
      if (src) {
        const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
        const k = (o.imageFit === "cover" ? Math.max : Math.min)(cw / sw, ch / sh);
        x.drawImage(src, (cw - sw * k) / 2, (ch - sh * k) / 2, sw * k, sh * k);
      }
      this.tex.needsUpdate = true;
    }

    /* ---- déformation : c = 0 (plat) -> 1 (très froissé) ---- */
    _deform(p) {
      const o = this.o, W = this.W, H = this.H;
      const c = p * o.crumpleAmount;
      const pos = this.geo.attributes.position.array, col = this.geo.attributes.color.array, org = this.orig;
      const e = 1 + o.foldSharpness * 3.5;
      for (let i = 0; i < pos.length; i += 3) {
        const x0 = org[i] / W, y0 = org[i + 1] / H; // -0.5..0.5
        let z = 0, crease = 0;
        for (const f of this.folds) {
          const d = (x0 * f.c + y0 * f.s) * f.f + f.p, t = d - Math.floor(d);
          const tri = Math.pow(1 - Math.abs(2 * t - 1), e);
          z += (tri - 0.35) * f.amp * f.sign; crease += tri * f.amp;
        }
        let nx = 0, ny = 0;
        for (const n of this.noise) { nx += Math.sin(x0 * n.fx + n.px) * Math.sin(y0 * n.fy + n.py); ny += Math.cos(x0 * n.fy + n.py) * Math.sin(y0 * n.fx + n.px); }
        const wr = o.wrinkleDepth;
        z = z * wr * 0.28 + nx * wr * 0.05 + (x0 * x0 + y0 * y0) * 0.9 * wr;
        const sh = 1 - 0.42 * c;
        pos[i] = (x0 * sh + nx * 0.02 * c) * W;
        pos[i + 1] = (y0 * sh + ny * 0.02 * c) * H;
        pos[i + 2] = z * c * H;
        const dark = 1 - o.creaseStrength * c * (crease / Math.max(1, o.foldCount * 0.5)) * 1.4;
        col[i] = col[i + 1] = col[i + 2] = clamp(dark, 0.55, 1);
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;
      this.geo.computeVertexNormals();
    }

    /* ---- interactions ---- */
    _bind() {
      const el = this.renderer.domElement, o = this.o;
      el.addEventListener("pointerdown", (e) => {
        if (o.disabled) return;
        el.setPointerCapture(e.pointerId);
        el.style.cursor = "grabbing";
        this.down = { x: e.clientX, y: e.clientY };
        this.target = o.releaseBehavior === "hold" && this.held ? 0 : 1;
        this.held = this.target === 1;
        this._loop();
      });
      el.addEventListener("pointermove", (e) => {
        if (!this.down || !o.draggable) return;
        let dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
        const len = Math.hypot(dx, dy);
        if (len > o.dragRadius) { dx *= o.dragRadius / len; dy *= o.dragRadius / len; }
        this.posTarget = { x: dx, y: dy };
      });
      const up = () => {
        if (!this.down) return;
        this.down = null; el.style.cursor = "grab";
        if (o.releaseBehavior === "restore") this.target = 0;
        if (o.returnToOrigin) this.posTarget = { x: 0, y: 0 };
        this._loop();
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    }

    _resize() {
      const w = this.el.clientWidth || this.o.width, h = this.el.clientHeight || this.o.sceneHeight;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = "100%"; this.renderer.domElement.style.height = "100%";
      this.camera.aspect = w / h;
      // le papier doit rentrer en entier dans la scène
      const fov = (this.camera.fov * Math.PI) / 180;
      const needH = this.H * 1.25, needW = (this.W * 1.25) / this.camera.aspect;
      this.camera.position.set(0, 0, (Math.max(needH, needW) / 2) / Math.tan(fov / 2));
      this.camera.updateProjectionMatrix();
      this.pxToWorld = (2 * Math.tan(fov / 2) * this.camera.position.z) / h;
      this._draw();
    }

    _loop() {
      if (this.raf) return;
      this.last = performance.now();
      const step = (now) => {
        this.raf = null;
        const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
        const o = this.o;
        // progression vers la cible
        if (this.progress !== this.target) {
          const dur = this.target > this.progress ? o.crumpleDuration : o.releaseDuration;
          const d = dt / Math.max(0.01, dur);
          this.progress = this.target > this.progress ? Math.min(this.target, this.progress + d) : Math.max(this.target, this.progress - d);
          this._deform(ease(this.progress));
        }
        // position (suivi doux)
        const k = 1 - Math.pow(0.0005, dt);
        this.pos.x += (this.posTarget.x - this.pos.x) * k;
        this.pos.y += (this.posTarget.y - this.pos.y) * k;
        this.mesh.position.set(this.pos.x * this.pxToWorld, -this.pos.y * this.pxToWorld, 0);
        this.mesh.rotation.z = ((o.rotation - (this.pos.x / o.dragRadius) * o.dragRotation) * Math.PI) / 180;
        this.mesh.rotation.x = ((this.pos.y / o.dragRadius) * o.dragRotation * 0.6 * Math.PI) / 180;
        this._draw();
        const moving = this.progress !== this.target || Math.abs(this.pos.x - this.posTarget.x) > 0.05 || Math.abs(this.pos.y - this.posTarget.y) > 0.05;
        if (moving && this.visible) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }

    _draw() { this.renderer.render(this.scene, this.camera); }
  }

  window.PaperCrumple = PaperCrumple;
})();
