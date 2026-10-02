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
  function renderWafer() {
    const svg = $("#wafer");
    const C = 200, R = 188, PITCH = 42, DIE = 37, N = 9;
    const slots = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x = C + (i - (N - 1) / 2) * PITCH, y = C + (j - (N - 1) / 2) * PITCH;
        const far = Math.hypot(Math.abs(x - C) + DIE / 2, Math.abs(y - C) + DIE / 2);
        if (far < R - 6) slots.push({ x, y, d: Math.hypot(x - C, y - C), a: Math.atan2(y - C, x - C) });
      }
    }
    slots.sort((p, q) => p.d - q.d || p.a - q.a);

    const disc = document.createElementNS(SVG, "circle");
    disc.setAttribute("cx", C); disc.setAttribute("cy", C); disc.setAttribute("r", R);
    disc.setAttribute("class", "disc");
    svg.appendChild(disc);
    const notch = document.createElementNS(SVG, "circle");
    notch.setAttribute("cx", C); notch.setAttribute("cy", C + R); notch.setAttribute("r", 7);
    notch.setAttribute("class", "notch");
    svg.appendChild(notch);

    const books = data.books.slice(0, slots.length);
    slots.forEach((s, k) => {
      const b = books[k];
      const g = document.createElementNS(SVG, "g");
      g.setAttribute("class", "die");
      g.style.animationDelay = (k * 18) + "ms";
      const r = document.createElementNS(SVG, "rect");
      r.setAttribute("x", s.x - DIE / 2); r.setAttribute("y", s.y - DIE / 2);
      r.setAttribute("width", DIE); r.setAttribute("height", DIE); r.setAttribute("rx", 4);
      g.appendChild(r);
      if (b) {
        tint(g, b);
        g.classList.add("book", b.status);
        g.dataset.id = b.id;
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `${b.title} · ${b.subtitle} (${STATUS[b.status]})`);
        const t = document.createElementNS(SVG, "text");
        t.setAttribute("x", s.x); t.setAttribute("y", s.y);
        t.textContent = b.code;
        g.appendChild(t);
      }
      svg.appendChild(g);
    });

    const info = $("#die-info");
    const pub = data.books.filter(isPublished).length;
    const defaultInfo = () => {
      info.removeAttribute("style");
      info.classList.remove("tint");
      info.innerHTML = `<div class="k">WAFER MAP · ${slots.length} DIES</div>
        <h3>다이 하나가 교과서 한 권</h3>
        <p>지금 ${slots.length}개 다이 중 <b>${pub}개</b>가 출간되었고 ${books.length - pub}개를 집필하고 있습니다. 빈 다이는 앞으로 채워질 책입니다.</p>
        <div class="row">다이를 가리키거나 눌러 보세요.</div>`;
    };
    let selected = null;
    const show = (id) => {
      const b = data.books.find((x) => x.id === id);
      if (!b) return defaultInfo();
      tint(info, b);
      const stage = stageById[b.stage];
      const stats = isPublished(b) ? `<span>${b.chapters}개 챕터</span><span>${b.simulators}+ 시뮬레이터</span>` : `<span>${STATUS[b.status]}</span>`;
      const link = readUrl(b) ? `<a href="${esc(b.url)}">읽으러 가기 →</a>` : `<a href="#card-${esc(b.id)}" data-jump="${esc(b.id)}">책장에서 보기 →</a>`;
      info.innerHTML = `<div class="k">${esc(b.code)} · ${esc(stage ? stage.name : "")}</div>
        <h3>${esc(b.title)}<small>${esc(b.subtitle)}</small></h3>
        <p>${esc(isPublished(b) ? b.headline : b.description)}</p>
        <div class="row">${stats}${link}</div>`;
    };
    const mark = () => svg.querySelectorAll(".die.book").forEach((g) => g.classList.toggle("active", g.dataset.id === selected));

    svg.addEventListener("pointerover", (e) => { const g = e.target.closest(".die.book"); if (g) show(g.dataset.id); });
    svg.addEventListener("pointerleave", () => (selected ? show(selected) : defaultInfo()));
    svg.addEventListener("focusin", (e) => { const g = e.target.closest(".die.book"); if (g) show(g.dataset.id); });
    const select = (g) => { selected = selected === g.dataset.id ? null : g.dataset.id; mark(); selected ? show(selected) : defaultInfo(); };
    svg.addEventListener("click", (e) => { const g = e.target.closest(".die.book"); if (g) select(g); });
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
        <div class="cover"><span class="code">${esc(b.code)}</span><span class="headline">${esc(b.headline)}</span></div>
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
    renderChain();
    renderShelf();
    setupFilters();
    renderTools();
    setupJumps();
  }

  init();
})();
