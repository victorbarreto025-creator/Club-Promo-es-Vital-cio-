// Motor da demonstração: progresso ligado ao scroll real, prévia automática quando parado.
// Só mexe em transform/opacity/classes (sem re-render do React).
// Efeitos sonoros sintetizados (Web Audio): áudio 100% original. Ligado por padrão; destrava no 1º gesto se o navegador bloquear.
function createSFX() {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, out = null; const last = {};
  const tone = (t, f, d, v, type, f2) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.min(.35, v * 1.6), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.03); };
  const noise = (t, d, v, f0, f1) => { const n = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, n, ctx.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; fl.type = "bandpass"; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.min(.35, v * 1.6), t + d * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl); fl.connect(g); g.connect(out); s.start(t); };
  const S = {
    notif: (t) => { tone(t, 880, .14, .12); tone(t + .09, 1320, .2, .1); },
    type: (t) => noise(t, .03, .05, 2800, 2000),
    activate: (t) => tone(t, 320, .2, .07, "triangle", 880),
    found: (t) => { tone(t, 660, .12, .1); tone(t + .08, 990, .18, .1); },
    process: (t) => [0, .07, .14].forEach((d, i) => tone(t + d, 520 + i * 90, .06, .05, "triangle")),
    ok: (t) => { tone(t, 784, .12, .11); tone(t + .09, 1175, .24, .11); },
    sent: (t) => { noise(t, .16, .06, 1200, 3600); tone(t + .1, 1046, .18, .08); },
    confirm: (t) => { tone(t, 660, .14, .12); tone(t + .1, 880, .14, .12); tone(t + .2, 1320, .3, .12); },
  };
  const KEY = "cvo-sfx";
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  // Três estados separados: preferência, liberação pelo navegador e estado real do AudioContext.
  let soundEnabled = true, audioUnlocked = false, announced = false; const subs = [];
  const ctxState = () => (ctx ? ctx.state : "none");
  const active = () => soundEnabled && ctxState() === "running";
  const emit = () => subs.forEach((f) => f());
  const GEST = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  // resume() é chamado direto dentro do evento do usuário (mantém a ativação); nada de burlar bloqueios.
  const unlock = (e) => {
    if (!soundEnabled || !ctx || ctx.state === "running") return;
    if (e && e.target && e.target.closest && e.target.closest(".snd")) return;
    ctx.resume().catch(() => {});
  };
  const arm = () => GEST.forEach((e) => document.addEventListener(e, unlock, { passive: true }));
  const disarm = () => GEST.forEach((e) => document.removeEventListener(e, unlock));
  const sync = () => {
    if (!ctx) return;
    if (ctx.state === "running") {
      audioUnlocked = true; disarm();
      if (soundEnabled && !announced) { announced = true; S.confirm(ctx.currentTime + .03); last._g = performance.now(); }
    } else if (soundEnabled && ctx.state !== "closed") arm();
    emit();
  };
  const ensure = () => {
    if (ctx) return ctx;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 1;
    const c = ctx.createDynamicsCompressor(); c.threshold.value = -10; c.ratio.value = 4;
    out.connect(c); c.connect(ctx.destination);
    ctx.onstatechange = sync;
    return ctx;
  };
  const onVis = () => {
    if (!ctx || !soundEnabled) return;
    if (document.hidden) { if (ctx.state === "running") ctx.suspend().catch(() => {}); }
    else if (audioUnlocked) { arm(); ctx.resume().catch(() => {}); }
  };
  document.addEventListener("visibilitychange", onVis);
  try { soundEnabled = localStorage.getItem(KEY) !== "off"; } catch (e) {}  // padrão: ligado; respeita escolha salva
  if (AC && soundEnabled) { ensure(); arm(); ctx.resume().catch(() => {}); sync(); }  // tenta iniciar; se bloqueado, 1º gesto libera
  return {
    ok: !!AC,
    active,
    status: () => ({ soundEnabled, audioUnlocked, audioContextState: ctxState() }),
    onChange: (f) => subs.push(f),
    press() {
      if (!AC) return;
      if (active()) { soundEnabled = false; save("off"); disarm(); ctx.suspend().catch(() => {}); emit(); return; }
      soundEnabled = true; save("on"); announced = false; ensure(); arm();
      ctx.resume().then(sync).catch(() => {}); emit();
    },
    // key = id do evento (modo:estado): no máx. 1 vez a cada 2,5 s; intervalo global anti-sobreposição
    play(n, key) {
      if (!active() || !n || document.hidden) return;
      const now = performance.now(), k = key || n;
      if (now - (last[k] || -1e9) < (n === "type" ? 70 : key ? 2500 : 600)) return;
      if (n !== "type" && now - (last._g || -1e9) < 120) return;
      last[k] = now; if (n !== "type") last._g = now;
      S[n](ctx.currentTime + .01);
    },
    dispose() { disarm(); subs.length = 0; document.removeEventListener("visibilitychange", onVis); if (ctx) { ctx.onstatechange = null; try { ctx.close(); } catch (e) {} ctx = null; } soundEnabled = false; },
  };
}

