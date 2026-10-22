// Etapa 2 — robô 3D verde que acompanha a rolagem (Three.js 0.160.0 via import map).
// Independente de app.js e animations.js: só lê scrollY e as posições reais das seções.
// Se WebGL ou o CDN falharem, nada acontece e o site segue normal.
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saver = navigator.connection && navigator.connection.saveData;
  if (reduce || saver) return;

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerpAngle = function (a, b, t) { var d = ((b - a + 540) % 360) - 180; return a + d * t; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var RAD = Math.PI / 180;

  // Keyframes por seção. K = rolagem em que a seção real (posição medida) está no ponto vf da tela.
  // Posição: função (retângulo congelado da seção, largura, altura) → [x, y] em px da tela.
  // d = desktop, m = celular (<900px; posições próprias, robô menor, sempre junto à borda).
  var P = function (fx, fy, dx) { return function (r, w, h) { return [w * fx + (dx || 0), h * fy]; }; };
  var KF = [
    { sel: ".top", f: 0, vf: 0,
      d: { fn: P(0.8, 0.42), s: 1, r: [-4, -24, 3], o: 1, h: 0.3 },
      m: { at: ".hero .badge", fn: function (r, w) { return [w - 40, r.top + r.height / 2]; }, s: 0.9, r: [-4, -18, 4], o: 1, h: 0.3 } },
    { sel: ".demo", f: 0.5, vf: 0.5,
      d: { fn: P(0.87, 0.52), s: 0.88, r: [8, -32, -5], o: 1, h: 0 },
      m: { fn: P(1, 0.55, -8), s: 0.8, r: [6, -26, -6], o: 1, h: 0 } },
    { sel: ".fill", f: 0.5, vf: 0.5,
      d: { fn: P(0.85, 0.4), s: 0.8, r: [-8, -16, 5], o: 1, h: 0.6 },
      m: { fn: P(1, 0.42, -8), s: 0.75, r: [-6, -22, 6], o: 1, h: 0.6 } },
    { sel: "#video", f: 0.5, vf: 0.5,
      d: { fn: P(0.92, 0.3), s: 0.6, r: [4, -34, -3], o: 0.6, h: 0 },
      m: { fn: P(1, 0.14, 2), s: 0.55, r: [4, -30, -3], o: 0.6, h: 0 } },
    { sel: "#results", f: 0.5, vf: 0.5,
      d: { fn: P(0.89, 0.55), s: 0.85, r: [6, -28, 4], o: 1, h: 0.2 },
      m: { fn: P(1, 0.5, -8), s: 0.75, r: [6, -24, 5], o: 1, h: 0.2 } },
    { sel: ".inc", f: 0.5, vf: 0.5,
      d: { fn: P(0.82, 0.46), s: 0.8, r: [-6, -22, -4], o: 1, h: 0.1 },
      m: { fn: P(1, 0.5, -8), s: 0.72, r: [-6, -24, -5], o: 1, h: 0.1 } },
    { sel: ".final", f: 0, vf: 0.45,
      d: { fn: P(0.79, 0.58), s: 1.2, r: [-8, -14, 2], o: 1, h: 1 },
      m: { at: ".final", fn: function (r, w) { return [w - 40, r.top - 6]; }, s: 1, r: [-6, -12, 3], o: 1, h: 1 } },
  ];

  function start() {
    var canvas = document.createElement("canvas");
    canvas.id = "bot3d"; canvas.setAttribute("aria-hidden", "true");
    var gl = null;
    try { gl = canvas.getContext("webgl2") || canvas.getContext("webgl"); } catch (e) {}
    if (!gl) return;
    import("three").then(function (T) { run(T, canvas, gl); }).catch(function () {});
  }

  function run(T, canvas, gl) {
    var mobile = innerWidth < 900;
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, context: gl, antialias: true, alpha: true, powerPreference: "default" });
    } catch (e) { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    canvas.style.opacity = "0";
    document.body.appendChild(canvas);

    var scene = new T.Scene();
    var FOV = 30, DIST = 9, VISH = 2 * Math.tan(FOV * RAD / 2) * DIST;
    var camera = new T.PerspectiveCamera(FOV, 1, 0.1, 40); camera.position.set(0, 0, DIST);

    // ---- ambiente de reflexo gerado na hora (sem texturas externas)
    var env = null;
    try {
      var es = new T.Scene();
      es.add(new T.Mesh(new T.BoxGeometry(12, 12, 12), new T.MeshBasicMaterial({ color: 0x8fa59a, side: T.BackSide })));
      var panel = function (w, h, pos, k, col) {
        var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(col || 0xffffff).multiplyScalar(k), side: T.DoubleSide }));
        m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); es.add(m);
      };
      panel(6, 4, [0, 5.5, 2], 6); panel(3, 6, [5.5, 1, 3], 4); panel(3, 5, [-5.5, 0, 2], 2.2, 0xbfffd8);
      var pm = new T.PMREMGenerator(renderer); env = pm.fromScene(es, 0.04).texture; pm.dispose();
    } catch (e) { env = null; }

    // ---- luzes
    scene.add(new T.HemisphereLight(0xffffff, 0xcdeedb, 0.9));
    var key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 4); scene.add(key);
    var fill = new T.DirectionalLight(0xe6fff0, 0.6); fill.position.set(-3, 0.5, 3); scene.add(fill);
    var rim = new T.PointLight(0x22c55e, 30, 9, 2); rim.position.set(-2.5, 1, -1.5); scene.add(rim);

    // ---- materiais
    var seg = mobile ? 24 : 40, seg2 = mobile ? 16 : 28;
    var phys = function (o) { var m = new T.MeshPhysicalMaterial(o); if (env) m.envMap = env; return m; };
    var white = phys({ color: 0xf7faf8, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });
    var green = phys({ color: 0x16a34a, roughness: 0.3, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.8 });
    var visorM = phys({ color: 0x0b2a1b, roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1 });
    var glowM = new T.MeshBasicMaterial({ color: 0x4ade80, toneMapped: false });

    var gc = document.createElement("canvas"); gc.width = gc.height = 64;
    var g2 = gc.getContext("2d"), gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(74,222,128,.9)"); gr.addColorStop(0.4, "rgba(34,197,94,.35)"); gr.addColorStop(1, "rgba(34,197,94,0)");
    g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    var glowTex = new T.CanvasTexture(gc); glowTex.colorSpace = T.SRGBColorSpace;
    var sprite = function (sx, sy, x, y, z, op) {
      var s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
      s.scale.set(sx, sy, 1); s.position.set(x, y, z); return s;
    };
    var mesh = function (geo, mat, x, y, z) { var m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };

    // ---- robô (geometrias próprias)
    var root = new T.Group(); root.rotation.order = "YXZ"; scene.add(root);
    var model = new T.Group(); model.position.y = 0.08; root.add(model);
    var MODEL_H = 2.3;

    var head = new T.Group(); head.position.y = 0.28; model.add(head);
    var skull = mesh(new T.SphereGeometry(0.62, seg, seg2), white, 0, 0, 0); skull.scale.set(1.08, 0.92, 0.96); head.add(skull);
    var visor = mesh(new T.SphereGeometry(0.5, seg, seg2), visorM, 0, -0.02, 0.36); visor.scale.set(0.95, 0.66, 0.6); head.add(visor);
    var eyeGeo = new T.SphereGeometry(0.1, 20, 16), eyes = [];
    [-0.17, 0.17].forEach(function (x) {
      var e = mesh(eyeGeo, glowM, x, 0.03, 0.625); e.scale.set(0.85, 1.3, 0.4); head.add(e); eyes.push(e);
      head.add(sprite(0.42, 0.5, x, 0.03, 0.68, 0.5));
    });
    var mouth = mesh(new T.TorusGeometry(0.075, 0.013, 8, 24, Math.PI), glowM, 0, -0.1, 0.645); mouth.rotation.z = Math.PI; head.add(mouth);
    [-1, 1].forEach(function (s) {
      var ear = mesh(new T.CylinderGeometry(0.15, 0.15, 0.12, 24), green, s * 0.67, 0, 0); ear.rotation.z = Math.PI / 2; head.add(ear);
      var cap = mesh(new T.CylinderGeometry(0.09, 0.09, 0.125, 20), white, s * 0.67, 0, 0); cap.rotation.z = Math.PI / 2; head.add(cap);
    });
    var ant = new T.Group(); ant.position.set(0, 0.55, 0); head.add(ant);
    ant.add(mesh(new T.CylinderGeometry(0.022, 0.022, 0.26, 10), white, 0, 0.15, 0));
    ant.add(mesh(new T.SphereGeometry(0.075, 20, 16), glowM, 0, 0.3, 0));
    var antGlow = sprite(0.5, 0.5, 0, 0.3, 0.02, 0.6); ant.add(antGlow);

    var body = new T.Group(); body.position.y = -0.6; model.add(body);
    var torso = mesh(new T.SphereGeometry(0.4, seg, seg2), white, 0, 0, 0); torso.scale.set(1, 1.05, 0.9); body.add(torso);
    var belt = mesh(new T.TorusGeometry(0.4, 0.03, 12, seg), green, 0, -0.05, 0); belt.scale.set(1, 0.9, 1); belt.rotation.x = Math.PI / 2; body.add(belt);
    var neck = mesh(new T.TorusGeometry(0.32, 0.03, 12, seg), green, 0, 0.3, 0); neck.rotation.x = Math.PI / 2; body.add(neck);
    var chest = mesh(new T.SphereGeometry(0.075, 20, 16), glowM, 0, 0.1, 0.34); chest.scale.set(1, 1, 0.35); body.add(chest);
    var chestGlow = sprite(0.38, 0.38, 0, 0.1, 0.4, 0.5); body.add(chestGlow);
    var arms = [];
    [-1, 1].forEach(function (s) {
      var pivot = new T.Group(); pivot.position.set(s * 0.4, 0.2, 0); body.add(pivot);
      pivot.add(mesh(new T.CapsuleGeometry(0.06, 0.2, 6, 12), white, 0, -0.14, 0));
      pivot.add(mesh(new T.SphereGeometry(0.08, 16, 12), green, 0, -0.32, 0));
      arms.push({ p: pivot, s: s });
    });
    var under = sprite(1.5, 0.5, 0, -1.28, 0, 0.5); model.add(under);

    // ---- medição das seções reais
    var vw = 1, vh = 1, frames = [];
    function measure() {
      vw = innerWidth; vh = innerHeight; mobile = vw < 900;
      var sy = scrollY, maxS = Math.max(0, document.documentElement.scrollHeight - vh), list = [];
      KF.forEach(function (k) {
        var el = document.querySelector(k.sel); if (!el) return;
        var r = el.getBoundingClientRect(), top = r.top + sy;
        var K = top + r.height * k.f - vh * k.vf;
        var cfg = mobile ? k.m : k.d, fr = { left: r.left, top: top - K, width: r.width, height: r.height };
        if (cfg.at) { var e2 = document.querySelector(cfg.at); if (e2) { var r2 = e2.getBoundingClientRect(); fr = { left: r2.left, top: r2.top + sy - K, width: r2.width, height: r2.height }; } }
        var p = cfg.fn(fr, vw, vh);
        list.push({ K: K, x: p[0], y: p[1], s: cfg.s, rx: cfg.r[0], ry: cfg.r[1], rz: cfg.r[2], o: cfg.o, h: cfg.h });
      });
      list.sort(function (a, b) { return a.K - b.K; });
      list.forEach(function (f, i) { if (i > 0 && f.K <= list[i - 1].K) f.K = list[i - 1].K + 1; });
      var last = list[list.length - 1]; if (last && last.K > maxS - 10) last.K = Math.max(maxS - 10, list.length > 1 ? list[list.length - 2].K + 1 : 0);
      frames = list;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
      renderer.setSize(vw, vh, false);
      camera.aspect = vw / vh; camera.updateProjectionMatrix();
    }
    var mt = 0; var remeasure = function () { clearTimeout(mt); mt = setTimeout(measure, 150); };
    measure();
    addEventListener("resize", remeasure);
    addEventListener("load", remeasure);
    if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);

    // ---- cursor (somente mouse): olhar e leve inclinação
    var ptr = { x: 0, y: 0, on: false };
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; }, { passive: true });
      document.addEventListener("mouseleave", function () { ptr.on = false; });
    }

    // ---- laço de animação
    var cur = null, tgt = {}, look = { x: 0, y: 0 }, lean = { x: 0, z: 0 }, lastY = scrollY, vY = 0, prev = null;
    var t0 = 0, last = 0, raf = 0, intro = 0, nextBlink = 2, blink = -1, lastOp = -1;
    function pose(sy) {
      var n = frames.length; if (!n) return null;
      if (sy <= frames[0].K) return { a: frames[0], b: frames[0], e: 0 };
      if (sy >= frames[n - 1].K) return { a: frames[n - 1], b: frames[n - 1], e: 0 };
      var i = 0; while (i < n - 2 && sy >= frames[i + 1].K) i++;
      var a = frames[i], b = frames[i + 1];
      return { a: a, b: b, e: ease(clamp((sy - a.K) / (b.K - a.K), 0, 1)) };
    }
    function frame(ts) {
      raf = 0; if (document.hidden) return;
      var time = ts / 1000, dt = Math.min(0.05, last ? time - last : 0.016); last = time; if (!t0) t0 = time;
      var sy = scrollY, ps = pose(sy);
      if (!ps) { raf = requestAnimationFrame(frame); return; }
      var a = ps.a, b = ps.b, e = ps.e, arc = Math.sin(Math.PI * e) * (mobile ? 0 : vw * 0.035);
      tgt.x = lerp(a.x, b.x, e) + arc; tgt.y = lerp(a.y, b.y, e); tgt.s = lerp(a.s, b.s, e);
      tgt.rx = lerpAngle(a.rx, b.rx, e); tgt.ry = lerpAngle(a.ry, b.ry, e); tgt.rz = lerpAngle(a.rz, b.rz, e);
      tgt.o = lerp(a.o, b.o, e); tgt.h = lerp(a.h, b.h, e);
      if (!cur) cur = { x: tgt.x, y: tgt.y, s: tgt.s, rx: tgt.rx, ry: tgt.ry, rz: tgt.rz, o: tgt.o, h: tgt.h };
      var k = 1 - Math.exp(-dt * 3.2);
      cur.x = lerp(cur.x, tgt.x, k); cur.y = lerp(cur.y, tgt.y, k); cur.s = lerp(cur.s, tgt.s, k);
      cur.rx = lerpAngle(cur.rx, tgt.rx, k); cur.ry = lerpAngle(cur.ry, tgt.ry, k); cur.rz = lerpAngle(cur.rz, tgt.rz, k);
      cur.o = lerp(cur.o, tgt.o, k); cur.h = lerp(cur.h, tgt.h, k);

      // inclinação durante as transições (velocidade de rolagem e deslocamento lateral)
      vY = lerp(vY, dt ? (sy - lastY) / dt : 0, 1 - Math.exp(-dt * 6)); lastY = sy;
      var vx = prev && dt ? (cur.x - prev.x) / dt : 0; prev = { x: cur.x };
      lean.x = lerp(lean.x, clamp(vY / 3000, -1, 1) * 14, k);
      lean.z = lerp(lean.z, clamp(-vx / (vw * 1.2), -1, 1) * 18, k);

      // entrada suave
      intro = Math.min(1, intro + dt / 1.6); var ie = 1 - Math.pow(1 - intro, 3);

      // olhar acompanha o cursor, discretamente
      var tx = 0, ty = 0;
      if (ptr.on) { tx = clamp((ptr.x - cur.x) / (vw * 0.5), -1, 1); ty = clamp((ptr.y - cur.y) / (vh * 0.5), -1, 1); }
      look.x = lerp(look.x, tx, k); look.y = lerp(look.y, ty, k);

      var hover = Math.sin(time * 2.1) * 0.045 + Math.sin(time * 3.7) * 0.015;
      var wpp = VISH / vh, base = (mobile ? 78 : 150) * cur.s * (0.35 + 0.65 * ie);
      var sc = base * wpp / MODEL_H;
      root.scale.setScalar(sc);
      root.position.set((cur.x - vw / 2) * wpp, -(cur.y - vh / 2) * wpp + hover * 2.5 * sc, 0);
      root.rotation.set(
        (cur.rx + lean.x + Math.sin(time * 1.1) * 2) * RAD,
        (cur.ry + (1 - ie) * 140 + Math.sin(time * 0.9) * 6) * RAD,
        (cur.rz + lean.z + Math.sin(time * 1.3) * 2.2) * RAD
      );
      head.rotation.y = look.x * 0.35; head.rotation.x = look.y * 0.2;
      ant.rotation.z = Math.sin(time * 2.6) * 0.14 - look.x * 0.1;

      // olhos: piscar + sorriso conforme a seção
      if (blink < 0 && time - t0 > nextBlink) { blink = 0; nextBlink = time - t0 + 2.5 + Math.random() * 3; }
      var bs = 1;
      if (blink >= 0) { blink += dt / 0.14; bs = Math.abs(1 - 2 * Math.min(1, blink)) * 0.9 + 0.1; if (blink >= 1) blink = -1; }
      var hs = 1 - cur.h * 0.25;
      eyes.forEach(function (ey, i) {
        ey.scale.set(0.85, 1.3 * hs * bs, 0.4);
        ey.position.x = (i ? 0.17 : -0.17) + look.x * 0.025; ey.position.y = 0.03 - look.y * 0.02;
      });
      mouth.scale.setScalar(1 + cur.h * 0.7);
      antGlow.material.opacity = 0.45 + Math.sin(time * 3.2) * 0.2;
      chestGlow.material.opacity = 0.4 + Math.sin(time * 2.2 + 1) * 0.15;
      under.material.opacity = 0.42 + Math.sin(time * 2.1) * 0.12; under.scale.x = 1.5 + Math.sin(time * 2.1) * 0.12;
      arms.forEach(function (ar) { ar.p.rotation.z = ar.s * (0.45 + Math.sin(time * 2.1 + (ar.s > 0 ? 0 : 1.6)) * 0.12 + cur.h * 0.1); });

      var op = clamp(cur.o * ie, 0, 1);
      if (Math.abs(op - lastOp) > 0.004) { canvas.style.opacity = op.toFixed(3); lastOp = op; }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    var go = function () { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
    document.addEventListener("visibilitychange", function () { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else go(); });
    canvas.addEventListener("webglcontextlost", function (ev) { ev.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; canvas.style.display = "none"; });
    go();
  }

  // Carrega depois do conteúdo principal, sem bloquear a página.
  var boot = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(start, { timeout: 1500 }); };
  if (document.readyState === "complete") boot(); else addEventListener("load", boot);
})();
