(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LAVA = "https://app.lava.top/products/2cdbb9f8-e65b-443e-8d2c-4fea4c121e41";

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  $$(".split").forEach((el) => io.observe(el));
  // safety net: never leave content hidden
  setTimeout(() => $$(".reveal:not(.in), .split:not(.in)").forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
  }), 1800);

  /* ---------- nav, progress, fab, draw lines ---------- */
  const nav = $("#nav"), prog = $("#progress"), fab = $("#fab"), buy = $("#buy");
  const pills = $$(".pill[href^='#']");
  const loops = $$(".bg-loop, .squig");
  loops.forEach((svg) => {
    const p = svg.querySelector("path"); const len = p.getTotalLength();
    svg.classList.add("draw"); svg.style.setProperty("--len", len);
  });
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav.classList.toggle("solid", y > 40);
    nav.classList.toggle("hide", y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("hide");
    lastY = y;
    const br = buy.getBoundingClientRect();
    fab.classList.toggle("show", y > innerHeight * 0.9 && !(br.top < innerHeight && br.bottom > 0));
    loops.forEach((svg) => {
      const r = svg.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * 0.6)));
      const len = +svg.style.getPropertyValue("--len");
      svg.style.setProperty("--off", reduce ? 0 : len * (1 - t));
    });
    let cur = null;
    pills.forEach((a) => { const s = $(a.getAttribute("href")); if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = a; });
    pills.forEach((a) => a.classList.toggle("on", a === cur && !a.classList.contains("pill-hot")));
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- eyes follow pointer ---------- */
  const eyes = $$(".eye i");
  function look(x, y) {
    eyes.forEach((i) => {
      const r = i.parentElement.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 300);
      i.style.setProperty("--ex", (dx / d) * r.width * 0.22 * k + "px");
      i.style.setProperty("--ey", (dy / d) * r.height * 0.22 * k + "px");
    });
  }
  if (!reduce) {
    addEventListener("pointermove", (e) => look(e.clientX, e.clientY), { passive: true });
    addEventListener("touchstart", (e) => look(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    // idle blink-look on mobile
    let a = 0; setInterval(() => { a += 1.3; look(innerWidth / 2 + Math.cos(a) * 400, innerHeight / 2 + Math.sin(a) * 200); }, 2600);
  }

  /* ---------- tilt ---------- */
  if (!reduce && matchMedia("(hover:hover)").matches) {
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03)` + (el.classList.contains("flipped") ? " rotateY(180deg)" : "");
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    // magnetic buttons
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.15}px,${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
  }

  /* ---------- pinwheel ---------- */
  const PW = [
    ["Otobüs gitti.", "Автобус ушёл. Я стоял на остановке и смотрел ему вслед."],
    ["Otobüs gitmiş.", "Говорят, автобус ушёл. Мне написали в чат, сам я ещё дома."],
    ["Meğer otobüs çoktan gitmiş!", "А автобус-то, оказывается, давно уехал! Прибежал — пусто."],
    ["Bir varmış, bir yokmuş…", "Жили-были… Так начинаются турецкие сказки. Никто не видел, все пересказывают."],
  ];
  const petals = $$("#pinwheel .petal"), pwOut = $("#pwOut");
  function setPetal(i) {
    petals.forEach((p, j) => p.classList.toggle("on", i === j));
    pwOut.innerHTML = `<p class="pw-tr">${PW[i][0]}</p><p class="pw-ru">${PW[i][1]}</p>`;
    pwOut.classList.remove("pop"); void pwOut.offsetWidth; pwOut.classList.add("pop");
  }
  let pwAuto = 0, pwTouched = false;
  petals.forEach((p) => p.addEventListener("click", () => { pwTouched = true; setPetal(+p.dataset.i); }));
  setPetal(0);
  if (!reduce) setInterval(() => { if (!pwTouched && $("#why").getBoundingClientRect().top < innerHeight) setPetal(pwAuto = (pwAuto + 1) % 4); }, 3200);

  /* ---------- flip cards ---------- */
  $$(".card").forEach((c) => c.addEventListener("click", () => {
    const f = c.classList.toggle("flipped"); c.setAttribute("aria-pressed", f); c.style.transform = "";
  }));

  /* ---------- morphology ---------- */
  const VOW = "aeıioöuü", FRONT = "eiöü", HARD = "çfhkpsşt";
  const lastV = (s) => { for (let i = s.length - 1; i >= 0; i--) if (VOW.includes(s[i])) return s[i]; return "e"; };
  const four = (v) => ({ e: "i", i: "i", a: "ı", ı: "ı", o: "u", u: "u", ö: "ü", ü: "ü" })[v];
  const two = (v) => (FRONT.includes(v) ? "e" : "a");

  const VERBS = [
    { s: "gel", ru: ["пришёл", "пришли"], inf: "приходить" },
    { s: "git", ru: ["ушёл", "ушли"], inf: "уходить" },
    { s: "bak", ru: ["посмотрел", "посмотрели"], inf: "смотреть" },
    { s: "oku", ru: ["прочитал", "прочитали"], inf: "читать" },
    { s: "gör", ru: ["увидел", "увидели"], inf: "видеть" },
    { s: "iç", ru: ["выпил", "выпили"], inf: "пить" },
    { s: "yap", ru: ["сделал", "сделали"], inf: "делать" },
    { s: "konuş", ru: ["поговорил", "поговорили"], inf: "говорить" },
    { s: "ye", ru: ["съел", "съели"], inf: "есть" },
    { s: "anla", ru: ["понял", "поняли"], inf: "понимать" },
  ];
  const PERS = [["ben", "я"], ["sen", "ты"], ["o", "он"], ["biz", "мы"], ["siz", "вы"], ["onlar", "они"]];
  const MODES = [["pos", "утверждение"], ["neg", "отрицание"], ["q", "вопрос"]];

  function build(stem, tense, p, mode) {
    const segs = [{ t: stem, k: "root" }], why = [];
    let cur = stem;
    if (mode === "neg") {
      const n = "m" + two(lastV(cur)); segs.push({ t: n, k: "neg" }); cur += n;
      why.push(`Отрицание <b>-${n}</b>: последняя гласная «${lastV(stem)}» → ${n.slice(1)}.`);
    }
    const lv = lastV(cur), v = four(lv);
    if (tense === "di") {
      const last = cur[cur.length - 1], D = HARD.includes(last) ? "t" : "d";
      segs.push({ t: D + v, k: "tense" }); cur += D + v;
      why.push(HARD.includes(last) ? `«${last}» глухой → берём <b>t</b>, а не d.` : `«${last}» не глухой → <b>d</b>.`);
      why.push(`Гласная «${lv}» → в суффиксе <b>${v}</b>.`);
      const end = ["m", "n", "", "k", "n" + v + "z", "l" + two(v) + "r"][p];
      if (end) segs.push({ t: end, k: "pers" }); cur += end;
      why.push(p === 5 ? "У onlar окончание -ler/-lar." : "У -dı короткие окончания: -m, -n, -k, -niz.");
      if (mode === "q") { const q = " m" + four(lastV(cur)) + "?"; segs.push({ t: q.trim(), k: "q" }); why.push("Вопрос: <b>mi</b> отдельным словом после окончания."); cur += q; }
    } else {
      const t = "m" + v + "ş"; segs.push({ t, k: "tense" }); cur += t;
      why.push(`Гласная «${lv}» → <b>${t}</b>. Глухость не важна: m остаётся m.`);
      if (mode === "q") {
        if (p === 5) { const e = "l" + two(v) + "r"; segs.push({ t: e, k: "pers" }); cur += e; const q = "m" + four(two(v)) + "?"; segs.push({ t: q, k: "q" }); cur += " " + q; why.push("У onlar окончание остаётся на глаголе: gelmişler mi?"); }
        else { const q = "m" + v + ["y" + v + "m", "s" + v + "n", "", "y" + v + "z", "s" + v + "n" + v + "z"][p] + "?"; segs.push({ t: q, k: "q" }); cur += " " + q; why.push("Вопрос: личное окончание переезжает на частицу (miyim, misin…). Между гласными — буфер y."); }
      } else {
        const end = [v + "m", "s" + v + "n", "", v + "z", "s" + v + "n" + v + "z", "l" + two(v) + "r"][p];
        if (end) segs.push({ t: end, k: "pers" }); cur += end;
        why.push("У -mış «длинные» окончания: -im, -sin, -iz, -siniz.");
      }
    }
    return { segs, word: segs.reduce((a, s) => a + (s.k === "q" ? " " + s.t : s.t), "") , why };
  }
  function ruGloss(verb, tense, p, mode) {
    const pr = PERS[p][1], f = p >= 3 ? verb.ru[1] : verb.ru[0];
    let s = `${pr} ${mode === "neg" ? "не " : ""}${f}`;
    if (tense === "mis") s = (mode === "q" ? "неужели " : p === 0 ? "оказывается, " : "говорят, ") + s;
    s = s[0].toUpperCase() + s.slice(1);
    return s + (mode === "q" ? "?" : tense === "di" ? " — точно знаю." : ".");
  }

  const st = { tense: "di", v: 0, p: 0, m: 0 };
  const vc = $("#verbChips"), pc = $("#personChips"), mc = $("#modeChips");
  const mk = (box, arr, key, label) => {
    box.innerHTML = arr.map((x, i) => `<button class="ch${i === st[key] ? " on" : ""}" data-i="${i}">${label(x)}</button>`).join("");
    box.addEventListener("click", (e) => { const b = e.target.closest(".ch"); if (!b) return; st[key] = +b.dataset.i; $$(".ch", box).forEach((c) => c.classList.toggle("on", c === b)); render(); });
  };
  mk(vc, VERBS, "v", (x) => `${x.s}mek<small>${x.inf}</small>`.replace(/(a|ı|o|u)(\w*)mek/, (m) => m.replace("mek", "mak")));
  mk(pc, PERS, "p", (x) => x[0]);
  mk(mc, MODES, "m", (x) => x[1]);
  $$("#builder .seg .sg").forEach((b) => b.addEventListener("click", () => {
    st.tense = b.dataset.tense;
    $$("#builder .seg .sg").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    render();
  }));
  function render() {
    const verb = VERBS[st.v], mode = MODES[st.m][0];
    const r = build(verb.s, st.tense, st.p, mode);
    $("#morphs").innerHTML = r.segs.map((s, i) => (i ? '<span class="mo plus">+</span>' : "") + `<span class="mo ${s.k}" style="animation-delay:${i * 90}ms">${s.t}</span>`).join("") +
      `<div style="flex-basis:100%"></div><span class="b-word">${PERS[st.p][0]} ${r.word}</span>`;
    $("#bRu").textContent = ruGloss(verb, st.tense, st.p, mode);
    $("#bWhy").innerHTML = r.why.map((w) => `<li>${w}</li>`).join("");
  }
  // fix infinitive labels for back-vowel verbs
  $$(".ch", vc).forEach((b, i) => { const s = VERBS[i].s; b.innerHTML = `${s}${two(lastV(s)) === "a" ? "mak" : "mek"}<small>${VERBS[i].inf}</small>`; });
  render();

  /* ---------- POV toggle ---------- */
  const povLines = $("#povLines");
  function pov(which) {
    $$("#forum .sg").forEach((b) => { const on = b.dataset.pov === which; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    povLines.classList.toggle("mom", which === "mom");
    $$("li", povLines).forEach((li, i) => {
      const tr = $(".tr", li), ru = $(".ru", li), txt = tr.dataset[which];
      const hl = txt.replace(/(\S*?)(d[ıiuü]|t[ıiuü]|m[ıiuü]ş)(\S*?)([.!])$/u, (m, a, b, c, d) => `${a}<mark>${b}${c}</mark>${d}`);
      tr.innerHTML = hl; ru.textContent = ru.dataset[which];
      li.classList.remove("pop"); void li.offsetWidth; li.style.animationDelay = i * 70 + "ms"; li.classList.add("pop");
    });
  }
  $$("#forum .sg").forEach((b) => b.addEventListener("click", () => pov(b.dataset.pov)));
  pov("me");

  /* ---------- quiz ---------- */
  const Q = [
    { ctx: "Вчера я сам видел, как Мехмет ушёл домой.", tr: "Mehmet dün eve ___.", o: ["gitti", "gitmiş"], a: 0, e: "Видел своими глазами — значит <b>-dı</b>." },
    { ctx: "Друг пишет из Антальи: говорят, пошёл снег. Сам вы в Шымкенте.", tr: "Antalya'ya kar ___.", o: ["yağdı", "yağmış"], a: 1, e: "Узнали из сообщения, сами не видели — <b>-mış</b>." },
    { ctx: "Открываете холодильник. Бурека нет. Кто-то его съел!", tr: "Biri böreğimi ___!", o: ["yedi", "yemiş"], a: 1, e: "Узнали по результату, момент не видели. Сюрприз — <b>-mış</b>." },
    { ctx: "Учебник истории: Ататюрк родился в 1881 году.", tr: "Atatürk 1881'de ___.", o: ["doğdu", "doğmuş"], a: 0, e: "Общеизвестный, установленный факт — обычно <b>-dı</b>." },
    { ctx: "Начало сказки: «Жил-был один падишах…»", tr: "Evvel zaman içinde bir padişah ___.", o: ["vardı", "varmış"], a: 1, e: "Сказки рассказывают через <b>-mış</b>: никто не видел, все пересказывают." },
    { ctx: "Просыпаетесь в 10:40. Будильник стоял на 7. Оказывается, вы его не услышали.", tr: "Alarmı ___!", o: ["duymadım", "duymamışım"], a: 1, e: "Про себя, но узнали только сейчас — <b>-mış</b>: «оказывается, не услышал»." },
    { ctx: "Вы сдали экзамен и сами видели результат.", tr: "Sınavı ___.", o: ["geçtim", "geçmişim"], a: 0, e: "Ваш опыт, вы уверены — <b>-dı</b>. И <b>t</b> после ç." },
    { ctx: "Коллега пересказывает слух о новом директоре: раньше он жил в Германии.", tr: "Eskiden Almanya'da ___.", o: ["yaşadı", "yaşamış"], a: 1, e: "Пересказ чужих слов — <b>-mış</b>." },
  ];
  let qi = 0, score = 0, locked = false;
  const qOpts = $("#qOpts"), qExp = $("#qExp"), qNext = $("#qNext"), qBox = $("#quizBox");
  function showQ() {
    const q = Q[qi]; locked = false;
    $("#qNum").textContent = `${qi + 1} / ${Q.length}`;
    $("#qBar").style.width = (qi / Q.length) * 100 + "%";
    $("#qCtx").textContent = q.ctx;
    $("#qTr").innerHTML = q.tr.replace("___", '<span class="gap">?</span>');
    qOpts.innerHTML = q.o.map((o, i) => `<button class="q-opt" data-i="${i}">${o}</button>`).join("");
    qExp.innerHTML = ""; qNext.hidden = true;
  }
  qOpts.addEventListener("click", (e) => {
    const b = e.target.closest(".q-opt"); if (!b || locked) return; locked = true;
    const q = Q[qi], i = +b.dataset.i, ok = i === q.a;
    if (ok) { score++; window.__confetti && window.__confetti(b); }
    $$(".q-opt", qOpts).forEach((x, j) => { if (j === q.a) x.classList.add("ok"); else if (j === i) x.classList.add("bad"); });
    $(".gap", qBox).textContent = q.o[q.a];
    qExp.innerHTML = (ok ? "✦ Верно. " : "Мимо. ") + q.e;
    $("#qScore").textContent = score + " ✦";
    qNext.hidden = false; qNext.textContent = qi === Q.length - 1 ? "Результат →" : "Дальше →";
  });
  qNext.addEventListener("click", () => {
    qi++;
    if (qi < Q.length) return showQ();
    $("#qBar").style.width = "100%";
    const msg = score >= 7 ? "Свидетель уровня TÖMER. Дальше — miş'li в сложных предложениях и -dıydı. Это уже в гайдах." :
      score >= 4 ? "База есть. Путаница «сам видел / мне сказали» уходит за пару недель практики на слух." :
      "Нормально для старта. Русскому не хватает этой кнопки, её надо натренировать.";
    $("#qCtx").textContent = ""; $("#qTr").innerHTML = "";
    qOpts.innerHTML = `<div class="q-final"><b>${score}/${Q.length}</b><p>${msg}</p><a class="btn btn-mint" href="${LAVA}" target="_blank" rel="noopener">Все 128 гайдов · $30</a></div>`;
    qOpts.style.gridTemplateColumns = "1fr";
    qExp.innerHTML = ""; qNext.hidden = false; qNext.textContent = "Пройти ещё раз ↺";
    qNext.onclick = () => { qi = 0; score = 0; $("#qScore").textContent = "0 ✦"; qOpts.style.gridTemplateColumns = ""; qNext.onclick = null; showQ(); };
  });
  showQ();

  /* ---------- odometer ---------- */
  $$("[data-count]").forEach((el) => {
    const str = el.dataset.count;
    el.innerHTML = '<span class="odo">' + [...str].map((d, k) => `<span class="dg" style="--k:${str.length - k}"><i>${Array.from({ length: 20 }, (_, n) => `<span>${n % 10}</span>`).join("")}</i></span>`).join("") + "</span>";
  });
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const str = e.target.dataset.count;
    $$(".dg i", e.target).forEach((col, k) => { col.style.transform = `translateY(-${(10 + +str[k]) * 5}%)`; });
  }), { threshold: 0.5 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  /* ---------- rail dots ---------- */
  const rail = $("#rail"), dots = $("#railDots"), worlds = $$(".world", rail);
  dots.innerHTML = worlds.map(() => "<i></i>").join("");
  const dotEls = $$("i", dots);
  function railDot() {
    const c = rail.scrollLeft + rail.clientWidth / 2; let best = 0, bd = 1e9;
    worlds.forEach((w, i) => { const d = Math.abs(w.offsetLeft + w.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
    dotEls.forEach((d, i) => d.classList.toggle("on", i === best));
  }
  rail.addEventListener("scroll", () => requestAnimationFrame(railDot), { passive: true });
  railDot();

  /* ---------- video tabs ---------- */
  const vid = $("#demoVideo"), vName = $("#vName");
  const VN = { constructor: "конструктор форм", dialog: "диалоги с озвучкой", map: "карта темы", cizgi: "каталог мультфильмов", harmony: "тренажёр гармонии", apps: "каталог приложений" };
  $$(".vt").forEach((b) => b.addEventListener("click", () => {
    $$(".vt").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    vid.style.opacity = 0;
    setTimeout(() => { vid.src = `media/v-${b.dataset.v}.mp4`; vid.poster = `media/v-${b.dataset.v}.jpg`; vName.textContent = "alterna · " + VN[b.dataset.v]; vid.play().catch(() => {}); vid.style.opacity = 1; }, 220);
  }));
  new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); }), { threshold: 0.35 }).observe(vid);

  /* ---------- persona ---------- */
  const PA = [
    ["Вы на старте. Главная ошибка — начать с грамматических таблиц. <b>Начните с хаба A0–A2 и мультфильмов</b>: 70 из них подходят с нуля, картинка объясняет половину смысла.", "Хаб A0–A2 + Çizgi"],
    ["Классика A2. Правила знаете, а в речи всё сливается. <b>Вам нужны разборы по одной теме</b> — как этот — и аудирование на своём уровне, чтобы формы стали слышны.", "128 гайдов + подкасты"],
    ["На экзамене важно не «знать турецкий вообще», а знать формат. <b>32 блока по экзаменам</b>, отдельно по каждому уровню A1–C1.", "Экзамены A1–C1"],
    ["На работе турецкий другой: письма, созвоны, собеседования. <b>36 гайдов по работе</b> — для тех, кто ищет или уже пашет.", "Гайды по работе"],
    ["40 вкладок — это не план, а тревога. <b>1716 материалов уже разложены по уровням</b>: открываете свой и берёте. Остальные вкладки можно закрыть.", "Каталог по уровням"],
  ];
  const pOut = $("#pOut");
  $$(".pp").forEach((b) => b.addEventListener("click", () => {
    $$(".pp").forEach((x) => x.classList.toggle("on", x === b));
    const [say, go] = PA[+b.dataset.p];
    pOut.innerHTML = `<p class="p-say">${say}</p><a class="p-go" href="${LAVA}" target="_blank" rel="noopener" data-cta="persona">${go} → $30</a>`;
    pOut.classList.remove("pop"); void pOut.offsetWidth; pOut.classList.add("pop");
  }));

  /* ---------- calculator ---------- */
  const rMin = $("#rMin"), rDays = $("#rDays"), rTut = $("#rTut");
  function calc() {
    [rMin, rDays, rTut].forEach((r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%"));
    $("#oMin").textContent = rMin.value; $("#oDays").textContent = rDays.value; $("#oTut").textContent = "$" + rTut.value;
    const hours = Math.round((rMin.value * rDays.value * 26) / 60);
    $("#cHours").textContent = hours;
    const n = 30 / rTut.value;
    $("#cTut").textContent = n >= 10 ? Math.round(n) : (Math.round(n * 10) / 10).toString().replace(".", ",");
  }
  [rMin, rDays, rTut].forEach((r) => r.addEventListener("input", calc));
  calc();
})();
