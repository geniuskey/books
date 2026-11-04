/* 홈: 많이 펼치는 책·입문 10권·분야별 서가, 대표 실험, 저자 노트 */
EB.start("home", (d) => {
  "use strict";
  const { $, esc } = EB;

  // 통계
  const c = EB.counts(d.books);
  const vals = { published: c.published, writing: c.writing, planned: c.planned, fields: d.fields.filter((f) => f.books.length).length, experiments: d.books.filter(EB.isPublished).reduce((n, b) => n + (b.featured || []).length, 0) };
  EB.$$("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });

  // 온라인 서점처럼 아래로 내리며 분야별 서가를 차례로 훑는다. 각 서가는 옆으로 넘긴다.
  const published = d.books.filter((b) => EB.isPublished(b) && b.url);
  const byId = Object.fromEntries(published.map((b) => [b.id, b]));
  const shelves = $("#home-shelves");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const arrow = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

  function cover(b, placement, rank) {
    return `<a class="shelf-cover" href="${esc(b.url)}" target="_blank" rel="noopener" data-book-id="${esc(b.id)}" data-placement="${placement}" style="--book-color:${esc(b.color)}" aria-label="${rank ? `${rank}위 · ` : ""}${esc(b.title)} · ${esc(b.subtitle)} 읽기 (새 탭)">${rank ? `<span class="shelf-rank" aria-hidden="true">${rank}</span>` : ""}<small>${esc(b.fieldObj.name)}</small><strong>${esc(EB.coverTitle(b))}</strong><span class="shelf-art" aria-hidden="true">${window.coverArt ? window.coverArt(b.motif) : ""}</span><span class="shelf-cover-title">${esc(b.title)}</span></a>`;
  }

  function shelf({ id, title, note, link, linkLabel, books, placement, ranked, half, first }) {
    const row = document.createElement("section");
    row.className = "shelf-row" + (half ? " half" : "");
    row.id = id;
    row.setAttribute("aria-labelledby", `${id}-title`);
    row.innerHTML = `<div class="shelf-head"><h2 id="${id}-title">${esc(title)}${note ? ` <small>${esc(note)}</small>` : ""}</h2>${link ? `<a href="${esc(link)}">${esc(linkLabel)} →</a>` : ""}
      <div class="shelf-nav" hidden><button type="button" data-dir="-1" aria-label="${esc(title)} 이전 책">${arrow("m14 6-6 6 6 6")}</button><button type="button" data-dir="1" aria-label="${esc(title)} 다음 책">${arrow("m10 6 6 6-6 6")}</button></div></div>
      <div class="shelf-track" tabindex="0" role="region" aria-labelledby="${id}-title">${books.map((b, i) => cover(b, placement, ranked ? i + 1 : 0)).join("")}</div>`;
    if (first) shelves.prepend(row); else shelves.appendChild(row);
    const track = $(".shelf-track", row);
    const nav = $(".shelf-nav", row);
    const [prev, next] = nav.querySelectorAll("button");
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      nav.hidden = max <= 1;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
      const fade = Math.min(40, track.clientWidth * .08);
      const left = Math.max(0, Math.min(max, track.scrollLeft));
      track.style.setProperty("--fade-left", `${Math.min(fade, left)}px`);
      track.style.setProperty("--fade-right", `${Math.max(0, Math.min(fade, max - left))}px`);
    };
    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const firstCover = track.querySelector(".shelf-cover");
      const step = firstCover.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
      const page = Math.max(1, Math.floor(track.clientWidth / step) - 1);
      track.scrollBy({ left: Number(button.dataset.dir) * step * page, behavior: reduceMotion.matches ? "instant" : "smooth" });
    });
    track.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(track);
  }

  // 처음 펼치기 좋은 책: 분야를 섞어 고른 입문용 10권
  const starterPicks = ["computerbook", "moneybook", "camerabook", "bodybook", "chipindustrybook", "carbook", "estatebook", "artbook-color", "musicbook", "networkbook"];
  shelf({ id: "shelf-starters", title: "처음 펼치기 좋은 책", books: starterPicks.map((id) => byId[id]).filter(Boolean), placement: "starters", link: "/library/", linkLabel: `전체 ${published.length}권` });

  // 분야별 서가. 책이 적은 분야끼리는 데스크톱에서 두 서가를 한 줄에 나란히 둔다.
  const fieldShelves = d.fields.map((f) => ({ field: f, books: published.filter((b) => b.field === f.id) })).filter((x) => x.books.length);
  fieldShelves.forEach((x) => { x.half = x.books.length <= 6; });
  // 짝이 없는 작은 서가는 한 줄 전체를 쓴다.
  let run = [];
  [...fieldShelves, null].forEach((x) => {
    if (x && x.half) { run.push(x); return; }
    if (run.length % 2) run[run.length - 1].half = false;
    run = [];
  });
  const jump = $("#browse-fields");
  fieldShelves.forEach(({ field, books, half }) => {
    const id = `shelf-${field.id}`;
    shelf({ id, title: field.name, note: `${books.length}권`, books, placement: `field-${field.id}`, link: EB.mapUrl(field.id), linkLabel: "지식 지도", half });
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = field.name;
    jump.appendChild(a);
  });

  // 맨 위: 요즘 많이 펼치는 책. GA4에서 매일 집계한 data/top-books.json을 다른 서가를 그린 뒤 맨 앞에 끼운다.
  // 파일이 없거나 다섯 권이 안 되면 서가를 만들지 않는다.
  fetch("/data/top-books.json", { cache: "no-cache" }).then((res) => (res.ok ? res.json() : null)).then((top) => {
    if (!top) return;
    const books = (top.books || []).map((t) => byId[t.id]).filter(Boolean).slice(0, 10);
    if (books.length >= 5) shelf({ id: "shelf-top", title: "요즘 많이 펼치는 책", note: top.period || "", books, placement: "top", ranked: true, first: true });
  }).catch((err) => console.warn("Top books unavailable", err));


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

  // 홈에서 책으로 넘어가는 클릭을 GA4 이벤트로 남긴다. 새 탭이 다른 도메인이라 기본 측정만으로는 이탈로 보인다.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='http']");
    if (!link || typeof window.gtag !== "function") return;
    const card = link.closest(".home-experiment");
    const bookId = link.dataset.bookId || (card && published.find((b) => link.href.startsWith(b.url))?.id) || "";
    if (!bookId) return;
    // link_url은 GA4 기본 측정기준(linkUrl)으로 잡혀, 맞춤 측정기준 없이 tools/build-top-books.py가 집계한다.
    window.gtag("event", "open_book", { book_id: bookId, link_url: link.href, placement: link.dataset.placement || (card ? "experiment" : "other"), transport_type: "beacon" });
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