function mountDemo(root) {
  const sfx = createSFX();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const KW = "Air Fryer";
  const tog = (e, c, on) => e.classList.toggle(c, on);

  const copy = {
    fin: 6, pulse: [1, 2, 5], snd: [null, "notif", "activate", "process", "ok", "sent", null], eyes: (s) => s === 3 || s === 4 || s === 6,
    init(f) { f.vip = f.q(".p0 .msg"); f.buy = f.q(".p2 .msg"); f.sent = f.q(".sent"); f.st = [0, 1, 2, 3].map((i) => f.q(".st" + i)); f.parts = f.q(".parts"); f.scan = f.q(".scan"); },
    state: (p, a) => (p < 0.02 ? 0 : p < a - 0.12 ? 1 : p < a ? 2 : p < a + 0.1 ? 3 : p < 0.88 ? 4 : p < 0.985 ? 5 : 6),
    apply(f, s) {
      tog(f.cards[0], "on", s === 1); tog(f.cards[1], "on", s >= 2 && s <= 4); tog(f.cards[2], "on", s >= 5);
      tog(f.nodes[0], "lit", s >= 1); tog(f.nodes[1], "lit", s >= 2); tog(f.nodes[2], "lit", s >= 5);
      tog(f.vip, "show", s >= 1);
      tog(f.st[0], "show", s < 2); tog(f.st[1], "show", s === 2); tog(f.st[2], "show", s === 3); tog(f.st[3], "show", s >= 4);
      tog(f.buy, "show", s >= 5); tog(f.sent, "show", s >= 5);
      tog(f.parts, "run", s === 3); tog(f.scan, "run", s === 3);
    },
  };

  const search = {
    fin: 8, pulse: [1, 3, 7], snd: [null, null, null, "activate", "found", "process", "ok", null, "sent"], eyes: (s) => s === 3 || s === 5 || s === 6 || s === 8,
    init(f) {
      f.ty = f.q(".ty"); f.ck = f.q(".ck"); f.st = [0, 1, 2, 3, 4].map((i) => f.q(".st" + i));
      f.rows = f.qa(".rw"); f.fks = f.qa(".rw .fk"); f.buy = f.q(".p2 .msg"); f.d1 = f.q(".sd1"); f.d2 = f.q(".sd2");
      f.parts = f.q(".parts"); f.scan = f.q(".scan"); f.txt = "";
    },
    state: (p, a) => (p < 0.02 ? 0 : p < 0.14 ? 1 : p < a - 0.05 ? 2 : p < a + 0.06 ? 3 : p < a + 0.16 ? 4 : p < a + 0.26 ? 5 : p < 0.9 ? 6 : p < 0.985 ? 7 : 8),
    tick(f, p) {
      const t = KW.slice(0, Math.round(clamp((p - 0.02) / 0.12) * KW.length));
      if (t !== f.txt) { f.txt = t; f.ty.textContent = t; }
      f.rows.forEach((r, k) => tog(r, "show", p >= f.a + 0.06 + k * 0.035));
    },
    apply(f, s) {
      tog(f.cards[0], "on", s === 1 || s === 2); tog(f.cards[1], "on", s >= 3 && s <= 6); tog(f.cards[2], "on", s >= 7);
      tog(f.nodes[0], "lit", s >= 1); tog(f.nodes[1], "lit", s >= 3); tog(f.nodes[2], "lit", s >= 7);
      tog(f.ck, "show", s >= 2);
      tog(f.st[0], "show", s < 3); tog(f.st[1], "show", s === 3); tog(f.st[2], "show", s === 4); tog(f.st[3], "show", s === 5); tog(f.st[4], "show", s >= 6);
      f.fks.forEach((k) => { k.textContent = s >= 6 ? k.dataset.b : k.dataset.a; tog(k, "done", s >= 6); });
      tog(f.parts, "run", s === 5 || s === 3); tog(f.scan, "run", s === 3 || s === 5);
      tog(f.buy, "show", s >= 7); tog(f.d1, "show", s === 7); tog(f.d2, "show", s >= 8);
    },
  };

  function build(el, spec) {
    const q = (s) => el.querySelector(s), qa = (s) => Array.from(el.querySelectorAll(s));
    const f = { el, spec, q, qa, last: -1, ys: [0, 0, 0], len: 1, a: 0.5 };
    f.bot = q(".bot"); f.ln = q(".ln"); f.glow = q(".glow"); f.trk = q(".trk");
    f.cards = [q(".p0"), q(".p1"), q(".p2")]; f.nodes = qa(".nd");
    spec.init(f);
    return f;
  }
  const flows = { copy: build(root.querySelector("#m-copy .flow"), copy), search: build(root.querySelector("#m-search .flow"), search) };
  let A = flows.copy, key = "copy";

  function layout(f) {
    f.ys = f.cards.map((c) => c.offsetTop + 22);
    const d = `M18 ${f.ys[0]} L18 ${f.ys[2]}`;
    [f.trk, f.glow, f.ln].forEach((p) => p.setAttribute("d", d));
    f.len = f.ln.getTotalLength() || 1;
    f.ln.style.strokeDasharray = f.glow.style.strokeDasharray = String(f.len);
    f.nodes.forEach((n, i) => { n.setAttribute("cx", 18); n.setAttribute("cy", f.ys[i]); });
    f.a = (f.ys[1] - f.ys[0]) / (f.ys[2] - f.ys[0]);
  }
  function render(f, p) {
    const off = String(f.len * (1 - p));
    f.ln.style.strokeDashoffset = off; f.glow.style.strokeDashoffset = off;
    f.bot.style.transform = `translate3d(0,${f.ys[0] + p * (f.ys[2] - f.ys[0]) - 18}px,0)`;
    f.bot.style.opacity = String(Math.min(1, p * 25));
    const pl = f.txt ? f.txt.length : 0;
    if (f.spec.tick) f.spec.tick(f, p);
    if (f.txt && f.txt.length > pl && f === A && f.txt.length % 2 === 1 && canSnd()) sfx.play("type");
    const s = f.spec.state(p, f.a);
    if (s === f.last) return;
    const fwd = s > f.last; f.last = s;
    f.spec.apply(f, s);
    if (fwd && f === A && canSnd()) sfx.play(f.spec.snd[s], f.el.closest(".mode").id + ":" + s);
    tog(f.bot, "eyes", f.spec.eyes(s)); tog(f.bot, "ok", s === f.spec.fin);
    if (fwd && f.spec.pulse.includes(s)) { f.bot.classList.remove("pl"); void f.bot.offsetWidth; f.bot.classList.add("pl"); }
    if (f === A) document.documentElement.dataset.done = s === f.spec.fin ? "1" : "0";
  }

  let cur = 0, target = 0, auto = false, autoT = 0, hold = 0, raf = 0, lastT = 0, idle = 0, autoLoops = 0;
  const scrollP = () => { const r = A.el.getBoundingClientRect(); return clamp((innerHeight * 0.6 - r.top) / r.height); };
  const inView = () => { const r = A.el.getBoundingClientRect(); return r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15; };
  const canSnd = () => !reduce && inView() && (!auto || autoLoops < 1);
  function loop(t) {
    raf = 0; const dt = Math.min(64, t - (lastT || t)); lastT = t;
    if (auto) {
      if (autoT >= 1) { hold += dt; if (hold > 1600) { autoT = 0; hold = 0; autoLoops++; } } else autoT = Math.min(1, autoT + dt / 9000);
      target = autoT;
    }
    cur += (target - cur) * (auto ? (target < cur ? 0.05 : 0.15) : 0.25);
    if (Math.abs(target - cur) < 0.0008) cur = target;
    render(A, cur);
    if (auto || cur !== target) raf = requestAnimationFrame(loop); else lastT = 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  function schedule() {
    clearTimeout(idle);
    if (reduce) return;
    idle = setTimeout(() => {
      if (!document.hidden && inView()) { auto = true; autoT = target; hold = 0; kick(); } else schedule();
    }, 2500);
  }
  const onScroll = () => { auto = false; autoLoops = 0; target = scrollP(); kick(); schedule(); };
  const onResize = () => { Object.values(flows).forEach(layout); target = reduce ? 1 : scrollP(); kick(); };

  const seg = root.querySelector(".seg"), tabs = Array.from(root.querySelectorAll("[role=tab]"));
  function setMode(k) {
    if (k === key) return;
    const prev = A; key = k; A = flows[k];
    if (!reduce) { prev.last = -1; render(prev, 0); }
    A.last = -1;
    tabs.forEach((t) => { const on = t.id === "tab-" + k; tog(t, "on", on); t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
    seg.dataset.i = k === "copy" ? "0" : "1";
    root.querySelectorAll(".mode").forEach((m) => tog(m, "on", m.id === "m-" + k));
    auto = false; cur = 0; autoT = 0; autoLoops = 0;
    if (reduce) { cur = target = 1; render(A, 1); } else { target = scrollP(); kick(); schedule(); }
  }
  const onTab = (e) => setMode(e.currentTarget.id.slice(4));
  const onKey = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const k = key === "copy" ? "search" : "copy"; setMode(k); root.querySelector("#tab-" + k).focus();
  };
  tabs.forEach((t) => { t.addEventListener("click", onTab); t.addEventListener("keydown", onKey); });
  const sb = root.querySelector(".snd");
  if (!sfx.ok) sb.hidden = true;
  const paint = () => { const o = sfx.active(); sb.setAttribute("aria-pressed", String(o)); sb.querySelector("span").textContent = o ? "Desativar som" : "Ativar som"; };
  paint(); sfx.onChange(paint); sb.addEventListener("click", () => { sfx.press(); paint(); });
  const stopSfx = () => sfx.dispose(); addEventListener("pagehide", stopSfx);

  Object.values(flows).forEach(layout);
  if (reduce) { Object.values(flows).forEach((f) => render(f, 1)); }
  else {
    target = cur = scrollP(); render(A, cur);
    addEventListener("scroll", onScroll, { passive: true }); schedule();
  }
  addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize); ro.observe(root);
  return () => {
    ro.disconnect(); removeEventListener("scroll", onScroll); removeEventListener("resize", onResize);
    clearTimeout(idle); if (raf) cancelAnimationFrame(raf); removeEventListener("pagehide", stopSfx); sfx.dispose();
    tabs.forEach((t) => { t.removeEventListener("click", onTab); t.removeEventListener("keydown", onKey); });
  };
}

function ph(i){var c=["#DCFCE7","#E8F5EC","#D1F0DC"][i%3],d=i===1;return '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" fill="'+c+'"/><rect x="11" y="9" width="26" height="30" rx="'+(d?6:11)+'" fill="#fff" stroke="#16A34A" stroke-width="2"/><rect x="15" y="14" width="18" height="'+(d?8:6)+'" rx="3" fill="none" stroke="#16A34A" stroke-width="1.6"/>'+(d?'<circle cx="19" cy="18" r="1.5" fill="#22C55E"/><circle cx="25" cy="18" r="1.5" fill="#22C55E"/>':'')+'<rect x="16" y="26" width="16" height="8" rx="4" fill="#BBF7D0" stroke="#16A34A" stroke-width="1.6"/><path d="M37 24h4" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/></svg>'}
const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const $=(x)=>document.querySelector(x), esc=(t)=>String(t).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function DemoVideo(el,c){
  $("#v-title").textContent=c.title; $("#v-sub").textContent=c.subtitle; el.style.aspectRatio=c.ratio||"16/9";
  if(c.wistiaId){
    var id=String(c.wistiaId).replace(/[^\w-]/g,""),asp=c.wistiaAspect||0.4615;
    el.classList.add("wst"); el.style.aspectRatio=String(asp);
    var fail=function(){el.classList.add("wst");el.style.aspectRatio=String(asp);el.innerHTML='<div class="vph"><span class="plb">'+PLAY+'</span><b>Não foi possível carregar o vídeo agora.</b></div>'};
    var add=function(src,mod){var q=document.querySelector('script[src="'+src+'"]');if(q)return;var s=document.createElement("script");s.src=src;s.async=true;if(mod)s.type="module";s.onerror=fail;document.head.appendChild(s)};
    var mount=function(){
      var st=document.createElement("style");st.textContent="wistia-player[media-id='"+id+"']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/"+id+"/swatch');display:block;filter:blur(5px);padding-top:"+(100/asp).toFixed(2)+"%}";document.head.appendChild(st);
      el.style.aspectRatio="auto"; el.innerHTML='<wistia-player media-id="'+id+'" aspect="'+asp+'"></wistia-player>';
      add("https://fast.wistia.com/player.js",false); add("https://fast.wistia.com/embed/"+id+".js",true);
    };
    if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();mount()}},{rootMargin:"600px"});io.observe(el)}else mount();
    return;
  }
  if(!c.url){el.innerHTML='<div class="vph"><span class="plb">'+PLAY+'</span><b>Vídeo demonstrativo em breve</b></div>';return}
  el.innerHTML='<button class="vbtn" type="button" aria-label="Reproduzir vídeo">'+(c.poster?'<img src="'+esc(c.poster)+'" alt="" loading="lazy" decoding="async">':"")+'<span class="plb">'+PLAY+'</span></button>';
  el.querySelector("button").onclick=function(){var y=c.url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    el.innerHTML=y?'<iframe src="https://www.youtube-nocookie.com/embed/'+y[1]+'?autoplay=1&rel=0" allow="autoplay;fullscreen" allowfullscreen title="'+esc(c.title)+'"></iframe>':'<video src="'+esc(c.url)+'" poster="'+esc(c.poster||"")+'" controls autoplay playsinline preload="metadata"></video>'}
}
function ResultsProof(el,c){
  var T=$("#r-title");T.textContent=c.title;if(c.highlight&&c.title.indexOf(c.highlight)===0){T.textContent="";var hs=document.createElement("span");hs.style.color="var(--go)";hs.textContent=c.highlight;T.appendChild(hs);T.appendChild(document.createTextNode(c.title.slice(c.highlight.length)))}
  var imgs=(c.images||[]).map(function(m){return '<figure><button class="shot" type="button" aria-label="Ampliar print"><img src="'+esc(m.src)+'"'+(m.w?' width="'+m.w+'" height="'+m.h+'"':'')+' alt="'+esc(m.alt||"Print do painel")+'" loading="lazy" decoding="async"></button></figure>'}).join("")||'<div class="shot-ph">O print original do painel da Shopee será inserido aqui.</div>';
  el.innerHTML=(c.value?'<strong>'+esc(c.value)+'</strong>':'')+'<p class="tx">'+esc(c.text)+'</p>'+(c.period?'<span class="per">Período: '+esc(c.period)+'</span>':'')+'<div class="shots">'+imgs+'</div>'+(c.caption&&c.images&&c.images.length?'<figcaption>'+esc(c.caption)+'</figcaption>':'')+'<p class="note">'+esc(c.disclaimer)+'</p>';
  var lb=$("#lb"),li=lb.querySelector("img");
  el.querySelectorAll(".shot").forEach(function(b){b.onclick=function(){var i=b.querySelector("img");li.src=i.src;li.alt=i.alt;lb.showModal()}});
  lb.onclick=function(){lb.close()};
}
document.querySelectorAll("[data-co]").forEach(function(a){if(CONFIG.checkoutUrl)a.href=CONFIG.checkoutUrl});
document.querySelectorAll(".th[data-i]").forEach(function(t){var i=+t.dataset.i,p=CONFIG.products[i];t.innerHTML=p&&p.image?'<img src="'+esc(p.image)+'" alt="" loading="lazy" decoding="async">':ph(i)});
DemoVideo($("#demo-video"),CONFIG.demoVideo); ResultsProof($("#results"),CONFIG.results);
document.querySelectorAll("section h2,.eyebrow,.demo-sec .desc,#video .desc").forEach(function(n){n.classList.add("rv")});
(function(){var stk=$("#stk"),vis=new Set(),o=new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?vis.add(e.target):vis.delete(e.target)});stk.classList.toggle("hide",vis.size>0)});[$("#oferta"),$("#demo-video")].forEach(function(n){o.observe(n)})})();

