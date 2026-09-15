(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ================= INTRO ================= */
  const intro = $("#intro");
  if (intro) {
    let seen = false;
    try { seen = sessionStorage.getItem("alt-intro") === "1"; } catch (e) {}
    if (reduce || seen) intro.classList.add("gone");
    else {
      document.body.classList.add("locked");
      const w = $(".intro-word", intro);
      w.innerHTML = [...w.textContent].map((c, i) => `<span style="animation-delay:${0.25 + i * 0.07}s">${c}</span>`).join("");
      const num = $("#introNum"); const t0 = performance.now(), dur = 1500;
      const tick = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        num.textContent = Math.round(100 * (1 - Math.pow(1 - k, 2)));
        if (k < 1) requestAnimationFrame(tick);
        else {
          intro.classList.add("done"); document.body.classList.remove("locked");
          try { sessionStorage.setItem("alt-intro", "1"); } catch (e) {}
          setTimeout(() => intro.classList.add("gone"), 1200);
        }
      };
      requestAnimationFrame(tick);
      intro.addEventListener("click", () => { intro.classList.add("done", "gone"); document.body.classList.remove("locked"); });
    }
  }

  /* ================= MORPH WORD (scramble loop) ================= */
  const morph = $("#morph");
  if (morph && !reduce) {
    const WORDS = ["geldi", "gelmiş", "gördüm", "duymuşum", "yaptı", "yapmış", "gitti", "gitmiş"];
    const AB = "abcçdefgğhıijklmnoöprsştuüvyz";
    let wi = 0;
    const scramble = (to) => {
      const from = morph.textContent, len = Math.max(from.length, to.length);
      let frame = 0; const total = 18;
      const step = () => {
        frame++;
        let out = "";
        for (let i = 0; i < len; i++) {
          const settle = (i / len) * total * 0.7 + total * 0.3;
          if (frame >= settle) out += to[i] || "";
          else if (frame > i) out += `<span class="gl">${AB[(Math.random() * AB.length) | 0]}</span>`;
          else out += from[i] || "";
        }
        morph.innerHTML = out;
        if (frame < total) requestAnimationFrame(step); else morph.textContent = to;
      };
      requestAnimationFrame(step);
    };
    setInterval(() => { wi = (wi + 1) % WORDS.length; scramble(WORDS[wi]); }, 2200);
  }

  /* ================= SPLIT CHARS ================= */
  $$(".split").forEach((h) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "ch-w";
            [...part].forEach((c) => { const s = document.createElement("span"); s.className = "c"; s.style.setProperty("--i", i++); s.textContent = c; w.appendChild(s); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(h);
    h.setAttribute("aria-label", h.textContent);
  });

  /* ================= SCROLL-SCRUB WORDS ================= */
  const scrubs = $$("[data-scrub]");
  scrubs.forEach((box) => {
    $$("p", box).forEach((p) => {
      const walk = (node) => [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
      walk(p);
    });
  });
  const scrubWords = scrubs.map((b) => $$(".w", b));

  /* ================= PARALLAX + SCRUB + ROUTE (one rAF loop) ================= */
  const blobs = $$(".hero .blob");
  const route = $("#route"), rcs = $$(".rc"), leaves = $$(".leaf"), bloom = $(".bloom"), stem = $("#stemPath"), routeBar = $("#routeBar"), routeImg = $("#routeImg");
  const ROUTE_IMG = ["media/p-route.webp", "media/p-step.webp", "media/p-podroute.webp", "media/n-sinema.webp", "media/p-timeline.webp"];
  const stemLen = stem ? stem.getTotalLength() : 0;
  if (stem) { stem.style.strokeDasharray = stemLen; stem.style.strokeDashoffset = stemLen; }
  let curStage = -1, raf = 0;
  const pinwheel = $("#pinwheel");

  function frame() {
    raf = 0;
    const vh = innerHeight;
    // parallax
    if (!reduce) blobs.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `0 ${((r.top - vh / 2) * [0.08, -0.06, 0.12][i % 3]).toFixed(1)}px`;
    });
    if (pinwheel && !reduce) {
      const r = pinwheel.getBoundingClientRect();
      pinwheel.style.rotate = `${((r.top - vh / 2) * -0.03).toFixed(2)}deg`;
    }
    // scrub words
    scrubWords.forEach((ws) => {
      if (!ws.length) return;
      const r0 = ws[0].getBoundingClientRect(), r1 = ws[ws.length - 1].getBoundingClientRect();
      if (r1.bottom < -200 || r0.top > vh + 200) return;
      const p = reduce ? 1 : clamp((vh * 0.78 - r0.top) / (r1.bottom - r0.top + vh * 0.25), 0, 1);
      const n = Math.floor(p * ws.length);
      ws.forEach((w, i) => { w.classList.toggle("lit", i <= n); w.classList.toggle("now", i === n && p < 1); });
    });
    // sticky route
    if (route && !reduce) {
      const r = route.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh), 0, 1);
      stem.style.strokeDashoffset = stemLen * (1 - p);
      routeBar.style.width = p * 100 + "%";
      const stage = Math.min(4, Math.floor(p * 5));
      leaves.forEach((l, i) => l.classList.toggle("on", p > (i + 0.6) / 5));
      bloom.classList.toggle("on", p > 0.94);
      if (stage !== curStage) {
        rcs.forEach((c, i) => { c.classList.toggle("on", i === stage); c.classList.toggle("past", i < stage); });
        routeImg.classList.add("swap");
        setTimeout(() => { routeImg.src = ROUTE_IMG[stage]; routeImg.classList.remove("swap"); }, 220);
        curStage = stage;
      }
    }
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", req);
  frame();

  /* ================= SPARKS (cursor trail + tap burst) ================= */
  const sparks = $("#sparks");
  const pool = [];
  function spark(x, y, burst) {
    if (reduce || !sparks) return;
    const n = burst ? 10 : 1;
    for (let k = 0; k < n; k++) {
      let el = pool.pop();
      if (!el) { el = document.createElement("span"); el.className = "spk"; el.textContent = "✦"; sparks.appendChild(el); }
      el.classList.toggle("p", Math.random() < 0.4); el.classList.toggle("w", Math.random() < 0.2);
      const a = burst ? (k / n) * Math.PI * 2 + Math.random() * 0.4 : Math.random() * Math.PI * 2;
      const d = burst ? 50 + Math.random() * 40 : 14 + Math.random() * 24;
      const s = 0.5 + Math.random() * 0.9;
      const anim = el.animate([
        { transform: `translate(${x}px,${y}px) scale(${s}) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d + (burst ? 20 : 30)}px) scale(0) rotate(${burst ? 220 : 120}deg)`, opacity: 0 },
      ], { duration: burst ? 750 : 650, easing: "cubic-bezier(.2,.8,.3,1)" });
      anim.onfinish = () => pool.push(el);
    }
  }
  if (fine) {
    let last = 0;
    addEventListener("pointermove", (e) => { const t = performance.now(); if (t - last > 34) { last = t; spark(e.clientX, e.clientY, false); } }, { passive: true });
  }
  addEventListener("pointerdown", (e) => { if (e.target.closest("button, a, .scard, input, .spin-stage")) spark(e.clientX, e.clientY, true); }, { passive: true });

  /* ================= CONFETTI (quiz) ================= */
  window.__confetti = (el) => {
    if (reduce) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const C = ["#92fcd2", "#f55cf2", "#4262ff", "#ffffff", "#0d0d10"];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement("i"); c.className = "conf"; c.style.background = C[i % C.length];
      document.body.appendChild(c);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, v = 140 + Math.random() * 220;
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v;
      c.animate([
        { transform: `translate(${cx}px,${cy}px) rotate(0)`, opacity: 1 },
        { transform: `translate(${cx + dx * 0.7}px,${cy + dy * 0.7}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${cx + dx}px,${cy + dy + 320}px) rotate(${Math.random() * 900}deg)`, opacity: 0 },
      ], { duration: 1300 + Math.random() * 500, easing: "cubic-bezier(.15,.7,.4,1)" }).onfinish = () => c.remove();
    }
  };

  /* ================= LIGHTBOX ================= */
  const lb = $("#lightbox"), lbImg = $("#lbImg");
  const openLB = (src, alt) => { lbImg.src = src; lbImg.alt = alt || ""; lb.hidden = false; document.body.classList.add("locked"); };
  const closeLB = () => { lb.hidden = true; document.body.classList.remove("locked"); };
  lb.addEventListener("click", closeLB);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLB(); });

  /* ================= 3D CAROUSEL (drag + inertia + autoplay) ================= */
  const stage = $("#spinStage"), ring = $("#spinRing");
  if (stage && ring) {
    const figs = $$("figure", ring), N = figs.length, step = 360 / N;
    const cap = $("#spinCap");
    let radius = 0, angle = 0, vel = 0, target = null, dragging = false, lastX = 0, moved = 0, idleT = 0;
    const layout = () => {
      const w = figs[0].offsetWidth;
      radius = Math.round((w / 2) / Math.tan(Math.PI / N)) + 26;
      figs.forEach((f, i) => { f.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
    };
    layout(); addEventListener("resize", layout);
    const front = () => ((Math.round(-angle / step) % N) + N) % N;
    let lastFront = -1;
    const loop = () => {
      if (!dragging) {
        if (target !== null) { angle += (target - angle) * 0.12; if (Math.abs(target - angle) < 0.05) { angle = target; target = null; } }
        else if (Math.abs(vel) > 0.02) { angle += vel; vel *= 0.94; if (Math.abs(vel) < 0.08) target = Math.round(angle / step) * step; }
        else if (!reduce && performance.now() - idleT > 2500) angle -= 0.12;
      }
      ring.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
      figs.forEach((f, i) => {
        const rel = ((((i * step + angle) % 360) + 540) % 360) - 180;
        const k = 1 - Math.min(1, Math.abs(rel) / 120);
        f.style.filter = `brightness(${0.45 + k * 0.55})`;
      });
      const fi = front();
      if (fi !== lastFront) { cap.textContent = figs[fi].querySelector("figcaption").textContent; lastFront = fi; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; moved = 0; vel = 0; target = null; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); vel = dx * 0.35; angle += vel; });
    const end = (e) => {
      if (!dragging) return; dragging = false; idleT = performance.now();
      if (moved < 6) { const f = document.elementFromPoint(e.clientX, e.clientY)?.closest("figure"); if (f) { const img = $("img", f); openLB(img.src, img.alt); } }
    };
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
    $("#spinPrev").addEventListener("click", () => { idleT = performance.now(); target = Math.round(angle / step) * step + step; });
    $("#spinNext").addEventListener("click", () => { idleT = performance.now(); target = Math.round(angle / step) * step - step; });
  }

  /* ================= COMPARE SLIDER ================= */
  const cmp = $("#compare"), cmpR = $("#cmpRange");
  if (cmp) {
    const set = (v) => cmp.style.setProperty("--x", v + "%");
    cmpR.addEventListener("input", () => { cmp.dataset.touched = 1; set(cmpR.value); });
    // idle sweep animation until touched
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || reduce) return; io.disconnect();
      const t0 = performance.now();
      const sweep = (t) => {
        if (cmp.dataset.touched) return;
        const k = (t - t0) / 1000; const v = 50 + Math.sin(k * 1.6) * 38 * Math.exp(-k * 0.35);
        set(v.toFixed(1)); cmpR.value = v;
        if (k < 7) requestAnimationFrame(sweep); else set(50);
      };
      requestAnimationFrame(sweep);
    }), { threshold: 0.5 });
    io.observe(cmp);
  }

  /* ================= SWIPE DECK (reviews) ================= */
  const REV = [
    [1, "Всё могу найти на одной платформе", "спикинг-клуб + материалы"],
    [5, "Вчера сдала экзамен по немецкому B1", "экзамен"],
    [8, "Начинал с уровня A2 и нужно было подтянуться до B2. С помощью вашего курса смог это сделать", "A2 → B2"],
    [14, "Никакой «воды». Рекомендую для тех, кто ценит время", "системность"],
    [3, "Не ожидала, что обучение будет таким увлекательным и эффективным", "впечатление"],
    [11, "Очень доступная цена за такой объём материала", "цена"],
    [9, "Даже при наличии 5 минут остаётся полезным помощником", "5 минут"],
    [16, "Хороший старт для изучения немецкого языка с нуля", "с нуля"],
    [10, "Такая платформа, где ты сам выбираешь, в какой теме разобраться", "свобода"],
    [17, "За такой кладезь знаний не жалко заплатить, эта инвестиция окупается сполна", "окупается"],
    [4, "Всё понятно и расписано по полочкам", "структура"],
    [13, "Занимаюсь каждый день. Вы мне очень помогли", "привычка"],
    [7, "Начал изучение неделю назад и уже чувствую, как мой немецкий начал становиться лучше", "первая неделя"],
    [15, "Купила доступ год назад. Платформа очень помогла в изучении языка", "год спустя"],
    [6, "Уроки структурированы по уровням, что помогает систематически улучшать знания", "уровни"],
    [12, "Всё систематизировано по темам. Я очень довольна платформой", "Notion"],
    [2, "Можно выбрать желаемый уровень и изучать в любое время", "гибкость"],
  ];
  const deck = $("#swipe");
  if (deck) {
    const pad = (n) => String(n).padStart(2, "0");
    deck.innerHTML = REV.map(([n, q, tag], i) => `
      <article class="scard" data-i="${i}">
        <p class="sq">${q}</p>
        <div class="sshot"><img src="media/rev/r${pad(n)}.webp" alt="Скриншот отзыва ученика Stellas: ${q}" loading="lazy" draggable="false"></div>
        <div class="smeta"><span class="stag">${tag}</span><span>Stellas · Telegram</span></div>
      </article>`).join("");
    const cards = $$(".scard", deck); const count = $("#swCount");
    let order = cards.map((_, i) => i);
    const paint = () => {
      order.forEach((ci, pos) => {
        const c = cards[ci];
        c.style.zIndex = 100 - pos;
        c.style.opacity = pos > 3 ? 0 : 1;
        c.style.transform = `translateY(${pos * 14}px) scale(${1 - pos * 0.045}) rotate(${pos === 0 ? 0 : (pos % 2 ? 3 : -3) * pos * 0.7}deg)`;
        c.style.pointerEvents = pos === 0 ? "auto" : "none";
      });
      count.textContent = `${order[0] + 1} / ${cards.length}`;
    };
    paint();
    const fling = (dir) => {
      const top = cards[order[0]];
      top.style.transform = `translate(${dir * 130}%, -30px) rotate(${dir * 28}deg)`; top.style.opacity = 0;
      setTimeout(() => { order.push(order.shift()); paint(); }, 280);
    };
    const back = () => { order.unshift(order.pop()); const c = cards[order[0]]; c.classList.add("drag"); c.style.transform = "translate(-130%,-30px) rotate(-28deg)"; c.style.opacity = 0; void c.offsetWidth; c.classList.remove("drag"); paint(); };
    $("#swNext").addEventListener("click", () => fling(1));
    $("#swBack").addEventListener("click", back);
    let sx = 0, sy = 0, dx = 0, active = null, horiz = null;
    deck.addEventListener("pointerdown", (e) => {
      const c = e.target.closest(".scard"); if (!c || +c.dataset.i !== order[0]) return;
      active = c; sx = e.clientX; sy = e.clientY; dx = 0; horiz = null; c.classList.add("drag");
    });
    addEventListener("pointermove", (e) => {
      if (!active) return;
      dx = e.clientX - sx; const dy = e.clientY - sy;
      if (horiz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) horiz = Math.abs(dx) > Math.abs(dy);
      if (horiz) { e.preventDefault(); active.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dx * 0.06}deg)`; }
    }, { passive: false });
    const up = (e) => {
      if (!active) return; const c = active; active = null; c.classList.remove("drag");
      if (horiz && Math.abs(dx) > 90) fling(Math.sign(dx));
      else if (!horiz && Math.abs(dx) < 6) { const img = e.target.closest(".sshot img") || (e.target.closest(".sshot") && $("img", c)); if (img) openLB(img.src, img.alt); paint(); }
      else paint();
    };
    addEventListener("pointerup", up); addEventListener("pointercancel", up);
    // gentle auto-advance hint while visible and untouched
    let touched = false; deck.addEventListener("pointerdown", () => (touched = true), { once: true });
    const vis = new IntersectionObserver((es) => es.forEach((e) => { deck.dataset.vis = e.isIntersecting ? 1 : ""; }), { threshold: 0.6 });
    vis.observe(deck);
    if (!reduce) setInterval(() => { if (!touched && deck.dataset.vis && lb.hidden) fling(1); }, 4200);
  }
})();
