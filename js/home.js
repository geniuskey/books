/* 홈: 출간된 책장, 두 갈래와 분야 카드, 대표 시뮬레이터, 저자 노트, 도구 */
EB.start("home", (d) => {
  "use strict";
  const { $, esc } = EB;

  // 통계
  const c = EB.counts(d.books);
  const vals = { published: c.published, writing: c.writing, planned: c.planned, fields: d.fields.length, experiments: d.books.filter(EB.isPublished).reduce((n, b) => n + (b.featured || []).length, 0) };
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
  let cancelBookOpening = null;
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) cancelBookOpening?.();
  });

  function openBook(event, link, book, title) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        matchMedia("(prefers-reduced-motion: reduce)").matches || !Element.prototype.animate) return;
    event.preventDefault();
    if (cancelBookOpening) return;

    const rect = link.getBoundingClientRect();
    const width = Math.min(240, innerWidth * .39, innerHeight * .43);
    const height = width * 1.42;
    // Preserve the shelf spine width at the initial animation scale.
    const depth = rect.width * height / rect.height;
    const front = depth / 2;
    const layer = document.createElement("div");
    layer.className = "book-opening";
    layer.style.setProperty("--book-color", book.color);
    layer.style.setProperty("--opening-width", `${width}px`);
    layer.style.setProperty("--opening-depth", `${depth}px`);
    layer.innerHTML = `<div class="book-opening-shade"></div>
      <div class="book-opening-stage" aria-hidden="true"><div class="book-opening-model">
        <div class="opening-back"></div>
        <div class="opening-edge opening-edge-top"></div><div class="opening-edge opening-edge-bottom"></div><div class="opening-edge opening-edge-side"></div>
        <div class="opening-paper opening-paper-base"><small>${esc(book.fieldObj.name)}</small><strong>${esc(title)}</strong><span>${esc(book.subtitle)}</span><i></i></div>
        <div class="opening-paper opening-leaf leaf-one"></div><div class="opening-paper opening-leaf leaf-two"></div>
        <div class="opening-cover"><div class="opening-cover-front"><small>${esc(book.fieldObj.name)}</small><strong>${esc(title)}</strong><span>${esc(book.subtitle)}</span><em>${esc(book.code)} / GENIUSKEY</em></div><div class="opening-cover-inside"></div></div>
        <div class="opening-spine">${esc(title)}</div>
      </div></div><p class="book-opening-caption" role="status">${esc(title)} 펼치는 중…</p>`;
    document.body.appendChild(layer);
    link.classList.add("book-is-opening");
    const animations = [];
    let timer;
    function cleanup() {
      clearTimeout(timer);
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
      const x = rect.left + rect.width / 2 - innerWidth / 2;
      const y = rect.top + rect.height / 2 - innerHeight / 2;
      animate(".book-opening-stage", [
        { transform: `translate(${x}px, ${y}px) scale(${rect.height / height})`, offset: 0 },
        { transform: `translate(${x}px, ${y - 28}px) scale(${rect.height / height * 1.12})`, offset: .2 },
        { transform: "translate(0, 0) scale(1)", offset: .65 },
        { transform: `translate(${width * .35}px, 0) scale(1)`, offset: 1 },
      ], { duration: 1150, easing: "cubic-bezier(.22,.7,.25,1)" });
      animate(".book-opening-model", [
        { transform: "rotateX(0deg) rotateY(90deg) rotateZ(0deg)" },
        { transform: "rotateX(8deg) rotateY(24deg) rotateZ(-5deg)", offset: .55 },
        { transform: "rotateX(8deg) rotateY(-10deg) rotateZ(-2deg)" },
      ], { duration: 1050, easing: "ease-in-out" });
      animate(".opening-cover", [{ transform: `translateZ(${front}px) rotateY(0deg)` }, { transform: `translateZ(${front}px) rotateY(-158deg)` }], { delay: 100, duration: 850, easing: "cubic-bezier(.3,0,.2,1)" });
      [".leaf-one", ".leaf-two"].forEach((selector, i) => animate(selector, [
        { transform: `translateZ(${front - 2 - i * 2}px) rotateY(0deg)` },
        { transform: `translateZ(${front - 2 - i * 2}px) rotateY(${-148 + i * 12}deg)` },
      ], { delay: 220 + i * 90, duration: 800, easing: "ease-in-out" }));
      animate(".book-opening-shade", [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      animate(".book-opening-caption", [{ opacity: 0 }, { opacity: 1 }], { delay: 150, duration: 250 });
      timer = setTimeout(openDestination, 1300);
    } catch (error) {
      openDestination();
    }
  }
  shelves.filter(([, books]) => books.length).forEach(([name, books], rowIndex) => {
    const shelf = document.createElement("div");
    shelf.className = "home-shelf";
    shelf.innerHTML = `<div class="shelf-label"><span>${esc(String(rowIndex + 1).padStart(2, "0"))}</span>${esc(name)}</div><div class="shelf-books"></div>`;
    const bookBox = $(".shelf-books", shelf);
    books.forEach((b) => {
      const a = document.createElement("a");
      a.className = "book-spine";
      const spineName = b.title.replace(/Book$/, " Book").replace(/([a-z])([A-Z][a-z])/g, "$1 $2");
      if (spineName.length > 16) a.classList.add("long-title");
      a.href = b.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.setProperty("--book-color", b.color);
      a.setAttribute("aria-label", `${spineName} · ${b.subtitle} 읽기`);
      a.title = `${spineName} · ${b.subtitle}`;
      a.addEventListener("click", (event) => openBook(event, a, b, spineName));
      a.innerHTML = `<span class="spine-top">${esc(b.fieldObj.name)}</span><span class="spine-title">${esc(spineName)}</span><span class="spine-foot">${esc(b.code)}</span>`;
      bookBox.appendChild(a);
    });
    shelfBox.appendChild(shelf);
  });

  // 두 갈래: 분야 카드
  d.wings.forEach((w) => {
    const box = $(`#fields-${w.id}`);
    const fields = d.fields.filter((f) => f.wing === w.id);
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
          <div class="fc-count"><span>출간 <b>${k.published}</b></span><span class="go">분야 보기 →</span></div>
        </div>`;
      box.appendChild(a);
    });
  });

  // 홈에서는 분야를 가로지르는 질문 여섯 개만 보여 준다. 전체 목록은 실험 탐색에 둔다.
  const all = [];
  d.books.filter(EB.isPublished).forEach((b) => (b.featured || []).forEach((f) => all.push({ ...f, book: b })));
  const picks = [
    { book: "phonebook", link: "chapters/anatomy.html#sim-explode", question: "스마트폰 안에는 무엇이 들어 있을까?" },
    { book: "computerbook", link: "chapters/cpu.html#sim-toy", question: "CPU는 명령을 어떻게 실행할까?" },
    { book: "aibook", link: "chapters/attention.html#sim-editor", question: "AI는 문장의 어디에 주목할까?" },
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
      <div class="sign"><span class="avatar" aria-hidden="true">${esc(au.name.slice(0, 1).toUpperCase())}</span><div><b>${esc(au.name)}</b><small>${esc(au.role)}</small></div>${au.contact ? `<a href="${esc(au.contact)}">GitHub →</a>` : ""}</div>`;
  } else {
    $("#author").hidden = true;
  }

  // 해시로 들어온 경우(index.html#life 등) 렌더링 뒤에 다시 맞춘다
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
});
