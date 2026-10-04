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
  for (let i = 0; i < orderedBooks.length; i += 11) {
    shelves.push([i === 0 ? "더 넓은 세계" : "계속 이어지는 책들", orderedBooks.slice(i, i + 11)]);
  }
  const shelfBox = $("#home-shelves");
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
      a.style.setProperty("--book-color", b.color);
      a.setAttribute("aria-label", `${spineName} · ${b.subtitle} 읽기`);
      a.title = `${spineName} · ${b.subtitle}`;
      a.innerHTML = `<span class="spine-top">${esc(b.fieldObj.name)}</span><span class="spine-title">${esc(spineName)}</span><span class="spine-foot">${esc(b.code)}</span>`;
      bookBox.appendChild(a);
    });
    shelfBox.appendChild(shelf);
  });

  // 두 갈래: 분야 카드
  d.wings.forEach((w) => {
    const box = $(`#fields-${w.id}`);
    d.fields.filter((f) => f.wing === w.id).forEach((f) => {
      const k = EB.counts(f.books);
      const a = document.createElement("a");
      a.className = "field-card";
      a.href = EB.fieldUrl(f.id);
      EB.tint(a, f);
      a.innerHTML = `${EB.miniWafer(f.books)}
        <div class="fc-body">
          <div class="fc-en">${esc(f.en)}</div>
          <h3>${esc(f.name)}</h3>
          <p>${esc(f.desc)}</p>
          <div class="fc-count"><span>출간 <b>${k.published}</b></span><span class="go">분야 보기 →</span></div>
        </div>`;
      box.appendChild(a);
    });
  });

  // 대표 시뮬레이터: 날짜마다 바뀌는 오늘의 시뮬레이터 + 갤러리
  const all = [];
  d.books.filter(EB.isPublished).forEach((b) => (b.featured || []).forEach((f) => all.push({ ...f, book: b })));
  if (all.length) {
    const href = (f) => f.book.url + f.link;
    const today = all[Math.floor(Date.now() / 864e5) % all.length];
    const hero = $("#today");
    EB.tint(hero, today.book);
    hero.innerHTML = `<a class="shot" href="${esc(href(today))}"><img src="${esc(today.image)}" alt="${esc(today.title)} 시뮬레이터 화면" loading="lazy"></a>
      <div class="txt">
        <div class="k">TODAY'S SIMULATOR · 오늘의 시뮬레이터</div>
        <h3>${esc(today.title)}</h3>
        <p>${esc(today.desc)}</p>
        <div class="from"><span class="sq">${esc(today.book.code)}</span>${esc(today.book.title)} · ${esc(today.book.subtitle)}</div>
        <a class="btn primary" href="${esc(href(today))}">지금 만져 보기 →</a>
      </div>`;
    const strip = $("#strip");
    all.filter((f) => f !== today).forEach((f) => {
      const a = document.createElement("a");
      a.className = "shot-card";
      a.href = href(f);
      EB.tint(a, f.book);
      a.innerHTML = `<div class="img"><img src="${esc(f.image)}" alt="${esc(f.title)} 시뮬레이터 화면" loading="lazy"></div>
        <div class="cap"><span class="sq">${esc(f.book.code)}</span><b>${esc(f.title)}</b><small>${esc(f.desc)}</small></div>`;
      strip.appendChild(a);
    });
  } else {
    $("#play").hidden = true;
  }

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
