/* 페이지에 필요한 파일만, books.json과 동시에 요청한다 */
const discoveryData = fetch(document.body.dataset.page === "paths" ? "/data/paths.json" : "/data/discovery.json")
  .then((response) => {
    if (!response.ok) throw new Error("실험 목록 로딩 실패");
    return response.json();
  });
discoveryData.catch(() => {});
EB.start(document.body.dataset.page, async (d) => {
  "use strict";
  const { $, $$, esc } = EB;
  const books = Object.fromEntries(d.books.map((b) => [b.id, b]));
  const normalize = (s) => s.normalize("NFKC").toLowerCase();
  if (document.body.dataset.page === "paths") {
    EB.initKnowledgeMaps(d);
    let data;
    try { data = await discoveryData; }
    catch {
      $("#learning-paths").innerHTML = '<p>읽는 순서를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p>';
      return;
    }
    const fieldsFor = (steps) => [...new Set(steps.map((step) => books[step.bookId].field))].join(" ");
    const routeChain = (steps) => steps.map((step) => {
      const book = books[step.bookId];
      return `<span class="route-book tint" style="--c-l:${esc(book.color)};--c-d:${esc(book.colorDark || book.color)}"><i aria-hidden="true">${esc(book.code)}</i><b>${esc(EB.coverTitle(book))}</b></span>`;
    }).join('<span class="route-arrow" aria-hidden="true">→</span>');
    const bookPaths = data.bookPaths;
    const groups = [...new Set(bookPaths.map((p) => p.group))];
    $("#learning-paths").innerHTML = `
      ${groups.map((g, i) => `<section class="book-path-group" id="path-group-${i}" aria-labelledby="path-group-${i}-title"><h2 id="path-group-${i}-title">${esc(g)}</h2><div class="book-path-list">${bookPaths.filter((p) => p.group === g).map((p) => `<details class="book-path" id="${esc(p.id)}" data-fields="${esc(fieldsFor(p.steps))}"><summary><span class="book-path-question">${esc(p.title)}</span><span class="route-chain" aria-label="추천 읽는 순서">${routeChain(p.steps)}</span></summary><div class="book-path-body"><p><b>이런 독자에게</b> ${esc(p.start)}</p><ol>${p.steps.map((s) => `<li><h3><a href="${esc(books[s.bookId].url)}">${esc(books[s.bookId].title)} <span>${esc(books[s.bookId].subtitle)}</span></a></h3><p class="book-path-focus"><b>먼저 볼 주제</b> ${esc(s.focus)}</p><p>${esc(s.why)}</p><a class="path-open" href="${esc(books[s.bookId].url)}">책과 목차 열기 →</a><a class="book-path-experiments" href="/simulators/?book=${encodeURIComponent(s.bookId)}">이 책의 실험 찾기</a></li>`).join("")}</ol><p class="path-footer"><a href="#${esc(p.id)}">이 경로 링크</a><a href="#learning-paths">다른 경로 고르기 ↑</a></p></div></details>`).join("")}</div></section>`).join("")}
      <section id="practice-paths" class="practice-paths" aria-labelledby="practice-paths-title"><h2 id="practice-paths-title">짧은 실험 경로</h2>
      ${data.paths.map((p) => `<details class="path-practice" data-fields="${esc(fieldsFor(p.steps))}"><summary>${esc(p.title)} <span class="path-meta">약 ${esc(p.duration)} · ${p.steps.length}단계</span></summary><article class="learning-path" id="${esc(p.id)}" aria-labelledby="${esc(p.id)}-title">
      <p class="path-meta">${p.steps.length}단계 · 약 ${esc(p.duration)}</p>
      <h2 id="${esc(p.id)}-title">${esc(p.title)}</h2><p>${esc(p.description)}</p>
      <dl class="path-facts"><div><dt>추천 독자</dt><dd>${esc(p.audience)}</dd></div><div><dt>시작하기 전에</dt><dd>${esc(p.prerequisites)}</dd></div><div><dt>끝내고 나면</dt><dd>${esc(p.outcome)}</dd></div></dl>
      <section class="path-case" aria-labelledby="${esc(p.id)}-case"><h3 id="${esc(p.id)}-case">따라갈 사례</h3><p>${esc(p.scenario)}</p><p class="path-case-note">${esc(p.note)}</p></section>
      <ol class="path-steps">${p.steps.map((s, i) => `<li><div class="path-step-head"><h3>${esc(s.title)}</h3><span class="path-meta">약 ${esc(s.duration)}</span></div>
        <p>${esc(s.why)}</p><p><b>해볼 일</b> ${esc(s.task)}</p><p class="path-record"><b>남길 기록</b> ${esc(s.record)}</p>
        <a class="path-open" href="${esc(new URL(s.link, books[s.bookId].url).href)}" target="_blank" rel="noopener">${i + 1}단계 실험 열기 →</a><span class="path-book">${esc(books[s.bookId].title)}</span></li>`).join("")}</ol>
      <section class="challenge" aria-labelledby="${esc(p.id)}-challenge"><h3 id="${esc(p.id)}-challenge">처음 질문에 답해 보세요</h3><p>${esc(p.challenge)}</p><h4>답변 점검</h4><ul>${p.checks.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>
      <p class="path-footer"><a href="/simulators/?q=${encodeURIComponent(p.query)}">관련 실험 더 찾기 →</a><a href="#${esc(p.id)}">이 경로 링크</a><a href="#learning-paths">다른 경로 고르기 ↑</a></p>
    </article></details>`).join("")}</section>`;
    function filterPaths(field) {
      $$("#learning-paths [data-fields]").forEach((path) => {
        path.hidden = !path.dataset.fields.split(" ").includes(field);
      });
      $$(".book-path-group").forEach((group) => { group.hidden = !$(".book-path:not([hidden])", group); });
      $("#practice-paths").hidden = !$(".path-practice:not([hidden])");
      const count = $$(".book-path:not([hidden])").length;
      $("#reading-count").textContent = count ? `· ${count}개` : "";
    }
    document.addEventListener("knowledgefieldchange", (event) => filterPaths(event.detail.field));
    document.dispatchEvent(new Event("pathsready"));
    filterPaths($("#map-fields [aria-pressed=true]").dataset.field);
    function revealPath() {
      if (!location.hash) return;
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
      const target = document.getElementById(id);
      if (!target || !target.closest("#paths-reading")) return;
      for (let element = target; element; element = element.parentElement) {
        if (element.matches("details")) element.open = true;
        if (element === $("#paths-reading")) break;
      }
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
    $("#learning-paths").addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.hash !== location.hash) return;
      revealPath();
    });
    window.addEventListener("hashchange", revealPath);
    window.addEventListener("popstate", revealPath);
    revealPath();
    return;
  }
  const data = await discoveryData;
  /* 생성 파일에서 생략한 값(책 ID·URL·난이도·빈 필드)을 되살린다 */
  const concepts = Object.fromEntries(data.concepts.map((c) => [c.id, c]));
  data.experiments.forEach((e) => {
    const [bookId, chapter, ...anchor] = e.id.split("/");
    const book = books[bookId];
    e.bookId = bookId;
    e.url = book.url.replace(/\/$/, "") + "/" + (e.link || `chapters/${chapter}.html#${anchor.join("/")}`);
    e.level = book.level || "입문";
    e.description ??= "";
    e.question ??= "";
    e.concepts ??= [];
    e.reviewStatus ??= "unreviewed";
  });
  const search = $("#search");
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") || "";
  const pageSizeControl = $("#page-size");
  const pageSizes = ["25", "50", "100"];
  let savedPageSize;
  try { savedPageSize = localStorage.getItem("books.experimentPageSize"); } catch (e) {}
  pageSizeControl.value = pageSizes.includes(params.get("rows")) ? params.get("rows")
    : pageSizes.includes(savedPageSize) ? savedPageSize : "25";
  let pageSize = Number(pageSizeControl.value);
  let page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  const totals = { book: new Map(), field: new Map(), level: new Map() };
  data.experiments.forEach((e) => {
    const book = books[e.bookId];
    for (const [name, value] of [["book", e.bookId], ["field", book.field], ["level", e.level]]) {
      totals[name].set(value, (totals[name].get(value) || 0) + 1);
    }
  });
  const options = {
    field: d.fields.filter((f) => totals.field.has(f.id)).map((f) => [f.id, f.name]),
    book: d.books.filter((b) => totals.book.has(b.id)).map((b) => [b.id, b.title]),
    level: [...totals.level.keys()].map((v) => [v, v]),
  };
  const menuIds = { field: "#filter-fields", book: "#filter-books", level: "#filter-levels" };
  const selected = Object.fromEntries(Object.keys(options).map((name) => [name,
    new Set(params.getAll(name).map((value) => name === "field" ? EB.resolveField(value) : value).filter((value) => totals[name].has(value)))]));
  const names = Object.keys(options);
  const searchText = new Map(data.experiments.map((e) => {
    const book = books[e.bookId];
    return [e.id, normalize([e.title, e.description, e.question, book.title, book.subtitle, book.fieldObj.name,
      ...e.concepts.flatMap((id) => [concepts[id].label, ...concepts[id].aliases])].join(" "))];
  }));
  function valueFor(name, e) {
    if (name === "field") return books[e.bookId].field;
    if (name === "book") return e.bookId;
    return e.level;
  }
  function passes(e, name) {
    return !selected[name].size || selected[name].has(valueFor(name, e));
  }
  for (const [name, values] of Object.entries(options)) {
    $(menuIds[name]).innerHTML = `<div class="filter-options">${values.map(([value, label]) =>
      `<label class="filter-option"><input type="checkbox" value="${esc(value)}" ${selected[name].has(value) ? "checked" : ""}><span>${esc(label)}</span><small>${totals[name].get(value).toLocaleString("ko-KR")}</small></label>`).join("")}</div>
      <p class="filter-empty" hidden>선택할 항목이 없습니다.</p>
      <button type="button" class="filter-clear">이 열 선택 해제</button>`;
  }
  function updateFilterLabels() {
    $$(".column-filter-trigger").forEach((trigger) => {
      const count = selected[trigger.dataset.filter].size;
      trigger.classList.toggle("active", count > 0);
      $(".filter-count", trigger).textContent = count ? `(${count})` : "";
    });
  }
  let openFilter = null;
  function closeMenu(restoreFocus = false) {
    if (!openFilter) return;
    const trigger = $(`.column-filter-trigger[data-filter="${openFilter}"]`);
    $(menuIds[openFilter]).hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    openFilter = null;
    if (restoreFocus) trigger.focus();
  }
  function openMenu(name) {
    closeMenu();
    const trigger = $(`.column-filter-trigger[data-filter="${name}"]`);
    const menu = $(menuIds[name]);
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    openFilter = name;
    const rect = trigger.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    const below = rect.bottom + 6;
    menu.style.top = `${below + height <= window.innerHeight - 8 ? below
      : rect.top >= height + 14 ? rect.top - height - 6
        : Math.max(8, window.innerHeight - height - 8)}px`;
  }
  function render() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const matchingText = data.experiments.filter((e) => words.every((word) => searchText.get(e.id).includes(word)));
    const matches = matchingText.filter((e) => names.every((name) => passes(e, name)));
    for (const name of names) {
      const counts = new Map();
      matchingText.forEach((e) => {
        if (!names.every((other) => other === name || passes(e, other))) return;
        const value = valueFor(name, e);
        counts.set(value, (counts.get(value) || 0) + 1);
      });
      const menu = $(menuIds[name]);
      let visible = 0;
      $$(".filter-option", menu).forEach((label) => {
        const input = $("input", label);
        const count = counts.get(input.value) || 0;
        label.hidden = count === 0 && !selected[name].has(input.value);
        $("small", label).textContent = count.toLocaleString("ko-KR");
        if (!label.hidden) visible++;
      });
      $(".filter-empty", menu).hidden = visible > 0;
      $(".filter-clear", menu).hidden = selected[name].size === 0;
    }
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pageCount);
    $("#shown").textContent = matches.length === data.experiments.length
      ? `전체 ${data.experiments.length.toLocaleString("ko-KR")}개 실험`
      : `검색 결과 ${matches.length.toLocaleString("ko-KR")}개 · 전체 ${data.experiments.length.toLocaleString("ko-KR")}개`;
    $("#no-result").hidden = matches.length > 0;
    $("#experiments").innerHTML = matches.slice((page - 1) * pageSize, page * pageSize).map((e, i) => {
      const book = books[e.bookId];
      return `<tr><td class="experiment-number">${String((page - 1) * pageSize + i + 1).padStart(4, "0")}</td>
        <td>${esc(book.fieldObj.name)}</td>
        <td><a class="experiment-book" href="${esc(book.url)}">${esc(book.title)}</a></td>
        <td class="experiment-title"><a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)} <span aria-hidden="true">↗</span></a>
          ${e.description ? `<p class="experiment-description">${esc(e.description)}</p>` : ""}
          ${e.question ? `<p class="experiment-question"><b>살펴볼 질문</b> ${esc(e.question)}</p>` : ""}
          ${e.reviewStatus === "reference-checked" ? `<p class="experiment-validation"><b>기준 사례 확인</b> ${esc(e.validationSummary)}</p>` : ""}</td>
        <td>${esc(e.level)}</td></tr>`;
    }).join("");
    const pages = $("#experiment-pages");
    pages.innerHTML = pageCount > 1 ? `<button type="button" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>이전</button><span>${page} / ${pageCount}</span><button type="button" data-page="${page + 1}" ${page === pageCount ? "disabled" : ""}>다음</button>` : "";
    const next = new URLSearchParams();
    if (search.value.trim()) next.set("q", search.value.trim());
    for (const name of Object.keys(options)) for (const value of selected[name]) next.append(name, value);
    next.set("rows", String(pageSize));
    if (page > 1) next.set("page", page);
    history.replaceState(null, "", location.pathname + (next.size ? `?${next}` : ""));
    updateFilterLabels();
  }
  search.addEventListener("input", () => { page = 1; render(); });
  pageSizeControl.addEventListener("change", () => {
    pageSize = Number(pageSizeControl.value);
    try { localStorage.setItem("books.experimentPageSize", pageSizeControl.value); } catch (e) {}
    page = 1;
    render();
  });
  $$(".column-filter-trigger").forEach((trigger) => {
    const name = trigger.dataset.filter;
    const menu = $(menuIds[name]);
    trigger.addEventListener("click", () => {
      if (openFilter === name) closeMenu(); else openMenu(name);
    });
    menu.addEventListener("change", (event) => {
      const input = event.target;
      if (!input.matches('input[type="checkbox"]')) return;
      const values = selected[name];
      if (input.checked) values.add(input.value); else values.delete(input.value);
      page = 1;
      render();
    });
    menu.addEventListener("click", (event) => {
      if (!event.target.matches(".filter-clear")) return;
      selected[name].clear();
      $$("input", menu).forEach((input) => { input.checked = false; });
      page = 1;
      render();
    });
  });
  document.addEventListener("pointerdown", (event) => {
    if (openFilter && !event.target.closest(".filter-popover, .column-filter-trigger")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openFilter) closeMenu(true);
  });
  window.addEventListener("resize", () => closeMenu());
  window.addEventListener("scroll", () => closeMenu());
  $("#experiment-table-wrap").addEventListener("scroll", () => closeMenu());
  $("#experiment-pages").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    page = Number(button.dataset.page);
    render();
    $("#shown").scrollIntoView({ block: "start" });
  });
  $("#reset-filters").addEventListener("click", () => {
    search.value = "";
    Object.values(selected).forEach((values) => values.clear());
    $$(".filter-popover input").forEach((input) => { input.checked = false; });
    closeMenu();
    page = 1;
    render();
    search.focus();
  });
  render();
});
