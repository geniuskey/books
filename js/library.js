/* 전체 책장: 상단 검색, 분야 선택, 간결한 목록과 즐겨찾기. */
EB.start("library", (d) => {
  "use strict";
  const { $, esc } = EB;
  const favoriteKey = "books:favorites:v1";
  const publishedIds = new Set(d.books.filter(EB.isPublished).map((b) => b.id));
  function readFavorites() {
    try {
      const ids = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
      return new Set(Array.isArray(ids) ? ids.filter((id) => publishedIds.has(id)) : []);
    } catch { return new Set(); }
  }
  let favorites = readFavorites();
  const state = { field: "all" };
  const fields = [{ id: "all", name: "모든 분야" }, ...d.fields.filter((f) => f.books.length)];
  const fieldButtons = new Map();
  fields.forEach((field, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span class="map-field-number" aria-hidden="true">${EB.pad2(index)}</span>${esc(field.name)}`;
    button.addEventListener("click", () => { state.field = field.id; sync(); });
    fieldButtons.set(field.id, button);
    $("#library-fields").appendChild(button);
  });

  const menu = document.createElement("div");
  menu.className = "book-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "즐겨찾기 설정");
  menu.hidden = true;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("role", "menuitem");
  menu.appendChild(toggle);
  document.body.appendChild(menu);
  let menuBook = null;
  let menuAnchor = null;
  function closeMenu(restore = false) {
    menu.hidden = true;
    if (restore && menuAnchor) menuAnchor.focus({ preventScroll: true });
  }
  function openMenu(event, book, anchor) {
    event.preventDefault();
    closeDetails();
    menuBook = book;
    menuAnchor = anchor;
    toggle.textContent = favorites.has(book.id) ? "★ 즐겨찾기 해제" : "☆ 즐겨찾기 추가";
    menu.hidden = false;
    const rect = anchor.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(event.clientX || rect.left, innerWidth - menu.offsetWidth - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(event.clientY || rect.top, innerHeight - menu.offsetHeight - 8)) + "px";
    toggle.focus();
  }
  toggle.addEventListener("click", () => {
    if (!menuBook) return;
    if (favorites.has(menuBook.id)) favorites.delete(menuBook.id); else favorites.add(menuBook.id);
    try { localStorage.setItem(favoriteKey, JSON.stringify([...favorites])); } catch {}
    closeMenu();
    sync();
    menuAnchor.focus({ preventScroll: true });
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeMenu(true); }
    if (event.key === "Tab") closeMenu();
  });
  document.addEventListener("pointerdown", (event) => { if (!menu.contains(event.target)) closeMenu(); });
  document.addEventListener("focusin", (event) => { if (!menu.contains(event.target)) closeMenu(); });
  document.addEventListener("scroll", () => closeMenu(), true);
  window.addEventListener("resize", () => closeMenu());
  window.addEventListener("blur", () => closeMenu());
  window.addEventListener("storage", (event) => {
    if (event.key === favoriteKey || event.key === null) { favorites = readFavorites(); closeMenu(); sync(); }
  });

  const tooltip = document.createElement("div");
  tooltip.id = "catalog-tooltip";
  tooltip.className = "catalog-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.appendChild(tooltip);
  let detailAnchor = null;
  let hideDetailTimer;
  function closeDetails() {
    clearTimeout(hideDetailTimer);
    detailAnchor?.removeAttribute("aria-describedby");
    detailAnchor = null;
    tooltip.hidden = true;
  }
  function positionDetails(x, y) {
    const gap = 16;
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const left = x + gap + width <= innerWidth - 12 ? x + gap : x - width - gap;
    const top = y + gap + height <= innerHeight - 12 ? y + gap : y - height - gap;
    tooltip.style.left = `${Math.max(12, Math.min(left, innerWidth - width - 12))}px`;
    tooltip.style.top = `${Math.max(12, Math.min(top, innerHeight - height - 12))}px`;
  }
  function showDetails(anchor, html, event) {
    clearTimeout(hideDetailTimer);
    if (detailAnchor !== anchor) {
      closeDetails();
      detailAnchor = anchor;
      tooltip.innerHTML = html;
      tooltip.scrollTop = 0;
      anchor.setAttribute("aria-describedby", tooltip.id);
    }
    tooltip.hidden = false;
    const rect = anchor.getBoundingClientRect();
    positionDetails(event ? event.clientX : rect.left, event ? event.clientY : rect.bottom);
  }
  function deferCloseDetails() {
    hideDetailTimer = setTimeout(closeDetails, 180);
  }
  tooltip.addEventListener("pointerenter", () => clearTimeout(hideDetailTimer));
  tooltip.addEventListener("pointerleave", deferCloseDetails);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDetails(); });
  document.addEventListener("pointerdown", (event) => {
    if (!tooltip.contains(event.target) && !detailAnchor?.contains(event.target)) closeDetails();
  });
  document.addEventListener("scroll", (event) => { if (!tooltip.contains(event.target)) closeDetails(); }, true);
  window.addEventListener("resize", closeDetails);
  window.addEventListener("blur", closeDetails);

  const rows = [];
  const sections = [];
  d.fields.forEach((field) => {
    const section = document.createElement("section");
    section.className = "group";
    EB.tint(section, field);
    section.innerHTML = `<div class="group-head"><h2><i></i>${esc(field.name)} <small class="field-result-count"></small></h2><a href="${EB.mapUrl(field.id)}">지식 지도 →</a></div><div class="catalog-list"></div>`;
    const entries = [];
    field.books.forEach((book) => {
      const row = EB.card(book);
      const link = EB.readUrl(book) || (book.status === "writing" ? book.url : "");
      const topics = book.topics || [];
      const detailHTML = `<strong class="catalog-tooltip-title">${esc(book.title)}</strong><p>${esc(book.description || book.subtitle)}</p>${topics.length ? `<div class="catalog-topics">${topics.map((topic) => `<span>${esc(topic)}</span>`).join("")}</div>` : ""}${EB.isPublished(book) ? `<p>${esc(book.chapters)} 챕터 · ${esc(book.simulators)}+ 시뮬레이터${book.level ? ` · ${esc(book.level)}` : ""}</p>` : book.ideas?.length ? `<ul>${book.ideas.map((idea) => `<li>${esc(idea)}</li>`).join("")}</ul>` : ""}`;
      const detailCover = $(".catalog-cover", row);
      if (!link) detailCover.tabIndex = 0;
      detailCover.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse" && menu.hidden) showDetails(detailCover, detailHTML, event);
      });
      detailCover.addEventListener("pointermove", (event) => {
        if (event.pointerType === "mouse" && detailAnchor && detailCover.contains(detailAnchor)) positionDetails(event.clientX, event.clientY);
      });
      detailCover.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse") deferCloseDetails();
      });
      detailCover.addEventListener("focusin", (event) => {
        if (event.target.matches(":focus-visible") && menu.hidden) showDetails(event.target, detailHTML);
      });
      detailCover.addEventListener("focusout", (event) => {
        if (!detailCover.contains(event.relatedTarget) && detailAnchor && detailCover.contains(detailAnchor)) closeDetails();
      });
      if (link && EB.isPublished(book)) {
        const anchor = $("a.catalog-cover", row);
        anchor.setAttribute("aria-haspopup", "menu");
        row.addEventListener("contextmenu", (event) => openMenu(event, book, anchor));
        row.addEventListener("keydown", (event) => {
          if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) openMenu(event, book, anchor);
        });
        let timer;
        let held = false;
        row.addEventListener("pointerdown", (event) => {
          held = false;
          if (event.pointerType === "touch") timer = setTimeout(() => { held = true; openMenu(event, book, anchor); }, 550);
        });
        ["pointerup", "pointercancel", "pointermove"].forEach((type) => row.addEventListener(type, () => clearTimeout(timer)));
        row.addEventListener("click", (event) => { if (held) { event.preventDefault(); held = false; } });
      }
      const entry = { book, row, text: [book.title, book.subtitle, book.headline, book.description, field.name, book.stageObj?.name, ...topics, ...(book.ideas || [])].join(" ").toLowerCase() };
      rows.push(entry);
      entries.push(entry);
      $(".catalog-list", section).appendChild(row);
    });
    sections.push({ section, entries });
    $("#shelf-groups").appendChild(section);
  });

  const search = $(".header-search input");
  search.setAttribute("aria-label", "전체 책장 검색");
  search.addEventListener("input", sync);
  $(".header-search").addEventListener("submit", (event) => { event.preventDefault(); sync(); });
  const query = new URLSearchParams(location.search);
  if (fields.some((field) => field.id === EB.resolveField(query.get("field")))) state.field = EB.resolveField(query.get("field"));
  search.value = query.get("q") || "";
  function sync() {
    closeMenu();
    closeDetails();
    fields.forEach((field) => {
      const button = fieldButtons.get(field.id);
      button.setAttribute("aria-pressed", String(state.field === field.id));
    });
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach(({ book, row, text }) => {
      const visible = (state.field === "all" || book.field === state.field) && (!q || text.includes(q));
      row.hidden = !visible;
      $(".catalog-star", row).hidden = !favorites.has(book.id);
      if (visible) shown++;
    });
    sections.forEach(({ section, entries }) => {
      const count = entries.filter(({ row }) => !row.hidden).length;
      section.hidden = !count;
      $(".field-result-count", section).textContent = `${count}권`;
    });
    $("#shown").textContent = `${shown}권`;
    $("#no-result").hidden = shown > 0;
    const params = new URLSearchParams();
    if (state.field !== "all") params.set("field", state.field);
    if (q) params.set("q", search.value.trim());
    history.replaceState(null, "", `${location.pathname}${params.size ? "?" + params : ""}${location.hash}`);
  }
  sync();
  if (location.hash.startsWith("#card-")) {
    const card = document.getElementById(location.hash.slice(1));
    if (card && !card.hidden) {
      requestAnimationFrame(() => card.scrollIntoView());
    }
  }
});
