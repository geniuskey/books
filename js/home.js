/* 홈: GA4 방문 통계, 분야별 많이 펼치는 책과 분야별 서가, 대표 실험, 저자 노트 */
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

  // 등수는 표지에 꽂힌 책갈피 리본으로 단다. 1~3위는 금·은·동, 4위는 가죽색. 1위엔 별을 얹는다.
  const ribbon = (rank) => `<span class="shelf-rank rank-${Math.min(rank, 4)}" aria-hidden="true">${rank === 1 ? '<i class="rank-star">★</i>' : ""}<b>${rank}</b></span>`;

  function cover(b, placement, rank) {
    return `<a class="shelf-cover" href="${esc(b.url)}" target="_blank" rel="noopener" data-book-id="${esc(b.id)}" data-placement="${placement}" style="--book-color:${esc(b.color)}" aria-label="${rank ? `${rank}위 · ` : ""}${esc(b.title)} · ${esc(b.subtitle)} 읽기 (새 탭)">${rank ? ribbon(rank) : ""}<small>${esc(b.fieldObj.name)}</small><strong>${esc(EB.coverTitle(b))}</strong><span class="shelf-art" aria-hidden="true">${window.coverArt ? window.coverArt(b.motif) : ""}</span><span class="shelf-cover-title">${esc(b.title)}</span></a>`;
  }

  function shelf({ id, title, note, link, linkLabel, books, placement, ranked, half, level = 2, extra = "" }) {
    const row = document.createElement("section");
    row.className = "shelf-row" + (half ? " half" : "") + (extra ? ` ${extra}` : "");
    row.id = id;
    row.setAttribute("aria-labelledby", `${id}-title`);
    row.innerHTML = `<div class="shelf-head"><h${level} id="${id}-title">${esc(title)}${note ? ` <small>${esc(note)}</small>` : ""}</h${level}>${link ? `<a href="${esc(link)}">${esc(linkLabel)} →</a>` : ""}
      <div class="shelf-nav" hidden><button type="button" data-dir="-1" aria-label="${esc(title)} 이전 책">${arrow("m14 6-6 6 6 6")}</button><button type="button" data-dir="1" aria-label="${esc(title)} 다음 책">${arrow("m10 6 6 6-6 6")}</button></div></div>
      <div class="shelf-track" tabindex="0" role="region" aria-labelledby="${id}-title">${books.map((b, i) => cover(b, placement, ranked ? i + 1 : 0)).join("")}</div>`;
    shelves.appendChild(row);
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

  // GA4 집계(data/analytics.json)를 읽은 뒤 서가를 그린다. 없으면 books.json 순서로 그린다.
  const analytics = fetch("/data/analytics.json", { cache: "no-cache" })
    .then((res) => (res.ok ? res.json() : null))
    .catch((err) => { console.warn("GA4 analytics unavailable", err); return null; });

  analytics.then((ga) => {
    const opens = Object.fromEntries(((ga && ga.opens && ga.opens.books) || []).map((x) => [x.id, x.opens]));
    // 많이 펼친 순서. 같으면 books.json의 순서를 지킨다.
    const popular = (books) => books.map((b, i) => ({ b, i })).sort((x, y) => (opens[y.b.id] || 0) - (opens[x.b.id] || 0) || x.i - y.i).map((x) => x.b);
    const period = (ga && ga.opens && ga.opens.period) || "";

    // 맨 위: 요즘 많이 펼치는 책. 한 분야가 독차지하지 않도록 분야마다 4위까지 따로 뽑아 두 칸씩 나란히 둔다.
    // 세 권 이상 낸 분야 중 조회가 있는 분야만, 분야 전체 조회수가 많은 순으로 놓는다.
    const views = (books) => books.reduce((n, b) => n + (opens[b.id] || 0), 0);
    const boards = d.fields.map((f) => ({ field: f, all: published.filter((b) => b.field === f.id) }))
      .filter((x) => x.all.length >= 3 && x.all.some((b) => opens[b.id]))
      .sort((x, y) => views(y.all) - views(x.all));
    if (boards.length >= 2) {
      if (boards.length % 2) boards.pop();
      const head = document.createElement("h2");
      head.className = "shelf-group-title";
      head.id = "shelf-top";
      head.innerHTML = `요즘 많이 펼치는 책${period ? ` <small>${esc(period)} · 분야별 4위까지</small>` : ""}`;
      shelves.appendChild(head);
      boards.forEach(({ field, all }) => {
        const top = popular(all).filter((b) => opens[b.id]).slice(0, 4);
        shelf({ id: `shelf-top-${field.id}`, title: field.name, books: top, placement: "top", ranked: true, half: true, level: 3, extra: "shelf-top",
          link: `#shelf-${field.id}`, linkLabel: `${all.length}권 모두` });
      });
    }

    // 분야별 서가: 위에서 인기순을 보였으니 여기서는 books.json에 정한 분야 안 순서(예: 소자 → 설계 → 공정)를 지킨다.
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

    // euiyun.com처럼 GA4 방문 통계를 첫 화면에 보여 준다.
    const st = ga && ga.stats;
    if (st && st.visitors) {
      const num = (n) => Number(n || 0).toLocaleString("ko-KR");
      const day = (iso) => { const [, m, dd] = String(iso).split("-"); return `${Number(m)}월 ${Number(dd)}일`; };
      const box = $("#home-stats");
      box.innerHTML = `<dl>
        <div><dt>펼쳐 볼 책</dt><dd>${num(published.length)}<small>권</small></dd></div>
        <div><dt>다녀간 분</dt><dd>${num(st.visitors)}<small>명</small></dd></div>
        <div><dt>다시 찾아온 분</dt><dd>${num(st.returning)}<small>명</small></dd></div>
        <div><dt>페이지를 본 횟수</dt><dd>${num(st.pageViews)}<small>회</small></dd></div>
      </dl><p>${esc(day(st.since))}부터 ${esc(day(st.until || ga.updated))}까지 · Google Analytics 집계</p>`;
      box.hidden = false;
    }

    // 해시로 들어온 경우 서가를 그린 뒤 다시 맞춘다.
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
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
    // 홈 서가별 클릭 분석용. 인기 순위는 tools/build-analytics.py가 책 사이트 조회수로 따로 집계한다.
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

});
