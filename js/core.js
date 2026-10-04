/* Books — 모든 페이지가 함께 쓰는 데이터 로딩, 머리말·꼬리말, 카드 렌더링 */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");

  const EB = (window.EB = { $, $$, esc, pad2, data: null });

  /* 책·분야 색을 라이트/다크 두 벌로 걸어 둔다 */
  EB.tint = (el, x) => {
    el.classList.add("tint");
    el.style.setProperty("--c-l", x.color);
    el.style.setProperty("--c-d", x.colorDark || x.color);
  };
  EB.isPublished = (b) => b.status === "published";
  EB.readUrl = (b) => (EB.isPublished(b) && b.url ? b.url : "");
  EB.status = (b) => (EB.data.statusLabels || {})[b.status] || b.status;
  EB.fieldUrl = (id) => `field.html?f=${encodeURIComponent(id)}`;

  /* books.json을 읽고 서로 참조하기 쉽게 정리한다 */
  EB.load = async () => {
    const res = await fetch("data/books.json", { cache: "no-cache" });
    const d = await res.json();
    d.fieldById = Object.fromEntries(d.fields.map((f) => [f.id, f]));
    d.wingById = Object.fromEntries(d.wings.map((w) => [w.id, w]));
    d.books.forEach((b) => {
      const f = d.fieldById[b.field];
      b.fieldObj = f;
      if (!b.color) { b.color = f.color; b.colorDark = f.colorDark; }
      const st = f.stages && f.stages.find((s) => s.id === b.stage);
      b.stageObj = st || null;
    });
    d.fields.forEach((f) => { f.books = d.books.filter((b) => b.field === f.id); });
    EB.data = d;
    return d;
  };

  EB.counts = (books) => {
    const c = { published: 0, writing: 0, planned: 0, total: books.length };
    books.forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; });
    return c;
  };

  /* ---------- 머리말·꼬리말 ---------- */
  const NAV = [
    { href: "library.html", label: "교과서 찾기", key: "library" },
    { href: "simulators.html", label: "실험 찾기", key: "simulators" },
    { href: "feedback.html", label: "독자 의견", key: "feedback" },
  ];
  EB.header = (active) => {
    const h = document.createElement("header");
    h.className = "topbar";
    h.innerHTML = `<div class="wrap">
      <a class="brand" href="/"><img src="favicon.svg" alt=""> Books <small>인터랙티브 교과서 시리즈</small></a>
      <nav class="topnav" aria-label="주요 메뉴">${NAV.map((n) => `<a href="${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}</nav>
      <div class="actions">
        <button class="icon-btn" id="theme-btn" type="button" aria-label="라이트/다크 모드 전환">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </button>
        <a class="icon-btn" href="https://github.com/geniuskey" aria-label="GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>
        </a>
      </div>
    </div>`;
    document.body.prepend(h);
    $("#theme-btn").addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    });
  };

  EB.footer = () => {
    const f = document.createElement("footer");
    f.innerHTML = `<div class="wrap">
      <p>© euiyun · 본문 <a href="https://creativecommons.org/licenses/by/4.0/deed.ko">CC BY 4.0</a>, 코드 <a href="https://github.com/geniuskey/books/blob/main/LICENSE.md">MIT</a></p>
      <p class="links"><a href="index.html">홈</a><a href="library.html">전체 책장</a><a href="roadmap.html">로드맵</a><a href="feedback.html">독자 의견</a><a href="https://github.com/geniuskey/books">이 사이트의 소스</a></p>
    </div>`;
    document.body.appendChild(f);
  };

  /* ---------- 책 카드 ---------- */
  EB.card = (b) => {
    const card = document.createElement("article");
    card.className = "card " + b.status;
    card.id = "card-" + b.id;
    EB.tint(card, b);
    card.dataset.status = b.status;
    card.dataset.field = b.field;
    card.dataset.wing = b.fieldObj.wing;
    card.dataset.text = [b.title, b.subtitle, b.headline, b.description, b.fieldObj.name, b.stageObj && b.stageObj.name, ...(b.topics || []), ...(b.ideas || [])].join(" ").toLowerCase();
    const where = `<a class="badge stg" href="${EB.fieldUrl(b.field)}">${esc(b.fieldObj.name)}${b.stageObj ? " · " + esc(b.stageObj.name) : ""}</a>`;
    if (b.status === "planned") {
      card.innerHTML = `
        <div class="cover slim"><span class="code">${esc(b.code)}</span><span class="badge plan">${esc(EB.status(b))}</span></div>
        <div class="body">
          <h3>${esc(b.title)} <small>${esc(b.subtitle)}</small></h3>
          <div class="tags">${where}</div>
          <p>${esc(b.description)}</p>
          ${b.ideas && b.ideas.length ? `<div class="ideas"><b>만들고 싶은 시뮬레이터</b><ul>${b.ideas.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
        </div>`;
      return card;
    }
    const meta = EB.isPublished(b)
      ? `<div class="meta"><span><b>${b.chapters}</b> 챕터</span><span><b>${b.simulators}+</b> 시뮬레이터</span>${b.level ? `<span>${esc(b.level)}</span>` : ""}</div>`
      : "";
    const read = EB.readUrl(b) ? `<a class="read" href="${esc(b.url)}">읽기 →</a>` : `<span class="badge">${esc(EB.status(b))}</span>`;
    card.innerHTML = `
      <div class="cover">${window.coverArt ? window.coverArt(b.motif) : ""}<span class="code">${esc(b.code)}</span><span class="headline">${esc(b.headline || EB.status(b))}</span></div>
      <div class="body">
        <h3>${esc(b.title)} <small>${esc(b.subtitle)}</small></h3>
        <div class="tags">${where}${(b.topics || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <p>${esc(b.description)}</p>
        ${meta}
      </div>
      <div class="links">${read}${b.repo ? `<a class="gh" href="${esc(b.repo)}">GitHub</a>` : ""}</div>`;
    return card;
  };

  /* 진행률 막대: 출간 / 집필 중 / 집필 예정 */
  EB.progress = (books) => {
    const c = EB.counts(books);
    const w = (n) => (c.total ? ((n / c.total) * 100).toFixed(2) : 0) + "%";
    return `<div class="pbar" role="img" aria-label="출간 ${c.published}, 집필 중 ${c.writing}, 집필 예정 ${c.planned}"><i class="pub" style="width:${w(c.published)}"></i><i class="wri" style="width:${w(c.writing)}"></i><i class="pla" style="width:${w(c.planned)}"></i></div>`;
  };

  /* 다른 곳에서 카드로 이동하면서 잠깐 강조 */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-jump]");
    if (!a) return;
    const card = document.getElementById("card-" + a.dataset.jump);
    if (!card) return;
    card.hidden = false;
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
  });

  /* 페이지 시작: 머리말·꼬리말을 붙이고 데이터를 읽은 뒤 페이지별 함수를 부른다 */
  EB.start = (active, fn) => {
    EB.header(active);
    EB.footer();
    EB.load()
      .then(fn)
      .catch((err) => {
        console.error(err);
        const main = $("main");
        const p = document.createElement("p");
        p.className = "wrap load-error";
        p.textContent = "책 목록을 불러오지 못했습니다. 로컬에서는 python3 -m http.server로 실행하세요.";
        main.prepend(p);
      });
  };
})();
