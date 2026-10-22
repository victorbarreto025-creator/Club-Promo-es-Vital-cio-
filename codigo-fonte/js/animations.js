// Etapa 1 — animações de rolagem e mouse. Um único listener de scroll (rAF, passivo).
// A linha do fluxo do bot continua no motor de js/app.js (não há segundo motor de scroll para ela).
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var $ = function (s) { return document.querySelector(s); };

  /* 1 · cartões que empilham: sticky em CSS; aqui só encolhe/escurece os que ficam por baixo */
  var ul = $(".inc"), cards = ul ? [].slice.call(ul.children) : [], tops = [], seen = [];
  function measure() { tops = cards.map(function (c) { return parseFloat(getComputedStyle(c).top) || 0; }); }
  function stack() {
    var r = ul.getBoundingClientRect();
    if (r.bottom < -300 || r.top > innerHeight + 300) return;
    var n = cards.length, ps = [], i, j;
    for (i = 0; i < n - 1; i++) {
      var nx = cards[i + 1];
      ps[i] = clamp(1 - (nx.getBoundingClientRect().top - tops[i + 1]) / (nx.offsetHeight + 20));
    }
    for (i = 0; i < n; i++) {
      var sum = 0; for (j = i; j < n - 1; j++) sum += ps[j];
      var q = Math.round(sum * 200);
      if (seen[i] === q) continue; seen[i] = q;
      cards[i].style.transform = sum ? "scale(" + (1 - 0.04 * sum).toFixed(4) + ")" : "";
      cards[i].style.setProperty("--dim", (0.07 * sum).toFixed(3));
    }
  }

  /* 4 · texto que se preenche: zona de degradê de 3 palavras, cinza → verde */
  var box = $(".fillt"), words = [].slice.call(document.querySelectorAll(".fw")), fseen = [];
  var G = [195, 205, 199], V = [22, 163, 74];
  function fillText() {
    var r = box.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return;
    var p = clamp((vh * 0.85 - r.top) / (vh * 0.35 + r.height)), pos = p * (words.length + 3);
    words.forEach(function (w, i) {
      var f = clamp((pos - i) / 3), q = Math.round(f * 20);
      if (fseen[i] === q) return; fseen[i] = q;
      var k = q / 20;
      w.style.color = "rgb(" + [0, 1, 2].map(function (c) { return Math.round(G[c] + (V[c] - G[c]) * k); }).join(",") + ")";
    });
  }

  var tick = 0;
  function onScroll() {
    if (tick) return;
    tick = requestAnimationFrame(function () {
      tick = 0;
      if (ul && !reduce) stack();
      if (box && !reduce) fillText();
    });
  }
  if (!reduce && (ul || box)) {
    if (ul) measure();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", function () { if (ul) { seen = []; measure(); } fseen = []; onScroll(); });
    addEventListener("load", function () { if (ul) measure(); onScroll(); });
    onScroll();
  }

  /* 5 · luz que segue o mouse (somente dispositivos com mouse) */
  var fin = $(".final");
  if (fin && !reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf = 0;
    var step = function () {
      raf = 0; cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      fin.style.setProperty("--mx", cx.toFixed(1) + "px"); fin.style.setProperty("--my", cy.toFixed(1) + "px");
      if (on && (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3)) raf = requestAnimationFrame(step);
    };
    fin.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = fin.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on) { on = true; cx = tx; cy = ty; fin.classList.add("lit"); }
      if (!raf) raf = requestAnimationFrame(step);
    });
    fin.addEventListener("pointerleave", function () { on = false; fin.classList.remove("lit"); });
  }
})();
