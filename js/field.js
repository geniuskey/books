/* 분야별 지식 아틀라스: 공간 탐색과 주소 복원 */
EB.initKnowledgeMaps = (d) => {
  "use strict";
  const { $, $$, esc } = EB;
  const fields = d.fields.filter((field) => field.books.length);
  const readingPanel = $("#paths-reading");
  const fieldMap = $("#flow");
  const picker = $("#map-fields");
  const chain = $("#chain");
  const viewport = $("#map-viewport");
  const extent = $("#map-extent");
  const detail = $("#map-detail");
  const cardWidth = 208;
  const cardHeight = 88;
  const cardGap = 10;
  const regionPadding = 14;
  const regionHeader = 54;
  chain.style.setProperty("--map-card-width", `${cardWidth}px`);
  chain.style.setProperty("--map-card-height", `${cardHeight}px`);
  let atlas;
  let selectedBook;
  let currentField;
  const mobileLayout = window.matchMedia("(max-width: 760px)");

  function placeDetail() {
    const region = selectedBook && atlas?.nodes.get(selectedBook)?.element.closest(".atlas-region");
    if (mobileLayout.matches && region) {
      const cards = $$(".map-book", region);
      const index = cards.indexOf(atlas.nodes.get(selectedBook).element);
      // The mobile grid has two columns; keep the selected row together.
      cards[Math.min(index - index % 2 + 1, cards.length - 1)].after(detail);
    } else viewport.after(detail);
  }

  fields.forEach((field, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span class="map-field-number" aria-hidden="true">${EB.pad2(index + 1)}</span>${esc(field.name)}`;
    button.dataset.field = field.id;
    button.addEventListener("click", () => navigate(field.id));
    picker.appendChild(button);
  });

  function renderField(id) {
    const f = d.fieldById[id];
    currentField = id;
    $$("button", picker).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.field === id)));
    const activeField = $(`[data-field="${id}"]`, picker);
    picker.scrollLeft = Math.max(0, activeField.offsetLeft - picker.offsetLeft - (picker.clientWidth - activeField.offsetWidth) / 2);
    EB.tint(fieldMap, f);
    const libraryUrl = EB.fieldUrl(id);
    $("#field-library-link").href = libraryUrl;
    const map = window.FIELD_MAPS[id];
    const groups = f.stages
      ? f.stages.map((stage) => ({ ...stage, books: f.books.filter((book) => book.stage === stage.id) }))
      : (map?.groups || []).map(([name, en, desc, ids]) => ({ name, en, desc, books: ids.map((bookId) => f.books.find((book) => book.id === bookId)).filter(Boolean) })).filter((group) => group.books.length);
    const assigned = new Set(groups.flatMap((group) => group.books.map((book) => book.id)));
    const remaining = f.books.filter((book) => !assigned.has(book.id));
    if (remaining.length) groups.push({ name: "더 넓게 탐색하기", en: "Explore", desc: "이 분야에서 이어지는 주제", books: remaining });

    $("#map-field-index").textContent = `${EB.pad2(fields.indexOf(f) + 1)} / ${f.en}`;
    $("#map-field-title").textContent = map?.title || f.name;
    $("#map-field-description").textContent = map?.desc || f.desc;
    $("#map-stats").innerHTML = `<div><dt>교과서</dt><dd>${EB.pad2(f.books.length)}</dd></div><div><dt>바로 읽기</dt><dd>${EB.pad2(f.books.filter(EB.isPublished).length)}</dd></div><div><dt>주제</dt><dd>${EB.pad2(groups.length)}</dd></div>`;

    fieldMap.setAttribute("aria-label", `${f.name} 지식 지도`);
    viewport.setAttribute("aria-label", `${f.name} 지식 지도 탐색`);
    renderAtlas(f, groups, map);
    document.dispatchEvent(new CustomEvent("knowledgefieldchange", { detail: { field: id } }));
  }

  function renderAtlas(field, groups, map) {
    selectedBook = null;
    placeDetail();
    $("#map-selection-status").textContent = "";
    detail.hidden = true;
    chain.replaceChildren();
    // Pack topics by their actual book count instead of reserving fixed cells.
    // Five narrow topics fit in one row; larger topics wrap in reading order.
    const regionGap = 20;
    const maxRowWidth = 5 * (cardWidth + regionPadding * 2) + 4 * regionGap;
    let nextX = 12;
    let nextY = 12;
    let rowHeight = 0;
    const nodes = new Map();
    let width = 0;
    let height = 0;
    groups.forEach((group, index) => {
      const customPosition = map?.regions?.[index];
      const columns = customPosition?.[2] || (group.books.length > 2 ? 2 : 1);
      const cols = Math.min(columns, Math.max(1, group.books.length));
      const rows = Math.max(1, Math.ceil(group.books.length / cols));
      const regionWidth = cols * cardWidth + (cols - 1) * cardGap + regionPadding * 2;
      const regionHeight = regionHeader + rows * cardHeight + (rows - 1) * cardGap + regionPadding;
      if (!customPosition && nextX > 12 && nextX + regionWidth > maxRowWidth + 12) {
        nextX = 12;
        nextY += rowHeight + regionGap;
        rowHeight = 0;
      }
      const [x, y] = customPosition || [nextX, nextY];
      nextX = x + regionWidth + regionGap;
      rowHeight = Math.max(rowHeight, regionHeight);
      width = Math.max(width, x + regionWidth + 12);
      height = Math.max(height, y + regionHeight + 12);
      const section = document.createElement("section");
      section.className = "atlas-region";
      section.setAttribute("aria-labelledby", `map-group-${index}`);
      Object.assign(section.style, { left: `${x}px`, top: `${y}px`, width: `${regionWidth}px`, height: `${regionHeight}px` });
      section.innerHTML = `<div class="atlas-region-heading"><span>${EB.pad2(index + 1)} / ${esc(group.en)}</span><h3 id="map-group-${index}">${esc(group.name)}<small>${group.books.length}권</small></h3></div>`;
      group.books.forEach((book, bookIndex) => {
        const left = regionPadding + bookIndex % cols * (cardWidth + cardGap);
        const top = regionHeader + Math.floor(bookIndex / cols) * (cardHeight + cardGap);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "map-book " + book.status;
        button.id = "card-" + book.id;
        button.dataset.book = book.id;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", `${EB.coverTitle(book)} · ${EB.status(book)} · 연결과 소개 보기`);
        EB.tint(button, book);
        Object.assign(button.style, { left: `${left}px`, top: `${top}px` });
        button.innerHTML = `<span class="map-book-code" aria-hidden="true">${esc(book.code)}</span><span class="map-book-name"><b>${esc(EB.coverTitle(book))}</b><small><i aria-hidden="true"></i>${esc(EB.isPublished(book) ? book.title : EB.status(book))}</small></span>`;
        nodes.set(book.id, { book, element: button, x: x + left + cardWidth / 2, y: y + top + cardHeight / 2, group });
        button.addEventListener("click", () => {
          selectBook(selectedBook === book.id ? null : book.id);
          if (mobileLayout.matches && selectedBook) detail.scrollIntoView({ block: "nearest", behavior: "instant" });
        });
        button.addEventListener("pointerenter", () => highlight(book.id));
        button.addEventListener("pointerleave", () => highlight(selectedBook));
        button.addEventListener("focus", () => highlight(book.id));
        button.addEventListener("blur", () => highlight(selectedBook));
        button.addEventListener("keydown", (event) => {
          if (event.key === "Escape") { selectBook(null); return; }
          const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
          const direction = directions[event.key];
          if (!direction) return;
          event.preventDefault();
          if (mobileLayout.matches) atlas.nodes.forEach((node) => {
            const rect = node.element.getBoundingClientRect();
            node.x = rect.left + rect.width / 2;
            node.y = rect.top + rect.height / 2;
          });
          const origin = nodes.get(book.id);
          const next = [...nodes.values()].filter((node) => (node.x - origin.x) * direction[0] + (node.y - origin.y) * direction[1] > 1)
            .sort((a, b) => score(a) - score(b))[0];
          function score(node) {
            const dx = node.x - origin.x, dy = node.y - origin.y;
            return Math.hypot(dx, dy) + Math.abs(dx * direction[1] - dy * direction[0]) * 2;
          }
          next?.element.focus({ preventScroll: true });
          if (next) revealBook(next.book.id);
        });
        section.appendChild(button);
      });
      chain.appendChild(section);
    });
    const links = (map?.links || []).filter(([from, to]) => nodes.has(from) && nodes.has(to));
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("atlas-lines");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("aria-hidden", "true");
    links.forEach(([from, to, label]) => {
      const a = nodes.get(from), b = nodes.get(to);
      const dx = b.x - a.x, dy = b.y - a.y;
      const path = document.createElementNS(svg.namespaceURI, "path");
      const curve = Math.abs(dx) > Math.abs(dy)
        ? `C ${a.x + dx * .5} ${a.y}, ${b.x - dx * .5} ${b.y}, ${b.x} ${b.y}`
        : `C ${a.x} ${a.y + dy * .5}, ${b.x} ${b.y - dy * .5}, ${b.x} ${b.y}`;
      path.setAttribute("d", `M ${a.x} ${a.y} ${curve}`);
      path.dataset.from = from;
      path.dataset.to = to;
      path.appendChild(document.createElementNS(svg.namespaceURI, "title")).textContent = label;
      svg.appendChild(path);
    });
    chain.prepend(svg);
    Object.assign(chain.style, { width: `${width}px`, height: `${height}px` });
    atlas = { width, height, nodes, links, field };
    detail.replaceChildren();
    // 지도 탭이 표시된 뒤 실제 너비로 초기 배율을 계산합니다.
    requestAnimationFrame(() => {
      if (currentField !== field.id) return;
      fitMap();
    });
  }

  function highlight(id) {
    if (!atlas) return;
    const neighbors = new Set([id]);
    atlas.links.forEach(([from, to]) => {
      if (from === id) neighbors.add(to);
      if (to === id) neighbors.add(from);
    });
    chain.classList.toggle("is-exploring", Boolean(id));
    atlas.nodes.forEach((node, bookId) => node.element.classList.toggle("is-related", neighbors.has(bookId)));
    $$("path", chain).forEach((path) => path.classList.toggle("is-active", path.dataset.from === id || path.dataset.to === id));
  }

  function selectBook(id) {
    selectedBook = id;
    placeDetail();
    atlas.nodes.forEach((node, bookId) => node.element.setAttribute("aria-pressed", String(bookId === id)));
    highlight(id);
    if (!id) {
      detail.hidden = true;
      $("#map-selection-status").textContent = "책 선택을 해제했습니다.";
      return;
    }
    const { book, group } = atlas.nodes.get(id);
    detail.hidden = false;
    const url = EB.readUrl(book) || (book.status === "writing" && book.url) || `${EB.fieldUrl(book.field)}&q=${encodeURIComponent(book.title)}`;
    const related = atlas.links.filter(([from, to]) => from === id || to === id).map(([from, to, reason]) => ({ id: from === id ? to : from, reason }));
    const relatedButton = (item) => `<button type="button" data-related="${esc(item.id)}"><b>${esc(EB.coverTitle(atlas.nodes.get(item.id).book))} <span aria-hidden="true">↗</span></b><small>${esc(item.reason)}</small></button>`;
    const preview = mobileLayout.matches ? related.slice(0, 2) : related;
    const remaining = mobileLayout.matches ? related.slice(2) : [];
    detail.innerHTML = `<button type="button" class="atlas-detail-close" aria-label="책 소개 닫기">×</button><div class="atlas-detail-main"><div><span class="atlas-detail-kicker">${esc(group.name)} · ${esc(EB.status(book))}</span><h3>${esc(EB.coverTitle(book))} <small>${esc(book.title)}</small></h3><p>${esc(book.headline || book.description || book.subtitle)}</p></div><a class="btn" href="${esc(url)}">${EB.isPublished(book) ? "책 읽기 ↗" : book.status === "writing" && book.url ? "집필 중인 책 보기 ↗" : "책장에서 자세히 보기 →"}</a></div>
      ${related.length ? `<div class="atlas-related"><span>함께 살펴볼 책 · ${related.length}권</span><div>${preview.map(relatedButton).join("")}</div>${remaining.length ? `<details class="atlas-related-more"><summary>연결된 책 ${remaining.length}권 더 보기</summary><div class="atlas-related-list">${remaining.map(relatedButton).join("")}</div></details>` : ""}</div>` : `<p class="atlas-single-note">${esc(group.desc)}${atlas.nodes.size === 1 ? " · 이 분야의 첫 책입니다." : ""}</p>`}`;
    const closeDetail = () => {
      const selected = atlas.nodes.get(selectedBook)?.element;
      selectBook(null);
      selected?.focus({ preventScroll: true });
      selected?.scrollIntoView({ block: "nearest", behavior: "instant" });
    };
    $(".atlas-detail-close", detail).addEventListener("click", closeDetail);
    detail.onkeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetail();
      }
    };
    $$("[data-related]", detail).forEach((button) => button.addEventListener("click", () => {
      const next = button.dataset.related;
      selectBook(next);
      atlas.nodes.get(next).element.focus({ preventScroll: true });
      if (mobileLayout.matches) detail.scrollIntoView({ block: "nearest", behavior: "instant" });
      else revealBook(next);
    }));
    $("#map-selection-status").textContent = `${EB.coverTitle(book)} 선택. 연결된 책 ${related.length}권. ${mobileLayout.matches ? "소개와 읽기 링크는 선택한 책의 바로 다음 줄에 있습니다." : "소개와 읽기 링크는 지도 다음에 있습니다."}`;
  }

  function revealBook(id) {
    const node = atlas.nodes.get(id);
    if (!node) return;
    node.element.scrollIntoView({ block: "nearest", behavior: "instant" });
  }

  function fitMap() {
    if (!atlas) return;
    const scale = mobileLayout.matches ? 1 : Math.min(1, (viewport.clientWidth - 24) / atlas.width);
    chain.style.transform = `scale(${scale})`;
    extent.style.width = `${atlas.width * scale}px`;
    extent.style.height = `${atlas.height * scale}px`;
  }

  let resizeWidth = 0;
  mobileLayout.addEventListener("change", () => {
    const book = selectedBook;
    renderField(currentField);
    if (book) selectBook(book);
  });
  new ResizeObserver(() => {
    const width = viewport.clientWidth;
    if (!width || width === resizeWidth || !atlas) return;
    fitMap();
    resizeWidth = width;
  }).observe(viewport);

  function navigate(field) {
    const url = new URL(location.href);
    url.searchParams.delete("view");
    url.searchParams.set("field", field);
    url.hash = "";
    if (url.href !== location.href) history.pushState(null, "", url.pathname + url.search);
    if (currentField !== field) renderField(field);
  }

  function restore() {
    const params = new URLSearchParams(location.search);
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ""; }
    const book = hash.startsWith("card-") && d.books.find((item) => item.id === hash.slice(5));
    const target = hash ? document.getElementById(hash) : null;
    const path = target?.closest("[data-fields]") || target?.querySelector("[data-fields]");
    const pathField = path?.dataset.fields.split(" ")[0];
    const field = book?.field || pathField || fields.find((item) => item.id === EB.resolveField(params.get("field")))?.id || fields[0].id;
    if (currentField !== field || !$(".atlas-region", fieldMap)) renderField(field);
    if (params.get("view") === "reading") readingPanel.open = true;
    if (book) requestAnimationFrame(() => {
      selectBook(book.id);
      revealBook(book.id);
      atlas.nodes.get(book.id).element.classList.add("flash");
    });
  }

  window.addEventListener("popstate", restore);
  window.addEventListener("hashchange", restore);
  document.addEventListener("pathsready", restore);
  restore();
};
