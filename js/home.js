/* 홈: 분야별 지식 지도 입구, 처음 펼치기 좋은 10권, 대표 실험, 저자 노트 */
EB.start("home", (d) => {
  "use strict";
  const { $, esc } = EB;

  // 통계
  const c = EB.counts(d.books);
  const vals = { published: c.published, writing: c.writing, planned: c.planned, fields: d.fields.filter((f) => f.books.length).length, experiments: d.books.filter(EB.isPublished).reduce((n, b) => n + (b.featured || []).length, 0) };
  EB.$$("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });

  // 첫 화면의 서가: 다른 분야를 먼저 보여 주고, 출간된 책만 바로 연결한다.
  const published = d.books.filter((b) => EB.isPublished(b) && b.url);
  // 분야는 지도로 연결하고, 입문용 10권과 전체 책장도 바로 열 수 있게 한다.
  const fieldLinks = $("#browse-fields");
  const browseGrid = $("#browse-books");
  const scrollNav = $("#browse-scroll-nav");
  const scrollPrev = $("#browse-prev");
  const scrollNext = $("#browse-next");
  function updateScrollNav() {
    const max = browseGrid.scrollWidth - browseGrid.clientWidth;
    scrollNav.hidden = max <= 1;
    scrollPrev.disabled = browseGrid.scrollLeft <= 1;
    scrollNext.disabled = browseGrid.scrollLeft >= max - 1;
    // Grow the edge fade with scroll distance so it disappears gently at either end.
    const fadeWidth = Math.min(48, browseGrid.clientWidth * .08);
    const left = Math.max(0, Math.min(max, browseGrid.scrollLeft));
    browseGrid.style.setProperty("--fade-left", `${Math.min(fadeWidth, left)}px`);
    browseGrid.style.setProperty("--fade-right", `${Math.max(0, Math.min(fadeWidth, max - left))}px`);
  }
  function turnShelf(direction) {
    const cover = browseGrid.querySelector(".browse-book");
    if (!cover) return;
    const gap = parseFloat(getComputedStyle(browseGrid).columnGap) || 0;
    const step = cover.getBoundingClientRect().width + gap;
    const columns = Math.max(1, Math.floor(browseGrid.clientWidth / step));
    browseGrid.scrollBy({ left: direction * step * columns,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  scrollPrev.addEventListener("click", () => turnShelf(-1));
  scrollNext.addEventListener("click", () => turnShelf(1));
  browseGrid.addEventListener("scroll", updateScrollNav, { passive: true });
  new ResizeObserver(updateScrollNav).observe(browseGrid);
  const publishedFields = d.fields.filter((f) => published.some((b) => b.field === f.id));
  // 위쪽 다섯 권, 아래쪽 다섯 권 순서. 작은 화면에서도 같은 두 줄을 옆으로 넘긴다.
  const starterPicks = [
    { id: "computerbook", caption: "0과 1에서 시작하는 컴퓨터의 원리" },
    { id: "moneybook", caption: "월급부터 은퇴까지, 생활 속 돈의 원리" },
    { id: "camerabook", caption: "다이얼을 돌리면 사진이 달라진다" },
    { id: "bodybook", caption: "매일 쓰는 내 몸은 어떻게 움직일까?" },
    { id: "chipindustrybook", caption: "칩 하나를 만드는 회사와 산업의 연결" },
    { id: "carbook", caption: "연료 한 방울이 자동차를 움직이기까지" },
    { id: "estatebook", caption: "집값과 전세를 숫자로 이해하기" },
    { id: "artbook-color", caption: "색을 섞고 비교하며 찾는 색의 관계" },
    { id: "musicbook", caption: "소리를 직접 바꾸며 만나는 음악의 원리" },
    { id: "networkbook", caption: "인터넷 속 데이터는 어떤 길로 갈까?" },
  ];
  const starters = starterPicks.map((pick) => ({ ...pick, book: published.find((b) => b.id === pick.id) })).filter((pick) => pick.book);
  publishedFields.forEach((field) => {
    const link = document.createElement("a");
    link.href = EB.mapUrl(field.id);
    link.textContent = `${field.name} →`;
    fieldLinks.appendChild(link);
  });
  function renderBrowse() {
    browseGrid.replaceChildren();
    starters.forEach(({ book: b, caption }, index) => {
      const card = document.createElement("article");
      card.className = "browse-book";
      card.style.gridColumn = index % 5 + 1;
      card.style.gridRow = Math.floor(index / 5) + 1;
      card.style.setProperty("--book-color", b.color);
      card.innerHTML = `<a class="browse-cover" data-book-id="${esc(b.id)}" href="${esc(b.url)}" target="_blank" rel="noopener" aria-label="${esc(b.title)} · ${esc(b.subtitle)} 읽기 (새 탭)"><small>${esc(b.fieldObj.name)}</small><strong>${esc(EB.coverTitle(b))}</strong><span class="browse-art" aria-hidden="true">${window.coverArt ? window.coverArt(b.motif) : ""}</span><span class="browse-book-title">${esc(b.title)}</span></a><div class="browse-caption"><p>${esc(caption)}</p></div>`;
      browseGrid.appendChild(card);
    });
    requestAnimationFrame(updateScrollNav);
  }
  renderBrowse();

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
  EB.$$(".home-experiments").forEach((deck) => {
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
      if (event.pointerType !== "touch") activate(event.target.closest(".home-experiment"));
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

  // 해시로 들어온 경우 렌더링 뒤에 다시 맞춘다
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
});