// ---- Checkout, rastreamento e contatos (tudo configurável em js/config.js) ----
(function(){
  var T=CONFIG.tracking||{}, C=CONFIG.contact||{};
  var link=function(src,attrs){var e=document.createElement("script");e.async=true;e.src=src;for(var k in (attrs||{}))e.setAttribute(k,attrs[k]);document.head.appendChild(e)};
  if(T.metaPixelId){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",T.metaPixelId);fbq("track","PageView")}
  if(T.utmifyPixelId){window.pixelId=T.utmifyPixelId;link("https://cdn.utmify.com.br/scripts/pixel/pixel.js",{defer:""})}
  if(T.utmifyUtms){link("https://cdn.utmify.com.br/scripts/utms/latest.js",{defer:"","data-utmify-prevent-xcod-sck":"","data-utmify-prevent-subids":""})}
  (T.extraScripts||[]).forEach(function(u){link(u)});
  document.querySelectorAll("[data-co]").forEach(function(a){
    if(CONFIG.checkoutUrl&&location.search){try{var u=new URL(CONFIG.checkoutUrl);new URLSearchParams(location.search).forEach(function(v,k){if(!u.searchParams.has(k))u.searchParams.set(k,v)});a.href=u.toString()}catch(e){}}
    a.addEventListener("click",function(){if(window.fbq&&CONFIG.checkoutUrl)fbq("track","InitiateCheckout")});
  });
  var map={Suporte:"supportUrl",Termos:"termsUrl",Privacidade:"privacyUrl",Reembolso:"refundUrl"};
  document.querySelectorAll("footer nav span").forEach(function(n){var u=C[map[n.textContent]];if(u){var a=document.createElement("a");a.href=u;a.textContent=n.textContent;if(/^https?:/.test(u)){a.target="_blank";a.rel="noopener"}n.replaceWith(a)}});
})();

mountDemo(document.querySelector(".demo"));
document.documentElement.classList.add("js");
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15,rootMargin:"0px 0px -8% 0px"});
document.querySelectorAll(".rv").forEach(function(n){io.observe(n)});
