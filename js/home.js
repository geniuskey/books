/* 홈: 전체 웨이퍼, 두 갈래와 분야 카드, 대표 시뮬레이터, 저자 노트, 도구 */
EB.start("home", (d) => {
  "use strict";
  const { $, esc } = EB;

  // 통계
  const c = EB.counts(d.books);
  const vals = { published: c.published, writing: c.writing, planned: c.planned, fields: d.fields.length, experiments: d.books.filter(EB.isPublished).reduce((n, b) => n + (b.featured || []).length, 0) };
  EB.$$("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });

  // 전체 웨이퍼: 분야마다 부채꼴 하나
  EB.wafer($("#wafer"), $("#die-info"), {
    fields: d.fields, n: 11, waferName: "MASTER WAFER",
    yieldNote: "갈 길이 멀어서 더 재밌는 중",
    hint: "부채꼴 하나가 분야 하나, 다이 하나가 교과서 한 권. 다이를 가리키거나 눌러 보세요.",
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

  // 도구·데이터
  const tl = $("#tool-list");
  (d.tools || []).forEach((t) => {
    const rel = (t.related || []).map((id) => d.books.find((b) => b.id === id)).filter(Boolean);
    const el = document.createElement("div");
    el.className = "tool";
    el.innerHTML = `<h3>${esc(t.title)}<small>${esc(t.subtitle)}</small></h3>
      <p>${esc(t.description)}</p>
      ${rel.length ? `<div class="rel">함께 읽기: ${rel.map((b) => `<a href="${esc(b.url)}">${esc(b.title)}</a>`).join(", ")}</div>` : ""}
      <div class="links"><a href="${esc(t.url)}">열기 →</a>${t.repo ? `<a href="${esc(t.repo)}">GitHub</a>` : ""}</div>`;
    tl.appendChild(el);
  });

  // 해시로 들어온 경우(index.html#life 등) 렌더링 뒤에 다시 맞춘다
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
});
