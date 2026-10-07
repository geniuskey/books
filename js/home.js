/* 홈: 출간된 책장, 두 갈래와 분야 카드, 대표 시뮬레이터, 저자 노트, 도구 */
EB.start("home", (d) => {
  "use strict";
  const { $, esc } = EB;

  // 통계
  const c = EB.counts(d.books);
  const vals = { published: c.published, writing: c.writing, planned: c.planned, fields: d.fields.filter((f) => f.books.length).length, experiments: d.books.filter(EB.isPublished).reduce((n, b) => n + (b.featured || []).length, 0) };
  EB.$$("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });

  // 첫 화면의 서가: 다른 분야를 먼저 보여 주고, 출간된 책만 바로 연결한다.
  const published = d.books.filter((b) => EB.isPublished(b) && b.url);
  const beyondChips = published.filter((b) => b.field !== "semiconductor");
  const chips = published.filter((b) => b.field === "semiconductor");
  const shelves = [];
  const orderedBooks = [...beyondChips, ...chips];
  const booksPerShelf = Math.max(1, Math.ceil(orderedBooks.length / 2));
  for (let i = 0; i < orderedBooks.length; i += booksPerShelf) {
    shelves.push([i === 0 ? "더 넓은 세계" : "계속 이어지는 책들", orderedBooks.slice(i, i + booksPerShelf)]);
  }
  const shelfBox = $("#home-shelves");
  const spineTopics = {
    devicebook: "반도체 소자", designbook: "반도체 설계", socbook: "시스템 온 칩",
    analogbook: "아날로그 회로", processbook: "제조 공정", lithobook: "노광",
    etchbook: "식각", dopingbook: "도핑", yieldbook: "수율 분석", failurebook: "불량 분석",
    tcadbook: "소자 시뮬레이션", packagingbook: "패키징", testbook: "반도체 검사",
    memorybook: "메모리", opticsbook: "센서 광학", sensorbook: "이미지 센서", displaybook: "디스플레이",
    chipindustrybook: "반도체 산업", computerbook: "컴퓨터", aibook: "인공지능",
    carbook: "자동차", shipbook: "선박", phonebook: "스마트폰",
    colorbook: "색채공학", moneybook: "돈과 금융", stockbook: "주식", insurebook: "보험", camerabook: "카메라",
  };
  let cancelBookOpening = null;
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) cancelBookOpening?.();
  });

  // 펼친 책의 가운데 쪽: 대표 실험을 본문과 그림으로 보여 준다.
  const textLines = (n) => `<span class="spread-text">${"<i></i>".repeat(n)}</span>`;
  function spreadPages(book, title) {
    const sim = (book.featured || [])[0];
    const seed = [...book.id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
    const folio = 24 + (seed % 140) * 2;
    const figure = sim
      ? `<img src="${esc(sim.image)}" alt="" decoding="async">`
      : `<span class="spread-art">${window.coverArt ? window.coverArt(book.motif) : ""}</span>`;
    const left = `<header>${esc(title)}</header>
      <small>${sim ? "직접 해 보는 실험" : esc(book.fieldObj.name)}</small>
      <strong>${esc(sim ? sim.title : book.headline || book.subtitle)}</strong>
      <p>${esc(sim ? sim.desc : book.description || book.subtitle)}</p>
      ${textLines(9)}<footer>${folio}</footer>`;
    const right = `<header>${esc(book.subtitle)}</header>
      <figure>${figure}<figcaption>그림 ${(seed % 9) + 1}. ${esc(sim ? sim.title : book.headline || title)}</figcaption></figure>
      ${textLines(7)}<footer>${folio + 1}</footer>`;
    return { left, right };
  }
  // 펼치기 전에 대표 실험 썸네일을 미리 받아 둔다.
  function preloadSpread(book) {
    const sim = (book.featured || [])[0];
    if (sim && !preloadSpread.done.has(sim.image)) { preloadSpread.done.add(sim.image); new Image().src = sim.image; }
  }
  preloadSpread.done = new Set();

  // 책 펼침 애니메이션은 기본으로 꺼 두고, 켜기를 고른 사람에게만 보여 준다.
  const openingAnimationKey = "books:opening-animation:v1";
  const readOpeningAnimation = () => {
    try { return localStorage.getItem(openingAnimationKey) === "on"; } catch { return false; }
  };
  let openingAnimation = readOpeningAnimation();
  function openBook(event, link, book, title) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        !openingAnimation || matchMedia("(prefers-reduced-motion: reduce)").matches || !Element.prototype.animate) return;
    event.preventDefault();
    if (cancelBookOpening) return;

    const spread = spreadPages(book, title);
    const layer = document.createElement("div");
    layer.className = "book-opening";
    layer.style.setProperty("--book-color", book.color);
    function updateGeometry() {
      const rect = link.getBoundingClientRect();
      const width = Math.min(240, innerWidth * .39, innerHeight * .43);
      const height = width * 1.42;
      const perspective = 1400;
      // At rotateY(90deg), the spine is width / 2 closer to the camera.
      // Cancel that perspective magnification when matching the shelf bounds.
      const initialScale = rect.height / height * (1 - width / (2 * perspective));
      // Keep every face and hinge in the same responsive coordinate system.
      const depth = rect.width * height / rect.height;
      const values = {
        "opening-width": `${width}px`, "opening-depth": `${depth}px`,
        "opening-perspective": `${perspective}px`,
        "opening-gap": `${depth * .04}px`,
        "opening-x": `${rect.left + rect.width / 2 - document.documentElement.clientWidth / 2}px`,
        "opening-y": `${rect.top + rect.height / 2 - document.documentElement.clientHeight / 2}px`,
        "opening-scale": initialScale,
      };
      Object.entries(values).forEach(([name, value]) => layer.style.setProperty(`--${name}`, value));
    }
    updateGeometry();
    window.addEventListener("resize", updateGeometry);
    layer.innerHTML = `<div class="book-opening-shade"></div>
      <div class="book-opening-stage" aria-hidden="true"><div class="book-opening-model">
        <div class="opening-back"></div>
        <div class="opening-edge opening-edge-top"></div><div class="opening-edge opening-edge-bottom"></div><div class="opening-edge opening-edge-side"></div>
        <div class="opening-paper opening-paper-base">${spread.right}</div>
        <div class="opening-paper opening-leaf leaf-one"></div><div class="opening-paper opening-leaf leaf-two"><div class="opening-leaf-back">${spread.left}</div></div>
        <div class="opening-cover"><div class="opening-cover-front"><small>${esc(book.fieldObj.name)}</small><strong>${esc(title)}</strong><span>${esc(book.subtitle)}</span><em>${esc(book.code)} / GENIUSKEY</em></div><div class="opening-cover-inside"></div></div>
        <div class="opening-spine">${esc(title)}</div>
        <div class="opening-gutter"></div>
      </div></div><p class="book-opening-caption" role="status">${esc(title)} 펼치는 중…</p>`;
    document.body.appendChild(layer);
    link.classList.add("book-is-opening");
    const animations = [];
    let timer;
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("resize", updateGeometry);
      animations.forEach((animation) => animation.cancel());
      layer.remove();
      link.classList.remove("book-is-opening");
      document.removeEventListener("keydown", onKey);
      cancelBookOpening = null;
    }
    function onKey(e) {
      if (e.key === "Escape") { cleanup(); link.focus({ preventScroll: true }); }
    }
    cancelBookOpening = cleanup;
    document.addEventListener("keydown", onKey);
    function openDestination() {
      // Create the destination only after the animation; never reload the shelf.
      const tab = window.open("about:blank", "_blank");
      if (tab) {
        tab.opener = null;
        tab.location.replace(link.href);
        cleanup();
      } else {
        // Some browsers require a fresh click after a delayed popup request.
        const caption = $(".book-opening-caption", layer);
        caption.replaceChildren();
        const retry = document.createElement("a");
        retry.href = link.href;
        retry.target = "_blank";
        retry.rel = "noopener";
        retry.textContent = `${title} 새 탭에서 열기 →`;
        retry.style.color = "inherit";
        retry.addEventListener("click", () => setTimeout(cleanup, 0), { once: true });
        caption.appendChild(retry);
        retry.focus({ preventScroll: true });
      }
    }
    const animate = (selector, frames, options) => animations.push($(selector, layer).animate(frames, { fill: "both", ...options }));
    try {
      animate(".book-opening-stage", [
        { transform: "translate(var(--opening-x), var(--opening-y)) scale(var(--opening-scale))", offset: 0 },
        { transform: "translate(var(--opening-x), calc(var(--opening-y) - 28px)) scale(var(--opening-scale))", offset: .15 },
        { transform: "translate(0, 0) scale(1)", offset: .55 },
        { transform: "translate(calc(var(--opening-width) * .35), 0) scale(1)", offset: 1 },
      ], { duration: 1150, easing: "linear" });
      animate(".book-opening-model", [
        { transform: "rotateX(0deg) rotateY(90deg) rotateZ(0deg)" },
        { transform: "rotateX(8deg) rotateY(24deg) rotateZ(-5deg)", offset: .55 },
        { transform: "rotateX(8deg) rotateY(-10deg) rotateZ(-2deg)" },
      ], { duration: 650, easing: "linear" });
      // All inner edges share one binding axis. Tiny closed angles keep the
      // faces ordered without separating their hinges along the book depth.
      animate(".opening-cover", [{ transform: "translateZ(var(--paper-front)) rotateY(-.9deg)" }, { transform: "translateZ(var(--paper-front)) rotateY(-158deg)" }], { delay: 550, duration: 650, easing: "cubic-bezier(.3,0,.2,1)" });
      [".leaf-one", ".leaf-two"].forEach((selector, i) => animate(selector, [
        { transform: `translateZ(var(--paper-front)) rotateY(${-0.6 + i * .3}deg)` },
        { transform: `translateZ(var(--paper-front)) rotateY(${-148 + i * 12}deg)` },
      ], { delay: 650 + i * 70, duration: 650, easing: "ease-in-out" }));
      animate(".book-opening-shade", [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      animate(".book-opening-caption", [{ opacity: 0 }, { opacity: 1 }], { delay: 150, duration: 250 });
      // Hold the open spread long enough to glimpse the featured experiment.
      timer = setTimeout(openDestination, 2000);
    } catch (error) {
      openDestination();
    }
  }
  const favoriteKey = "books:favorites:v1";
  const bookIds = new Set(published.map((book) => book.id));
  function readFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
      return new Set(Array.isArray(saved) ? saved.filter((id) => bookIds.has(id)) : []);
    } catch { return new Set(); }
  }
  let favorites = readFavorites();
  // 관심 없는 책은 내 책장에서 숨긴다. 숨긴 책 보기를 켜면 흐리게 다시 나타난다.
  const hiddenKey = "books:hidden:v1";
  function readHidden() {
    try {
      const saved = JSON.parse(localStorage.getItem(hiddenKey) || "[]");
      return new Set(Array.isArray(saved) ? saved.filter((id) => bookIds.has(id)) : []);
    } catch { return new Set(); }
  }
  let hiddenBooks = readHidden();
  let revealHidden = false;
  const favoriteLinks = new Map();
  // 빈 책장에서 마우스로 끌어 고른 책들은 하나를 끌면 함께 옮겨진다.
  const selectedBooks = new Set();
  function deselectBook(link) {
    selectedBooks.delete(link);
    link.classList.remove("book-selected");
  }
  function selectBooks(links) {
    [...selectedBooks].forEach(deselectBook);
    links.forEach((link) => { selectedBooks.add(link); link.classList.add("book-selected"); });
  }
  const menu = document.createElement("div");
  menu.className = "book-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "책 메뉴");
  menu.hidden = true;
  const menuItem = () => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    return button;
  };
  // 메뉴 왼쪽의 줄 아이콘. 끄거나 없애는 동작은 같은 그림에 빗금을 긋는다.
  const menuIcons = {
    star: `<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>`,
    eye: `<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`,
    book: `<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z"/><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>`,
    reset: `<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>`,
  };
  function setMenuItem(button, icon, label, slashed = false) {
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${menuIcons[icon]}${slashed ? `<path d="M4 4l16 16"/>` : ""}</svg>`;
    button.append(label);
  }
  const toggleFavorite = menuItem();
  const toggleHidden = menuItem();
  const menuDivider = document.createElement("hr");
  menuDivider.setAttribute("role", "separator");
  const toggleReveal = menuItem();
  const toggleOpening = menuItem();
  const resetOrder = menuItem();
  setMenuItem(resetOrder, "reset", "책장 순서 초기화");
  menu.append(toggleFavorite, toggleHidden, menuDivider, toggleReveal, toggleOpening, resetOrder);
  document.body.appendChild(menu);
  const menuItems = () => [...menu.querySelectorAll("button")].filter((button) => !button.hidden);
  let menuBook = null;
  let menuTargets = [];
  let menuAnchor = null;
  function closeBookMenu(restoreFocus = false) {
    const anchor = menuAnchor;
    menu.hidden = true;
    menuBook = menuAnchor = null;
    if (restoreFocus && anchor && !anchor.hidden) anchor.focus({ preventScroll: true });
  }
  function updateFavorites() {
    favoriteLinks.forEach((link, id) => {
      const selected = favorites.has(id);
      const hidden = hiddenBooks.has(id);
      link.hidden = hidden && !revealHidden;
      link.classList.toggle("is-favorite", selected);
      link.classList.toggle("is-hidden-book", hidden);
      link._favoriteSticker.hidden = !selected || link.hidden;
      if (link.hidden) deselectBook(link);
      link.setAttribute("aria-label", link.dataset.readLabel + (selected ? " · 별 표시됨" : "") + (hidden ? " · 숨긴 책" : ""));
    });
  }
  // id가 없으면 책장 빈 곳에서 연 메뉴라 책장 전체 항목만 보인다.
  function showBookMenu(event, id, anchor) {
    event.preventDefault();
    menuBook = id;
    menuAnchor = anchor;
    toggleFavorite.hidden = toggleHidden.hidden = menuDivider.hidden = !id;
    if (id) {
      // Right-clicking one of several selected books stars, hides or restores them all.
      const link = favoriteLinks.get(id);
      menuTargets = selectedBooks.has(link) && selectedBooks.size > 1
        ? currentOrder().filter((book) => selectedBooks.has(book)) : [link];
      const many = menuTargets.length > 1 ? `선택한 ${menuTargets.length}권 ` : "";
      setMenuItem(toggleFavorite, "star", many + (favorites.has(id) ? "별 표시 해제" : "별 표시 추가"), favorites.has(id));
      setMenuItem(toggleHidden, "eye", hiddenBooks.has(id) ? `${many}숨기기 취소` : many ? `${many}숨기기` : "이 책 숨기기", !hiddenBooks.has(id));
    }
    toggleReveal.hidden = !hiddenBooks.size && !revealHidden;
    setMenuItem(toggleReveal, "eye", revealHidden ? "숨긴 책 다시 감추기" : `숨긴 책 보기 (${hiddenBooks.size}권)`, revealHidden);
    setMenuItem(toggleOpening, "book", openingAnimation ? "책 펼침 애니메이션 끄기" : "책 펼침 애니메이션 켜기", openingAnimation);
    menu.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const x = event.clientX || rect.left;
    const y = event.clientY || rect.top;
    menu.style.left = Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8)) + "px";
    menuItems()[0].focus({ preventScroll: true });
  }
  // 우클릭 메뉴를 모르는 사람도 찾도록 책장 머리에 작은 스위치를 둔다.
  const openingSwitch = document.createElement("button");
  openingSwitch.type = "button";
  openingSwitch.className = "opening-switch";
  openingSwitch.setAttribute("role", "switch");
  openingSwitch.innerHTML = `<span>펼침 효과</span><i aria-hidden="true"></i>`;
  const shelfHead = shelfBox.parentElement.querySelector(".library-room-head");
  shelfHead?.insertBefore(openingSwitch, shelfHead.lastElementChild);
  const showOpeningSwitch = () => openingSwitch.setAttribute("aria-checked", String(openingAnimation));
  showOpeningSwitch();
  function setOpeningAnimation(on) {
    openingAnimation = on;
    showOpeningSwitch();
    try {
      if (on) localStorage.setItem(openingAnimationKey, "on");
      else localStorage.removeItem(openingAnimationKey);
    } catch { /* Apply the choice for this visit anyway. */ }
  }
  openingSwitch.addEventListener("click", () => setOpeningAnimation(!openingAnimation));
  toggleOpening.addEventListener("click", () => {
    setOpeningAnimation(!openingAnimation);
    closeBookMenu(true);
  });
  toggleFavorite.addEventListener("click", () => {
    if (!menuBook) return;
    const starring = !favorites.has(menuBook);
    menuTargets.forEach((book) => {
      if (starring) favorites.add(book.dataset.bookId);
      else favorites.delete(book.dataset.bookId);
    });
    try {
      localStorage.setItem(favoriteKey, JSON.stringify([...favorites]));
    } catch {
      // Keep the highlight for this visit if browser storage is unavailable.
    }
    updateFavorites();
    closeBookMenu(true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!menu.hidden && !menu.contains(event.target)) closeBookMenu();
  });
  document.addEventListener("focusin", (event) => {
    if (!menu.hidden && !menu.contains(event.target)) closeBookMenu();
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); closeBookMenu(true); }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const items = menuItems();
      const index = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    }
  });
  window.addEventListener("resize", () => closeBookMenu());
  document.addEventListener("wheel", () => closeBookMenu(), { passive: true });
  document.addEventListener("touchmove", () => closeBookMenu(), { passive: true });
  window.addEventListener("blur", () => closeBookMenu());
  window.addEventListener("storage", (event) => {
    if (event.key === openingAnimationKey || event.key === null) { openingAnimation = readOpeningAnimation(); showOpeningSwitch(); }
    if ([favoriteKey, hiddenKey, null].includes(event.key)) {
      favorites = readFavorites();
      const changed = readHidden();
      closeBookMenu();
      setHidden(() => { hiddenBooks = changed; });
    }
  });

  const shelfOrderKey = "books:shelf-order:v1";
  try {
    const saved = JSON.parse(localStorage.getItem(shelfOrderKey) || "null");
    if (Array.isArray(saved) && saved.length === shelves.length && saved.every(Array.isArray)) {
      const available = new Map(orderedBooks.map((book) => [book.id, book]));
      saved.forEach((ids, index) => {
        shelves[index][1] = ids.flatMap((id) => {
          const book = available.get(id);
          available.delete(id);
          return book ? [book] : [];
        });
      });
      // Newly published books still appear even when a personal arrangement is saved.
      shelves[0][1].push(...available.values());
    }
  } catch { /* Use the original arrangement when storage is unavailable or invalid. */ }
  const refreshStickers = [];
  shelves.forEach(([name, books], rowIndex) => {
    const shelf = document.createElement("div");
    shelf.className = "home-shelf";
    shelf.innerHTML = `<div class="shelf-label"><span>${esc(String(rowIndex + 1).padStart(2, "0"))}</span>${esc(name)}</div><div class="shelf-books"></div>`;
    const bookBox = $(".shelf-books", shelf);
    books.forEach((b) => {
      const a = document.createElement("a");
      a.className = "book-spine";
      a.dataset.bookId = b.id;
      a.draggable = true;
      const spineName = b.title.replace(/Book$/, " Book").replace(/([a-z])([A-Z][a-z])/g, "$1 $2");
      if (spineName.length > 16) a.classList.add("long-title");
      a.href = b.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.setProperty("--book-color", b.color);
      a.setAttribute("aria-label", `${spineName} · ${b.subtitle} 읽기`);
      a.dataset.readLabel = a.getAttribute("aria-label");
      favoriteLinks.set(b.id, a);
      a.addEventListener("contextmenu", (event) => { event.stopPropagation(); showBookMenu(event, b.id, a); });
      a.addEventListener("keydown", (event) => {
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          showBookMenu(event, b.id, a);
        }
      });
      a.title = `${spineName} · ${b.subtitle}`;
      a.addEventListener("click", (event) => openBook(event, a, b, spineName));
      ["pointerenter", "focus", "touchstart"].forEach((type) => a.addEventListener(type, () => preloadSpread(b), { once: true, passive: true }));
      a.innerHTML = `<span class="spine-top">${esc(b.fieldObj.name)}</span><span class="spine-label"><span class="spine-title">${esc(spineName)}</span><span class="spine-topic">${esc(spineTopics[b.id] || b.subtitle.replace(/ 교과서$/, ""))}</span></span><span class="spine-foot">${esc(b.code)}</span>`;
      bookBox.appendChild(a);
    });
    const stickers = document.createElement("div");
    stickers.className = "shelf-stickers";
    stickers.setAttribute("aria-hidden", "true");
    const links = [...bookBox.querySelectorAll(".book-spine")];
    links.forEach((link) => {
      const sticker = document.createElement("span");
      sticker.className = "shelf-sticker";
      sticker.textContent = "★";
      sticker.hidden = true;
      link._favoriteSticker = sticker;
      stickers.appendChild(sticker);
    });
    shelf.appendChild(stickers);
    shelfBox.appendChild(shelf);
    function positionStickers() {
      const base = stickers.getBoundingClientRect();
      [...bookBox.querySelectorAll(".book-spine")].forEach((link) => {
        stickers.appendChild(link._favoriteSticker);
        const rect = link.getBoundingClientRect();
        link._favoriteSticker.style.width = Math.max(20, rect.width * .55) + "px";
        link._favoriteSticker.style.left = (rect.left + rect.width / 2 - base.left) + "px";
      });
    }
    refreshStickers.push(positionStickers);
    new ResizeObserver(positionStickers).observe(bookBox);
    bookBox.addEventListener("scroll", positionStickers, { passive: true });
    positionStickers();
  });

  updateFavorites();

  // Preview a real gap while keeping each shelf's number of visible books.
  const bookRows = [...shelfBox.querySelectorAll(".shelf-books")];
  const rowSizes = [];
  const motion = new Map();
  let draggedBook = null;
  let draggedBooks = [];
  let originalOrder = null;
  let dropRow = null;
  let suppressClickUntil = 0;
  const currentOrder = () => bookRows.flatMap((row) => [...row.children]);
  // Visible books split evenly across the shelves, so hiding books from one
  // shelf pulls books up from the next instead of leaving it sparse.
  function balanceRows() {
    const visible = currentOrder().filter((link) => !link.hidden).length;
    const perRow = Math.ceil(visible / bookRows.length);
    rowSizes.splice(0, rowSizes.length, ...bookRows.map((_, i) => Math.max(0, Math.min(perRow, visible - perRow * i))));
  }
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  function stopMotion(link) {
    const running = motion.get(link);
    if (!running) return;
    running.animation.cancel();
    running.ghost.remove();
    link.style.opacity = "";
    motion.delete(link);
  }
  function arrange(order, animate = true, change) {
    const before = new Map(currentOrder().map((link) => [
      link, (motion.get(link)?.ghost || link).getBoundingClientRect(),
    ]));
    [...motion.keys()].forEach(stopMotion);
    change?.();
    // Only visible books fill a shelf; hidden ones stay beside their neighbors.
    let rowIndex = 0;
    let filled = 0;
    order.forEach((link) => {
      if (!link.hidden) {
        if (filled >= rowSizes[rowIndex] && rowIndex < bookRows.length - 1) { rowIndex++; filled = 0; }
        filled++;
      }
      bookRows[rowIndex].appendChild(link);
    });
    refreshStickers.forEach((refresh) => refresh());
    if (!animate || reducedMotion.matches) return;
    order.forEach((link) => {
      if (draggedBooks.includes(link) || link.hidden) return;
      const first = before.get(link);
      const last = link.getBoundingClientRect();
      // A book that was hidden a moment ago has no earlier position to travel from.
      if (!first || !first.width || (Math.abs(first.left - last.left) < 1 && Math.abs(first.top - last.top) < 1)) return;
      // Fixed visual copies can travel between shelves without being clipped by the wood.
      const ghost = link.cloneNode(true);
      ghost.removeAttribute("href");
      ghost.removeAttribute("data-book-id");
      ghost.setAttribute("aria-hidden", "true");
      ghost.classList.add("book-moving-copy");
      Object.assign(ghost.style, {
        left: last.left + "px", top: last.top + "px",
        width: last.width + "px", height: last.height + "px",
        visibility: "visible", opacity: "",
      });
      document.body.appendChild(ghost);
      link.style.opacity = "0";
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const animation = ghost.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${first.width / last.width}, ${first.height / last.height})` },
        { transform: "translate(0, 0) scale(1)" },
      ], { duration: dy ? 380 : 240, easing: "cubic-bezier(.22,1,.36,1)" });
      motion.set(link, { ghost, animation });
      animation.onfinish = () => {
        if (motion.get(link)?.animation === animation) stopMotion(link);
      };
    });
  }
  // Neighbors slide into the space a hidden book leaves, like the drag rearranging.
  function setHidden(change) {
    arrange(currentOrder(), true, () => { change(); updateFavorites(); balanceRows(); });
  }
  function saveHidden() {
    try {
      if (hiddenBooks.size) localStorage.setItem(hiddenKey, JSON.stringify([...hiddenBooks]));
      else localStorage.removeItem(hiddenKey);
    } catch { /* Keep the shelf as chosen for this visit. */ }
  }
  toggleHidden.addEventListener("click", () => {
    const id = menuBook;
    if (!id) return;
    const link = favoriteLinks.get(id);
    const targets = menuTargets;
    const hiding = !hiddenBooks.has(id);
    // Keyboard focus moves to the next book still on the shelf.
    const order = currentOrder();
    const next = order.slice(order.indexOf(link) + 1).concat(order.slice(0, order.indexOf(link)))
      .find((book) => !book.hidden && !targets.includes(book) && (revealHidden || !hiddenBooks.has(book.dataset.bookId)));
    closeBookMenu(!hiding || revealHidden);
    setHidden(() => targets.forEach((book) => {
      if (hiding) hiddenBooks.add(book.dataset.bookId);
      else hiddenBooks.delete(book.dataset.bookId);
    }));
    saveHidden();
    // Rearranging re-inserts the books, so move focus only afterwards.
    if (hiding && !revealHidden) (next || shelfBox).focus({ preventScroll: true });
  });
  toggleReveal.addEventListener("click", () => {
    closeBookMenu(true);
    setHidden(() => { revealHidden = !revealHidden; });
  });
  shelfBox.tabIndex = -1;
  shelfBox.addEventListener("contextmenu", (event) => showBookMenu(event, null, shelfBox));
  balanceRows();
  arrange(currentOrder(), false);
  resetOrder.addEventListener("click", () => {
    finishDragging();
    closeBookMenu(true);
    arrange(orderedBooks.map((book) => favoriteLinks.get(book.id)));
    try { localStorage.removeItem(shelfOrderKey); } catch { /* Reset this visit anyway. */ }
  });
  function saveArrangement() {
    try {
      localStorage.setItem(shelfOrderKey, JSON.stringify(
        bookRows.map((row) => [...row.children].map((link) => link.dataset.bookId))
      ));
    } catch { /* Rearranging still works for the current visit. */ }
  }
  function finishDragging(commit = false) {
    if (!draggedBook) return;
    const group = draggedBooks;
    if (!commit && originalOrder) arrange(originalOrder);
    group.forEach((link) => link.classList.remove("book-dragging"));
    draggedBook = originalOrder = dropRow = null;
    draggedBooks = [];
    shelfBox.classList.remove("is-rearranging");
    suppressClickUntil = performance.now() + 250;
    if (commit) {
      saveArrangement();
      if (!reducedMotion.matches) group.forEach((link) => link.animate([
        { transform: "translateY(-9px)" }, { transform: "translateY(0)" },
      ], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" }));
    }
  }
  shelfBox.addEventListener("click", (event) => {
    if (draggedBook || performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  shelfBox.addEventListener("dragstart", (event) => {
    const link = event.target.closest(".book-spine");
    if (!link || cancelBookOpening) { event.preventDefault(); return; }
    closeBookMenu();
    [...motion.keys()].forEach(stopMotion);
    // Dragging a selected book carries the whole selection; any other book goes alone.
    if (!selectedBooks.has(link)) selectBooks([]);
    originalOrder = currentOrder();
    draggedBook = link;
    draggedBooks = selectedBooks.size > 1 ? originalOrder.filter((book) => selectedBooks.has(book)) : [link];
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedBooks.map((book) => book.dataset.bookId).join("\n"));
    if (draggedBooks.length > 1) setStackImage(event, link);
    draggedBooks.forEach((book) => book.classList.add("book-dragging"));
    shelfBox.classList.add("is-rearranging");
  });
  shelfBox.addEventListener("dragover", (event) => {
    if (!draggedBook) return;
    const row = event.target.closest(".home-shelf")?.querySelector(".shelf-books");
    if (!row) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    dropRow = row;
    const bounds = row.getBoundingClientRect();
    if (event.clientX < bounds.left + 32) row.scrollLeft -= 12;
    if (event.clientX > bounds.right - 32) row.scrollLeft += 12;
    const group = draggedBooks;
    const oldOrder = currentOrder();
    // Stay still over the open slot instead of repeatedly swapping at its edges.
    // Scattered selections first gather beside the pointer.
    const visibleOrder = oldOrder.filter((link) => !link.hidden);
    const start = visibleOrder.indexOf(group[0]);
    const gathered = group.every((link, i) => visibleOrder[start + i] === link);
    const inRow = group.filter((link) => link.parentElement === row);
    if (gathered && inRow.length) {
      const first = inRow[0].getBoundingClientRect();
      const last = inRow.at(-1).getBoundingClientRect();
      if (event.clientX >= first.left - 4 && event.clientX <= last.right + 4) return;
    }
    const candidates = [...row.children].filter((link) => !group.includes(link));
    const before = candidates.find((link) => {
      const rect = link.getBoundingClientRect();
      return event.clientX < rect.left + rect.width / 2;
    });
    const order = oldOrder.filter((link) => !group.includes(link));
    const rowIndex = bookRows.indexOf(row);
    let index;
    if (before) index = order.indexOf(before);
    else if (candidates.length) index = order.indexOf(candidates.at(-1)) + 1;
    else index = order.filter((link) => bookRows.indexOf(link.parentElement) < rowIndex).length;
    // A full upper shelf always keeps the incoming books; its previous rightmost books spill down.
    const shelfVisible = order.filter((link) => link.parentElement === row && !link.hidden);
    const cut = shelfVisible[Math.max(0, rowSizes[rowIndex] - group.length)];
    if (cut) index = Math.min(index, order.indexOf(cut));
    order.splice(index, 0, ...group);
    if (order.some((link, i) => link !== oldOrder[i])) arrange(order);
  });
  shelfBox.addEventListener("dragleave", (event) => {
    if (!shelfBox.contains(event.relatedTarget)) dropRow = null;
  });
  shelfBox.addEventListener("drop", (event) => {
    if (!draggedBook || !dropRow) return;
    event.preventDefault();
    finishDragging(true);
  });
  shelfBox.addEventListener("dragend", () => finishDragging());
  window.addEventListener("blur", () => finishDragging());
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (draggedBook) finishDragging();
    else selectBooks([]);
  });
  // The drag image shows the carried books side by side with their count.
  function setStackImage(event, anchor) {
    const stack = document.createElement("div");
    stack.className = "book-drag-stack";
    const shown = [anchor, ...draggedBooks.filter((book) => book !== anchor)].slice(0, 5);
    const rects = shown.map((book) => book.getBoundingClientRect());
    shown.forEach((book, i) => {
      const copy = book.cloneNode(true);
      copy.removeAttribute("href");
      copy.removeAttribute("data-book-id");
      copy.classList.remove("book-selected", "book-pulled");
      Object.assign(copy.style, { width: rects[i].width + "px", height: rects[i].height + "px" });
      stack.appendChild(copy);
    });
    const count = document.createElement("span");
    count.className = "book-drag-count";
    count.textContent = `${draggedBooks.length}권`;
    stack.appendChild(count);
    document.body.appendChild(stack);
    const tallest = Math.max(...rects.map((rect) => rect.height));
    event.dataTransfer.setDragImage(stack, event.clientX - rects[0].left, event.clientY - rects[0].top + tallest - rects[0].height);
    setTimeout(() => stack.remove());
  }
  // Rubber-band selection starts on empty space anywhere around the bookcase, including
  // the margins beside it, so book dragging, links and the heading text stay as they were.
  const selectArea = shelfBox.closest(".home-library") || shelfBox;
  const selectStart = ".home-library, .home-library > .wrap, .library-welcome, .library-welcome > div, " +
    ".library-room, .library-room-head, .library-room-foot, .home-shelves, .home-shelf, .shelf-books, .shelf-label, .shelf-label span";
  const marquee = document.createElement("div");
  marquee.className = "shelf-marquee";
  marquee.hidden = true;
  document.body.appendChild(marquee);
  let selecting = null;
  selectArea.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !event.target.matches(selectStart) ||
        draggedBook || cancelBookOpening) return;
    // Leave a crowded shelf's scrollbar to scroll.
    const row = event.target.closest(".shelf-books");
    if (row && event.offsetY >= row.clientHeight) return;
    event.preventDefault();
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    selecting = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false, base: additive ? [...selectedBooks] : [] };
    selectArea.setPointerCapture(event.pointerId);
  });
  selectArea.addEventListener("pointermove", (event) => {
    if (event.pointerId !== selecting?.id) return;
    if (!selecting.moved && Math.hypot(event.clientX - selecting.x, event.clientY - selecting.y) < 4) return;
    selecting.moved = true;
    shelfBox.classList.add("is-selecting");
    const left = Math.min(selecting.x, event.clientX);
    const right = Math.max(selecting.x, event.clientX);
    const top = Math.min(selecting.y, event.clientY);
    const bottom = Math.max(selecting.y, event.clientY);
    Object.assign(marquee.style, { left: left + "px", top: top + "px", width: right - left + "px", height: bottom - top + "px" });
    marquee.hidden = false;
    const caught = currentOrder().filter((link) => {
      if (link.hidden) return false;
      const rect = link.getBoundingClientRect();
      return rect.right > left && rect.left < right && rect.bottom > top && rect.top < bottom;
    });
    selectBooks([...new Set([...selecting.base, ...caught])]);
  });
  function finishSelecting(event) {
    if (event.pointerId !== selecting?.id) return;
    // A plain click on empty shelf space clears the selection.
    if (!selecting.moved) selectBooks(selecting.base);
    else suppressClickUntil = performance.now() + 250;
    selecting = null;
    marquee.hidden = true;
    shelfBox.classList.remove("is-selecting");
  }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => selectArea.addEventListener(type, finishSelecting));
  // Keyboard rearranging uses the same shelf balancing and animation.
  shelfBox.addEventListener("keydown", (event) => {
    const link = event.target.closest(".book-spine");
    if (!link || !event.altKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    // Count positions among visible books so hidden ones never take a step.
    const order = currentOrder();
    const visible = order.filter((book) => !book.hidden);
    const index = visible.indexOf(link);
    const rowIndex = bookRows.indexOf(link.parentElement);
    let target = index;
    if (event.key === "ArrowLeft") target = index - 1;
    if (event.key === "ArrowRight") target = index + 1;
    if (event.key === "ArrowUp" && rowIndex > 0) target = index - rowSizes[rowIndex - 1];
    if (event.key === "ArrowDown" && rowIndex < bookRows.length - 1) target = index + rowSizes[rowIndex];
    target = Math.max(0, Math.min(visible.length - 1, target));
    if (target === index) return;
    const anchor = visible[target];
    order.splice(order.indexOf(link), 1);
    order.splice(order.indexOf(anchor) + (target > index ? 1 : 0), 0, link);
    arrange(order);
    saveArrangement();
    link.focus({ preventScroll: true });
  });

  // Pull out only the book under the pointer, using its untransformed shelf position.
  const shelfHoverMedia = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  let pulledBook = null;
  function clearShelfHover() {
    pulledBook?.classList.remove("book-pulled");
    pulledBook = null;
  }
  bookRows.forEach((row) => {
    new ResizeObserver(() => {
      row.classList.toggle("shelf-hover-room", row.scrollWidth <= row.clientWidth);
    }).observe(row);
    row.addEventListener("pointermove", (event) => {
      if (!shelfHoverMedia.matches || event.pointerType === "touch" || event.buttons ||
          draggedBook || cancelBookOpening || !menu.hidden || motion.size) {
        clearShelfHover();
        return;
      }
      const origin = row.closest(".home-shelf").getBoundingClientRect().left;
      const link = [...row.children].find((book) => {
        const left = origin + book.offsetLeft - row.scrollLeft;
        return event.clientX >= left && event.clientX <= left + book.offsetWidth;
      });
      if (link === pulledBook) return;
      clearShelfHover();
      if (link) {
        pulledBook = link;
        link.classList.add("book-pulled");
      }
    }, { passive: true });
    row.addEventListener("pointerleave", clearShelfHover);
  });
  shelfBox.addEventListener("pointerdown", clearShelfHover, true);
  shelfBox.addEventListener("dragstart", clearShelfHover, true);
  shelfBox.addEventListener("contextmenu", clearShelfHover, true);
  window.addEventListener("blur", clearShelfHover);
  shelfHoverMedia.addEventListener("change", clearShelfHover);

  // 두 갈래: 분야 카드
  d.wings.forEach((w) => {
    const box = $(`#fields-${w.id}`);
    const fields = d.fields.filter((f) => f.wing === w.id && f.books.length);
    box.classList.add("field-deck");
    box.style.setProperty("--field-gaps", Math.max(1, fields.length - 1));
    fields.forEach((f) => {
      const k = EB.counts(f.books);
      const a = document.createElement("a");
      a.className = "field-card";
      a.href = EB.fieldUrl(f.id);
      EB.tint(a, f);
      a.innerHTML = `${EB.fieldArt(f)}
        <div class="fc-body">
          <div class="fc-en">${esc(f.en)}</div>
          <h3>${esc(f.name)}</h3>
          <p>${esc(f.desc)}</p>
          <div class="fc-count"><span>${k.published ? `출간 <b>${k.published}</b>` : "준비 중"}</span><span class="go">분야 보기 →</span></div>
        </div>`;
      box.appendChild(a);
    });
  });

  // 홈에서는 분야를 가로지르는 질문 여섯 개만 보여 준다. 전체 목록은 실험 탐색에 둔다.
  const all = [];
  d.books.filter(EB.isPublished).forEach((b) => (b.featured || []).forEach((f) => all.push({ ...f, book: b })));
  const picks = [
    { book: "phonebook", link: "chapters/anatomy.html#sim-explode", question: "스마트폰 안에는 무엇이 들어 있을까?" },
    { book: "musicbook", link: "chapters/harmonics.html#sim-additive", question: "사인파를 쌓으면 왜 악기 소리가 될까?" },
    { book: "moneybook", link: "chapters/lab.html#sim-life", question: "오늘의 선택이 60세의 순자산을 얼마나 바꿀까?" },
    { book: "carbook", link: "chapters/aero.html#sim-fl", question: "차의 모양이 공기 흐름을 어떻게 바꿀까?" },
    { book: "camerabook", link: "chapters/shutter.html#sim-rolling", question: "프로펠러는 왜 휘어 찍힐까?" },
    { book: "yieldbook", link: "chapters/detective.html#sim-detective", question: "웨이퍼의 무늬로 불량 원인을 찾을 수 있을까?" },
  ];
  const selected = picks.map((pick) => ({ ...pick, experiment: all.find((f) => f.book.id === pick.book && f.link === pick.link) })).filter((pick) => pick.experiment);
  if (selected.length) {
    const grid = $("#home-experiments");
    grid.style.setProperty("--experiment-gaps", Math.max(1, selected.length - 1));
    selected.forEach(({ question, experiment: f }) => {
      const a = document.createElement("a");
      a.className = "home-experiment";
      a.href = f.book.url + f.link;
      a.target = "_blank";
      a.rel = "noopener";
      EB.tint(a, f.book);
      a.innerHTML = `<div class="home-experiment-image"><img src="${esc(f.image)}" alt="${esc(f.title)} 시뮬레이터 화면" loading="lazy"></div>
        <div class="home-experiment-body"><span class="home-experiment-book">${esc(f.book.title)}</span><h3>${esc(question)}</h3><p>${esc(f.desc)}</p><span class="home-experiment-action">${esc(f.title)} 열기 <span aria-hidden="true">↗</span></span></div>`;
      grid.appendChild(a);
    });
  } else {
    $("#play").hidden = true;
  }

  // Dock: 레이아웃 좌표를 기준으로 계산해 애니메이션 중 좌표가 흔들리지 않게 한다.
  const dockMedia = matchMedia("(min-width: 1001px) and (hover: hover) and (prefers-reduced-motion: no-preference)");
  EB.$$(".field-deck, .home-experiments").forEach((deck) => {
    const cards = [...deck.children];
    let active = null;
    function reset() {
      active = null;
      deck.classList.remove("dock-active");
      cards.forEach((card) => {
        card.classList.remove("dock-current");
        card.style.removeProperty("--dock-x");
        card.style.removeProperty("--dock-z");
      });
    }
    function activate(card) {
      if (!dockMedia.matches || !cards.includes(card) || active === card) return;
      active = card;
      const index = cards.indexOf(card);
      deck.classList.add("dock-active");
      cards.forEach((item, i) => {
        const distance = Math.abs(i - index);
        // 겹침은 유지하고 가까운 카드만 조금 더 밀어낸다. 선택한 카드는 중앙을 유지한다.
        const shift = distance === 0 ? 0 : Math.sign(i - index) * 24 / distance;
        item.style.setProperty("--dock-x", `${shift}px`);
        item.style.setProperty("--dock-z", cards.length - Math.abs(i - index));
        item.classList.toggle("dock-current", item === card);
      });
    }
    deck.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch") activate(event.target.closest(".field-card, .home-experiment"));
    });
    deck.addEventListener("pointerleave", () => {
      reset();
      if (deck.contains(document.activeElement)) activate(document.activeElement);
    });
    deck.addEventListener("focusin", (event) => activate(event.target));
    deck.addEventListener("focusout", (event) => {
      if (!deck.contains(event.relatedTarget)) reset();
    });
    dockMedia.addEventListener("change", reset);
    new ResizeObserver(reset).observe(deck);
  });

  // 만든 사람
  const au = d.author;
  if (au) {
    $("#author-body").innerHTML = `<h2>${esc(au.title)}</h2>
      ${au.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
      <p class="closing">${esc(au.closing)}</p>
      <p><a href="/feedback/?type=cheer">저자에게 응원 한마디 남기기 →</a></p>
      <div class="sign"><span class="avatar" aria-hidden="true">${esc(au.name.slice(0, 1).toUpperCase())}</span><div><b>${esc(au.name)}</b><small>${esc(au.role)}</small></div>${au.contact ? `<a href="${esc(au.contact)}">GitHub →</a>` : ""}</div>`;
  } else {
    $("#author").hidden = true;
  }

  // 해시로 들어온 경우(index.html#life 등) 렌더링 뒤에 다시 맞춘다
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
});
