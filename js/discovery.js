EB.start(document.body.dataset.page, async (d) => {
  "use strict";
  const { $, $$, esc } = EB;
  const response = await fetch("data/discovery.json");
  if (!response.ok) throw new Error("실험 목록 로딩 실패");
  const data = await response.json();
  const books = Object.fromEntries(d.books.map((b) => [b.id, b]));
  const concepts = Object.fromEntries(data.concepts.map((c) => [c.id, c]));
  const normalize = (s) => s.normalize("NFKC").toLowerCase();
  if (document.body.dataset.page === "paths") {
    $("#learning-paths").innerHTML = data.paths.map((p) => `<article class="learning-path" id="${esc(p.id)}">
      <h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><p><b>시작하기 전에:</b> ${esc(p.prerequisites)}</p>
      <ol>${p.steps.map((s) => `<li><a href="${esc(new URL(s.link, books[s.bookId].url).href)}">${esc(s.title)}</a>
        <small> · ${esc(books[s.bookId].title)}</small><p>${esc(s.task)}</p></li>`).join("")}</ol>
      <div class="challenge"><b>마지막으로 설명해 보세요</b><p>${esc(p.challenge)}</p></div>
      <p><a href="simulators.html?q=${encodeURIComponent(p.query)}">관련 실험 더 찾기 →</a> · <a href="#${esc(p.id)}">이 경로 링크</a></p>
    </article>`).join("");
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return;
  }
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
    new Set(params.getAll(name).filter((value) => totals[name].has(value)))]));
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
        <td class="experiment-title"><a href="${esc(e.url)}">${esc(e.title)} <span aria-hidden="true">↗</span></a></td>
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
