/* euiyun books — data/books.json을 읽어 웨이퍼 맵, 가치사슬 지도, 책장을 그린다. */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SVG = "http://www.w3.org/2000/svg";
  const STATUS = { published: "출간", writing: "집필 중" };

  let data, stageById;

  function tint(el, b) {
    el.classList.add("tint");
    el.style.setProperty("--c-l", b.color);
    el.style.setProperty("--c-d", b.colorDark || b.color);
  }
  const isPublished = (b) => b.status === "published";
  const readUrl = (b) => (isPublished(b) && b.url ? b.url : "");

  /* ---------- 테마 ---------- */
  function setupTheme() {
    $("#theme-btn").addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    });
  }

  /* ---------- 통계 ---------- */
  function renderStats() {
    const pub = data.books.filter(isPublished);
    const sum = (k) => pub.reduce((a, b) => a + (b[k] || 0), 0);
    const vals = {
      published: pub.length,
      chapters: sum("chapters"),
      simulators: sum("simulators") + "+",
      writing: data.books.length - pub.length,
    };
    document.querySelectorAll("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });
  }

  /* ---------- 웨이퍼 맵 (C) ---------- */
  // 다이 하나 = 책 한 권. 중심에서 가까운 다이부터 books.json 순서대로 채운다.
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVG, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const pad2 = (n) => String(n).padStart(2, "0");

  function renderWafer() {
    const svg = $("#wafer");
    const C = 200, R = 188, PITCH = 42, DIE = 37, N = 9, SCAN = 1.4;
    const now = new Date();
    const lot = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const slots = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = C + (i - (N - 1) / 2) * PITCH, y = C + (j - (N - 1) / 2) * PITCH;
        const far = Math.hypot(Math.abs(x - C) + DIE / 2, Math.abs(y - C) + DIE / 2);
        if (far < R - 6) slots.push({ x, y, col: i + 1, row: j + 1, d: Math.hypot(x - C, y - C), a: Math.atan2(y - C, x - C) });
      }
    }
    slots.sort((p, q) => p.d - q.d || p.a - q.a);

    // 실리콘 바탕, 박막 간섭색, 회로 패턴, 반사광
    svg.innerHTML = `<defs>
      <radialGradient id="w-si" cx="50%" cy="45%" r="60%"><stop offset="0" class="si-1"/><stop offset="1" class="si-2"/></radialGradient>
      <linearGradient id="w-irid" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(0 .5 .5)">
        <stop offset="0" stop-color="#3ee8ff"/><stop offset=".22" stop-color="#8f6bff"/><stop offset=".42" stop-color="#ff5ec8"/>
        <stop offset=".62" stop-color="#ffd25e"/><stop offset=".8" stop-color="#5effa8"/><stop offset="1" stop-color="#3ee8ff"/>
      </linearGradient>
      <radialGradient id="w-glare" cx="35%" cy="25%" r="45%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <pattern id="w-circuit" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 3 H5 V9 H12 M8 0 V4 M2 12 V8" fill="none" class="circ" stroke-width=".7"/>
      </pattern>
      <pattern id="w-circuit-lit" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 3 H5 V9 H12 M8 0 V4 M2 12 V8" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".7"/>
      </pattern>
      <clipPath id="w-clip"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
      <linearGradient id="w-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ad7ff" stop-opacity="0"/><stop offset="1" stop-color="#7ad7ff" stop-opacity=".9"/></linearGradient>
      <path id="w-arc" d="M ${C - R - 9} ${C} A ${R + 9} ${R + 9} 0 0 1 ${C + R + 9} ${C}"/>
    </defs>`;
    el("circle", { cx: C, cy: C, r: R, class: "disc", fill: "url(#w-si)" }, svg);
    el("circle", { cx: C, cy: C, r: R, class: "irid", fill: "url(#w-irid)" }, svg);
    const dies = el("g", { class: "dies" }, svg);
    el("circle", { cx: C, cy: C, r: R, class: "glare", fill: "url(#w-glare)" }, svg);
    el("rect", { x: 0, y: -40, width: 400, height: 40, class: "scan", fill: "url(#w-scan)", "clip-path": "url(#w-clip)", style: `animation-duration:${SCAN}s` }, svg);
    el("circle", { cx: C, cy: C, r: R, class: "rim" }, svg);
    el("circle", { cx: C, cy: C + R, r: 7, class: "notch" }, svg);
    const label = el("text", { class: "arc-label" }, svg);
    const tp = el("textPath", { href: "#w-arc", startOffset: "50%" }, label);
    tp.textContent = `LOT ${lot} · WAFER #01 · Ø300 mm · ${slots.length} DIES`;

    const books = data.books.slice(0, slots.length);
    slots.forEach((s, k) => {
      const b = books[k];
      const g = el("g", { class: "die" }, dies);
      g.style.animationDelay = ((s.y / 400) * SCAN).toFixed(2) + "s";
      g.dataset.pos = `X${pad2(s.col)}·Y${pad2(s.row)}`;
      const box = { x: s.x - DIE / 2, y: s.y - DIE / 2, width: DIE, height: DIE, rx: 4 };
      el("rect", { ...box, class: "body" }, g);
      el("rect", { ...box, class: "pattern", fill: b && isPublished(b) ? "url(#w-circuit-lit)" : "url(#w-circuit)" }, g);
      if (b) {
        tint(g, b);
        g.classList.add("book", b.status);
        g.dataset.id = b.id;
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `${b.title} · ${b.subtitle} (${STATUS[b.status]})`);
        el("text", { x: s.x, y: s.y }, g).textContent = b.code;
      } else {
        g.classList.add("empty");
      }
    });

    // 마우스를 따라 웨이퍼가 기울고, 간섭색과 반사광이 움직인다
    const tilt = $("#wafer-tilt");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      if (still.matches || e.pointerType === "touch") return;
      const r = svg.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
      tilt.style.setProperty("--ry", (dx * 10).toFixed(2) + "deg");
      tilt.style.setProperty("--rx", (-dy * 10).toFixed(2) + "deg");
      $("#w-irid").setAttribute("gradientTransform", `rotate(${(dx * 60 + dy * 30).toFixed(1)} .5 .5)`);
      $("#w-glare").setAttribute("cx", (50 + dx * 35).toFixed(1) + "%");
      $("#w-glare").setAttribute("cy", (45 + dy * 35).toFixed(1) + "%");
    });
    hero.addEventListener("pointerleave", () => { tilt.style.removeProperty("--rx"); tilt.style.removeProperty("--ry"); });

    // 검사 결과 카드
    const info = $("#die-info");
    const pub = data.books.filter(isPublished).length;
    const fab = books.length - pub;
    const empty = slots.length - books.length;
    const yieldPct = ((pub / slots.length) * 100).toFixed(1);
    const pct = (n) => ((n / slots.length) * 100).toFixed(2) + "%";
    const defaultInfo = () => {
      info.removeAttribute("style");
      info.classList.remove("tint");
      info.innerHTML = `<div class="k">LOT ${lot} · WAFER #01 · INSPECTION</div>
        <h3>수율 ${yieldPct}% <small>매주 올라가는 중</small></h3>
        <div class="ybar" aria-hidden="true"><i class="pass" style="width:${pct(pub)}"></i><i class="fab" style="width:${pct(fab)}"></i></div>
        <div class="row legend"><span><b class="dot pass"></b>PASS ${pub} · 출간</span><span><b class="dot fab"></b>IN FAB ${fab} · 집필 중</span><span><b class="dot"></b>빈 다이 ${empty}</span></div>
        <p class="hint">다이 하나가 교과서 한 권. 다이를 가리키거나 눌러 보세요.</p>`;
    };
    let selected = null;
    const show = (g) => {
      const id = g && g.dataset.id;
      const b = id && data.books.find((x) => x.id === id);
      if (!b) {
        info.removeAttribute("style");
        info.classList.remove("tint");
        info.innerHTML = `<div class="k">DIE ${g.dataset.pos} · <span class="verdict">EMPTY</span></div>
          <h3>아직 노광되지 않은 다이</h3>
          <p>이 자리에 들어갈 다음 책을 준비하고 있습니다. 어떤 책이 들어오면 좋을까요?</p>
          <div class="row"><a href="https://github.com/geniuskey/books/issues">다음 책 제안하기 →</a></div>`;
        return;
      }
      tint(info, b);
      const stage = stageById[b.stage];
      const verdict = isPublished(b) ? `<span class="verdict pass">PASS</span>` : `<span class="verdict fab">IN FAB</span>`;
      const stats = isPublished(b) ? `<span>${b.chapters}개 챕터</span><span>${b.simulators}+ 시뮬레이터</span>` : `<span>${esc(stage ? stage.name : "")} 단계 집필 중</span>`;
      const link = readUrl(b) ? `<a href="${esc(b.url)}">읽으러 가기 →</a>` : `<a href="#card-${esc(b.id)}" data-jump="${esc(b.id)}">책장에서 보기 →</a>`;
      info.innerHTML = `<div class="k">DIE ${g.dataset.pos} · ${verdict} · ${esc(b.code)}</div>
        <h3>${esc(b.title)}<small>${esc(b.subtitle)}</small></h3>
        <p>${esc(isPublished(b) ? b.headline : b.description)}</p>
        <div class="row">${stats}${link}</div>`;
    };
    const byId = (id) => svg.querySelector(`.die.book[data-id="${id}"]`);
    const mark = () => svg.querySelectorAll(".die.book").forEach((g) => g.classList.toggle("active", g.dataset.id === selected));
    const rest = () => (selected ? show(byId(selected)) : defaultInfo());

    svg.addEventListener("pointerover", (e) => { const g = e.target.closest(".die"); if (g) show(g); });
    svg.addEventListener("pointerleave", rest);
    svg.addEventListener("focusin", (e) => { const g = e.target.closest(".die.book"); if (g) show(g); });
    svg.addEventListener("focusout", rest);
    const select = (g) => { selected = selected === g.dataset.id ? null : g.dataset.id; mark(); rest(); };
    svg.addEventListener("click", (e) => { const g = e.target.closest(".die.book"); if (g) select(g); else { const d = e.target.closest(".die"); if (d) show(d); } });
    svg.addEventListener("keydown", (e) => {
      const g = e.target.closest(".die.book");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(g); }
    });
    defaultInfo();
  }

  /* ---------- 가치사슬 지도 (B) ---------- */
  function renderChain() {
    const box = $("#chain");
    data.stages.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "stage";
      const books = data.books.filter((b) => b.stage === s.id);
      el.innerHTML = `<div class="num">STAGE ${String(i + 1).padStart(2, "0")}</div>
        <h3>${esc(s.name)}<small>${esc(s.en)}</small></h3>
        <p class="desc">${esc(s.desc)}</p>`;
      const chips = document.createElement("div");
      chips.className = "chips";
      books.forEach((b) => {
        const a = document.createElement("a");
        a.className = "chip " + b.status;
        tint(a, b);
        a.href = readUrl(b) || `#card-${b.id}`;
        if (!readUrl(b)) a.dataset.jump = b.id;
        a.innerHTML = `<span class="sq">${esc(b.code)}</span><span>${esc(b.title)}<small>${esc(isPublished(b) ? b.subtitle : STATUS[b.status])}</small></span>`;
        chips.appendChild(a);
      });
      if (!books.length) chips.innerHTML = `<div class="empty-slot">곧 채워집니다</div>`;
      el.appendChild(chips);
      box.appendChild(el);
    });
  }

  /* ---------- 전체 책장 (A) ---------- */
  function renderShelf() {
    const grid = $("#grid");
    grid.innerHTML = "";
    data.books.forEach((b) => {
      const stage = stageById[b.stage];
      const card = document.createElement("article");
      card.className = "card " + b.status;
      card.id = "card-" + b.id;
      tint(card, b);
      card.dataset.status = b.status;
      card.dataset.stage = b.stage;
      card.dataset.text = [b.title, b.subtitle, b.headline, b.description, stage && stage.name, ...(b.topics || [])].join(" ").toLowerCase();
      const meta = isPublished(b)
        ? `<div class="meta"><span><b>${b.chapters}</b> 챕터</span><span><b>${b.simulators}+</b> 시뮬레이터</span>${b.level ? `<span>${esc(b.level)}</span>` : ""}</div>`
        : "";
      const read = readUrl(b) ? `<a class="read" href="${esc(b.url)}">읽기 →</a>` : `<span class="badge">${STATUS[b.status]}</span>`;
      card.innerHTML = `
        <div class="cover">${window.coverArt ? window.coverArt(b.motif) : ""}<span class="code">${esc(b.code)}</span><span class="headline">${esc(b.headline)}</span></div>
        <div class="body">
          <h3>${esc(b.title)} <small>${esc(b.subtitle)}</small></h3>
          <div class="tags"><span class="badge stg">${esc(stage ? stage.name : "")}</span>${(b.topics || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          <p>${esc(b.description)}</p>
          ${meta}
        </div>
        <div class="links">${read}${b.repo ? `<a class="gh" href="${esc(b.repo)}">GitHub</a>` : ""}</div>`;
      grid.appendChild(card);
    });
    const none = document.createElement("p");
    none.className = "no-result";
    none.id = "no-result";
    none.hidden = true;
    none.textContent = "조건에 맞는 교과서가 없습니다.";
    grid.after(none);
  }

  function setupFilters() {
    const box = $("#filters");
    const opts = [
      { key: "all", label: "전체" },
      { key: "status:published", label: "출간" },
      { key: "status:writing", label: "집필 중" },
      { sep: true },
      ...data.stages.map((s) => ({ key: "stage:" + s.id, label: s.name })),
    ];
    let current = "all";
    opts.forEach((o) => {
      if (o.sep) { const s = document.createElement("span"); s.className = "sep"; box.appendChild(s); return; }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = o.label;
      btn.dataset.key = o.key;
      btn.setAttribute("aria-pressed", String(o.key === current));
      box.appendChild(btn);
    });
    const search = $("#search");
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      const [field, val] = current.split(":");
      let shown = 0;
      document.querySelectorAll("#grid .card").forEach((c) => {
        const ok = (current === "all" || c.dataset[field] === val) && (!q || c.dataset.text.includes(q));
        c.hidden = !ok;
        if (ok) shown++;
      });
      $("#no-result").hidden = shown > 0;
      // 웨이퍼에서도 걸러진 책을 흐리게
      const visible = new Set([...document.querySelectorAll("#grid .card:not([hidden])")].map((c) => c.id.slice(5)));
      const filtered = current !== "all" || q;
      document.querySelectorAll("#wafer .die.book").forEach((g) => g.classList.toggle("dim", !!filtered && !visible.has(g.dataset.id)));
    };
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      current = btn.dataset.key;
      box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      apply();
    });
    search.addEventListener("input", apply);
  }

  /* ---------- 도구·데이터 ---------- */
  function renderTools() {
    const box = $("#tool-list");
    (data.tools || []).forEach((t) => {
      const rel = (t.related || []).map((id) => data.books.find((b) => b.id === id)).filter(Boolean);
      const el = document.createElement("div");
      el.className = "tool";
      el.innerHTML = `<h3>${esc(t.title)}<small>${esc(t.subtitle)}</small></h3>
        <p>${esc(t.description)}</p>
        ${rel.length ? `<div class="rel">함께 읽기: ${rel.map((b) => `<a href="#card-${esc(b.id)}" data-jump="${esc(b.id)}">${esc(b.title)}</a>`).join(", ")}</div>` : ""}
        <div class="links"><a href="${esc(t.url)}">열기 →</a>${t.repo ? `<a href="${esc(t.repo)}">GitHub</a>` : ""}</div>`;
      box.appendChild(el);
    });
  }

  /* ---------- 직접 만져 보기: 대표 시뮬레이터 ---------- */
  function renderPlay() {
    const all = [];
    data.books.filter(isPublished).forEach((b) => (b.featured || []).forEach((f) => all.push({ ...f, book: b })));
    if (!all.length) { $("#play").hidden = true; return; }
    const href = (f) => f.book.url + f.link;
    // 날짜가 바뀌면 오늘의 시뮬레이터도 바뀐다
    const today = all[Math.floor(Date.now() / 864e5) % all.length];
    const hero = $("#today");
    tint(hero, today.book);
    hero.innerHTML = `<a class="shot" href="${esc(href(today))}"><img src="${esc(today.image)}" alt="${esc(today.title)} 시뮬레이터 화면" loading="lazy"></a>
      <div class="txt">
        <div class="k">TODAY'S SIMULATOR · 오늘의 시뮬레이터</div>
        <h3>${esc(today.title)}</h3>
        <p>${esc(today.desc)}</p>
        <div class="from"><span class="sq">${esc(today.book.code)}</span>${esc(today.book.title)} · ${esc(today.book.subtitle)}</div>
        <a class="btn primary" href="${esc(href(today))}">지금 만져 보기 →</a>
      </div>`;
    const strip = $("#strip");
    all.filter((f) => f !== today).forEach((f) => {
      const a = document.createElement("a");
      a.className = "shot-card";
      a.href = href(f);
      tint(a, f.book);
      a.innerHTML = `<div class="img"><img src="${esc(f.image)}" alt="${esc(f.title)} 시뮬레이터 화면" loading="lazy"></div>
        <div class="cap"><span class="sq">${esc(f.book.code)}</span><b>${esc(f.title)}</b><small>${esc(f.desc)}</small></div>`;
      strip.appendChild(a);
    });
  }

  /* ---------- 만든 사람 ---------- */
  function renderAuthor() {
    const a = data.author;
    if (!a) { $("#author").hidden = true; return; }
    $("#author-body").innerHTML = `<h2>${esc(a.title)}</h2>
      ${a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
      <p class="closing">${esc(a.closing)}</p>
      <div class="sign"><span class="avatar" aria-hidden="true">${esc(a.name.slice(0, 1).toUpperCase())}</span><div><b>${esc(a.name)}</b><small>${esc(a.role)}</small></div>${a.contact ? `<a href="${esc(a.contact)}">GitHub →</a>` : ""}</div>`;
  }

  /* 책장 카드로 이동하면서 잠깐 강조 */
  function setupJumps() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-jump]");
      if (!a) return;
      const card = document.getElementById("card-" + a.dataset.jump);
      if (!card) return;
      if (card.hidden) $("#filters button[data-key='all']").click();
      card.classList.remove("flash");
      void card.offsetWidth;
      card.classList.add("flash");
    });
  }

  async function init() {
    setupTheme();
    try {
      const res = await fetch("data/books.json", { cache: "no-cache" });
      data = await res.json();
    } catch (e) {
      $("#die-info").textContent = "책 목록을 불러오지 못했습니다. 로컬에서는 python3 -m http.server로 실행하세요.";
      return;
    }
    stageById = Object.fromEntries(data.stages.map((s) => [s.id, s]));
    renderStats();
    renderWafer();
    renderPlay();
    renderChain();
    renderShelf();
    setupFilters();
    renderTools();
    renderAuthor();
    setupJumps();
  }

  init();
})();
