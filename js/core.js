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
  EB.resolveField = (id) => EB.data?.fieldAliases?.[id] || id;
  EB.fieldUrl = (id) => `/library/?field=${encodeURIComponent(EB.resolveField(id))}&status=all`;
  EB.mapUrl = (id) => `/paths/?field=${encodeURIComponent(EB.resolveField(id))}`;

  /* books.json을 읽고 서로 참조하기 쉽게 정리한다 */
  EB.load = async () => {
    const res = await fetch("/data/books.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`Book catalog request failed: ${res.status}`);
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
    { href: "/library/", label: "교과서 찾기", key: "library" },
    { href: "/paths/", label: "지식 지도", key: "paths" },
    { href: "/simulators/", label: "실험 찾기", key: "simulators" },
    { href: "/feedback/", label: "독자 의견", key: "feedback" },
  ];
  EB.header = (active) => {
    const h = document.createElement("header");
    h.className = "topbar";
    h.innerHTML = `<div class="wrap">
      <a class="brand" href="/"><img src="/favicon.svg" alt=""> Books <small>인터랙티브 교과서 시리즈</small></a>
      <form class="header-search" action="/library/" method="get" role="search" aria-label="전체 책 검색">
        <input type="search" name="q" role="combobox" aria-label="책 이름이나 주제 검색" aria-autocomplete="list" aria-expanded="false" aria-controls="header-search-suggestions" placeholder="책 이름이나 주제로 검색" autocomplete="off">
        <button type="submit" aria-label="검색"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
        <ul class="header-search-suggestions" id="header-search-suggestions" role="listbox" aria-label="관련 검색어" hidden></ul>
      </form>
      <nav class="topnav" aria-label="주요 메뉴">
        ${NAV.map((n) => `<a href="${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${n.label}</a>`).join("")}
      </nav>
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
    if (active === "library") $(".header-search input", h).value = new URLSearchParams(location.search).get("q") || "";
    $("#theme-btn").addEventListener("click", () => {
      const root = document.documentElement;
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    });
  };

  EB.initHeaderSearch = (d) => {
    const form = $(".header-search");
    const input = $("input", form);
    const list = $(".header-search-suggestions", form);
    const normalize = (value) => value.normalize("NFC").trim().toLowerCase();
    const terms = new Map();
    const add = (value, detail, label = value) => {
      if (!value) return;
      const key = normalize(value);
      if (!terms.has(key)) terms.set(key, { value, label, detail, text: normalize(`${value} ${label}`) });
    };
    d.fields.filter((field) => field.books.length).forEach((field) => {
      add(field.name, "분야");
      (field.stages || []).forEach((stage) => add(stage.name, "분류"));
    });
    d.books.forEach((book) => {
      add(book.title, book.title, book.subtitle || book.title);
      (book.topics || []).forEach((topic) => add(topic, "주제"));
    });
    let matches = [];
    let selected = -1;
    let composing = false;
    const close = () => {
      list.hidden = true;
      selected = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    };
    const render = () => {
      const query = normalize(input.value);
      if (!query) { close(); return; }
      const rank = (term) => normalize(term.value) === query ? 0
        : normalize(term.value).startsWith(query) || normalize(term.label).startsWith(query) ? 1 : 2;
      matches = [...terms.values()].filter((term) => term.text.includes(query))
        .sort((a, b) => rank(a) - rank(b)).slice(0, 8);
      selected = -1;
      input.removeAttribute("aria-activedescendant");
      list.innerHTML = matches.length ? matches.map((term, index) => `<li id="header-search-option-${index}" role="option" aria-selected="false" data-index="${index}"><span>${esc(term.label)}</span><small>${esc(term.detail)}</small></li>`).join("")
        : '<li class="header-search-empty" role="presentation">관련 검색어가 없습니다.</li>';
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };
    const choose = (index) => {
      input.value = matches[index].value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      close();
      form.requestSubmit();
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("compositionstart", () => { composing = true; });
    input.addEventListener("compositionend", () => { composing = false; render(); });
    input.addEventListener("keydown", (event) => {
      if (composing || event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") {
        if (!list.hidden) { event.preventDefault(); close(); }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (list.hidden) render();
        if (!matches.length || list.hidden) return;
        selected = selected < 0 ? (event.key === "ArrowDown" ? 0 : matches.length - 1)
          : (selected + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length;
        $$("[role=option]", list).forEach((option, index) => option.setAttribute("aria-selected", String(index === selected)));
        const option = list.children[selected];
        input.setAttribute("aria-activedescendant", option.id);
        option.scrollIntoView({ block: "nearest" });
      } else if (event.key === "Enter" && !list.hidden && selected >= 0) {
        event.preventDefault();
        choose(selected);
      }
    });
    list.addEventListener("mousedown", (event) => event.preventDefault());
    list.addEventListener("click", (event) => {
      const option = event.target.closest("[data-index]");
      if (option) choose(Number(option.dataset.index));
    });
    form.addEventListener("submit", (event) => {
      if (composing) event.preventDefault();
      close();
    });
    form.addEventListener("focusout", (event) => {
      if (!form.contains(event.relatedTarget)) close();
    });
    document.addEventListener("click", (event) => {
      if (!form.contains(event.target)) close();
    });
    if (document.activeElement === input) render();
  };

  EB.footer = () => {
    const f = document.createElement("footer");
    f.innerHTML = `<div class="wrap">
      <p>© euiyun · 본문 <a href="https://creativecommons.org/licenses/by/4.0/deed.ko">CC BY 4.0</a>, 코드 <a href="https://github.com/geniuskey/books/blob/main/LICENSE.md">MIT</a></p>
      <p class="links"><a href="/">홈</a><a href="/library/">전체 책장</a><a href="/paths/">지식 지도</a><a href="/roadmap/">로드맵</a><a href="/feedback/">독자 의견</a><a href="https://github.com/geniuskey/books">이 사이트의 소스</a></p>
    </div>`;
    document.body.appendChild(f);
  };

  /* 홈·전체 책장 표지와 지식 지도가 같은 한글 책 이름을 사용한다. */
  const coverTopics = {
    devicebook: "반도체 소자", digitalbook: "디지털 회로", designbook: "반도체 설계", socbook: "시스템 온 칩",
    analogbook: "아날로그 회로", processbook: "제조 공정", lithobook: "노광",
    etchbook: "식각", dopingbook: "도핑", yieldbook: "수율 분석", failurebook: "불량 분석",
    tcadbook: "소자 시뮬레이션", packagingbook: "패키징", testbook: "반도체 검사",
    memorybook: "메모리", opticsbook: "센서 광학", sensorbook: "이미지 센서", displaybook: "디스플레이",
    chipindustrybook: "반도체 산업", computerbook: "컴퓨터", aibook: "인공지능",
    carbook: "자동차", shipbook: "선박", phonebook: "스마트폰",
    colorbook: "색채공학", moneybook: "돈과 금융", stockbook: "주식", insurebook: "보험", taxbook: "세금", camerabook: "카메라",
  };
  EB.coverTitle = (b) => coverTopics[b.id] || (b.subtitle || "").replace(/ 교과서$/, "") || b.title;

  /* 전체 책장의 세로 표지와 짧은 소개 */
  EB.card = (b, { details = false } = {}) => {
    const card = document.createElement("article");
    card.className = "catalog-book " + b.status;
    card.id = "card-" + b.id;
    EB.tint(card, b);
    const title = EB.coverTitle(b);
    const link = EB.readUrl(b) || (b.status === "writing" ? b.url : "");
    const action = EB.isPublished(b) ? "읽기" : "미리 읽기";
    const cover = `<small class="catalog-cover-field">${esc(b.fieldObj.name)}</small><strong class="catalog-cover-title">${esc(title)}</strong><span class="catalog-cover-art" aria-hidden="true">${window.coverArt ? window.coverArt(b.motif) : ""}</span><span class="catalog-cover-footer"><span>${esc(b.title)}</span><span>${esc(b.code)}</span></span>`;
    card.innerHTML = `${link ? `<a class="catalog-cover" href="${esc(link)}" aria-label="${esc(title)} ${action} (새 탭)">${cover}</a>` : `<div class="catalog-cover">${cover}</div>`}
      <div class="catalog-content"><h3>${link ? `<a href="${esc(link)}">${esc(b.title)}</a>` : esc(b.title)}<span class="catalog-star" aria-label="즐겨찾기" hidden>★</span></h3>${!EB.isPublished(b) ? `<span class="catalog-status">${esc(EB.status(b))}</span>` : ""}
      <p class="catalog-summary">${esc(b.headline || b.subtitle)}</p>
      ${details ? `<details class="catalog-details"><summary aria-label="${esc(b.title)} 상세 보기">상세 보기</summary>
        <p>${esc(b.description || b.subtitle)}</p>
        ${b.topics?.length ? `<div class="catalog-topics">${b.topics.map((topic) => `<span>${esc(topic)}</span>`).join("")}</div>` : ""}
        ${EB.isPublished(b) ? `<p class="catalog-meta">${esc(b.chapters)} 챕터 · ${esc(b.simulators)}+ 시뮬레이터${b.level ? ` · ${esc(b.level)}` : ""}</p>` : b.ideas?.length ? `<p>만들고 싶은 시뮬레이터</p><ul>${b.ideas.map((idea) => `<li>${esc(idea)}</li>`).join("")}</ul>` : ""}
      </details>` : ""}</div>`;
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
    const details = $(".catalog-details", card);
    if (details) details.open = true;
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
  });

  /* 책 사이트(xxxbook.euiyun.com 등 다른 euiyun.com 하위 도메인)로 가는 링크만 새 탭으로 연다.
     포털 안의 메뉴·페이지 이동은 현재 탭에 둔다. */
  const openInNewTab = (a) => {
    if (a.hasAttribute("download") || !/^https?:$/.test(a.protocol)) return;
    if (a.hostname === location.hostname || !a.hostname.endsWith(".euiyun.com")) return;
    a.target = "_blank";
    if (!a.relList.contains("noopener")) a.relList.add("noopener");
  };
  const scanLinks = (root) => {
    if (root.matches?.("a[href]")) openInNewTab(root);
    root.querySelectorAll?.("a[href]").forEach(openInNewTab);
  };
  scanLinks(document);
  new MutationObserver((records) => records.forEach((r) => {
    if (r.type === "attributes") scanLinks(r.target);
    else r.addedNodes.forEach(scanLinks);
  })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });

  /* 페이지 시작: 머리말·꼬리말을 붙이고 데이터를 읽은 뒤 페이지별 함수를 부른다 */
  EB.start = (active, fn) => {
    EB.header(active);
    EB.footer();
    const reportError = (err, message) => {
      console.error(err);
      const main = $("main");
      const p = document.createElement("p");
      p.className = "wrap load-error";
      p.setAttribute("role", "alert");
      p.textContent = message;
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "다시 시도";
      retry.addEventListener("click", () => location.reload());
      p.append(" ", retry);
      main.prepend(p);
    };
    EB.load().then(async (d) => {
      try {
        EB.initHeaderSearch(d);
        await fn(d);
      } catch (err) {
        reportError(err, "책장 화면을 표시하는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.");
      }
    }, (err) => reportError(err, "책 목록 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
  };
})();
