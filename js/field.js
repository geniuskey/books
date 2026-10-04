/* 분야 페이지 (field.html?f=semiconductor): 주제 관계 지도, 책장, 다른 분야 */
EB.start(null, (d) => {
  "use strict";
  const { $, esc } = EB;
  const id = new URLSearchParams(location.search).get("f");
  const f = d.fieldById[id] || d.fields[0];
  const wing = d.wingById[f.wing];

  document.title = `${f.name} · Books`;
  EB.$(".nav-fields summary").setAttribute("aria-current", "page");
  EB.$$(".nav-fields-menu a").find((a) => a.getAttribute("href") === EB.fieldUrl(f.id))?.setAttribute("aria-current", "page");
  EB.tint(document.body, f);

  // 분야별 개념 그룹 안에 책을 배치한다. 기존 반도체 단계는 원본 데이터를 사용한다.
  const map = window.FIELD_MAPS[f.id];
  const groups = f.stages
    ? f.stages.map((s) => ({ ...s, books: f.books.filter((b) => b.stage === s.id) }))
    : (map?.groups || []).map(([name, en, desc, ids]) => ({ name, en, desc, books: ids.map((id) => f.books.find((b) => b.id === id)).filter(Boolean) }));
  // 새 책이 추가되더라도 지도에서 빠지지 않도록 별도 그룹에 표시한다.
  const assigned = new Set(groups.flatMap((g) => g.books.map((b) => b.id)));
  const remaining = f.books.filter((b) => !assigned.has(b.id));
  if (remaining.length) groups.push({ name: "더 넓게 탐색하기", en: "Explore", desc: "이 분야에서 이어지는 주제", books: remaining });
  // 분야별 문장을 첫 화면의 제목으로 쓰고, 책 현황은 짧은 진행 표시로 묶는다.
  $("#f-wing").innerHTML = `<a href="index.html#${esc(f.wing)}">${esc(wing.name)}</a><span aria-hidden="true"> / </span>${esc(f.name)}<span class="field-en">${esc(f.en)}</span>`;
  $("#flow-title").textContent = map?.title || `${f.name} 지식 지도`;
  $("#flow-desc").textContent = map?.desc || f.desc;
  $("#f-map-label").textContent = `${f.name} 지식 지도`;
  const k = EB.counts(f.books);
  const upcomingText = [k.writing && `집필 중 ${k.writing}`, k.planned && `집필 예정 ${k.planned}`].filter(Boolean).join(" · ");
  $("#field-progress").innerHTML = `<div class="field-progress-top"><strong>${k.published}<small> / ${k.total}권</small></strong><span>${k.published ? "지금 읽을 수 있는 책" : "출간 준비 중"}</span></div>
    ${EB.progress(f.books)}
    <div class="field-progress-bottom"><span>${upcomingText || "모든 책 출간"}</span><a href="#shelf">책 목록 보기 ↓</a></div>`;
  const chain = $("#chain");
  if (f.id === "semiconductor") chain.classList.add("semiconductor-map");
  groups.forEach((g, i) => {
    const section = document.createElement("section");
    section.className = "map-group";
    section.setAttribute("aria-labelledby", `map-group-${i}`);
    section.innerHTML = `<div class="map-group-top"><span>${EB.pad2(i + 1)} / ${esc(g.en)}</span><small>${g.books.length}권</small></div>
      <h3 id="map-group-${i}">${esc(g.name)}</h3><p class="map-group-desc">${esc(g.desc)}</p>`;
    const books = document.createElement("div");
    books.className = "map-books";
    g.books.forEach((b) => books.appendChild(chip(b)));
    if (!g.books.length) books.innerHTML = `<p class="empty-slot">새로운 책을 준비하고 있습니다</p>`;
    section.appendChild(books);
    if (i < groups.length - 1) {
      const relation = document.createElement("div");
      relation.className = "map-relation";
      relation.innerHTML = `<span>${esc(map?.relations[i] || "주제 확장")}</span><b aria-hidden="true">↓</b>`;
      section.appendChild(relation);
    }
    chain.appendChild(section);
  });
  function chip(b) {
    const a = document.createElement("a");
    a.className = "map-book " + b.status;
    EB.tint(a, b);
    a.href = EB.readUrl(b) || `#card-${b.id}`;
    if (!EB.readUrl(b)) a.dataset.jump = b.id;
    const mapTitle = b.title.replace(/Book$/, " Book").replace(/([a-z])([A-Z][a-z])/g, "$1 $2");
    a.innerHTML = `<span class="map-book-code">${esc(b.code)}</span><span class="map-book-name"><b>${esc(mapTitle)}</b><small>${esc(b.subtitle)}</small></span>`;
    return a;
  }

  // 책장
  const grid = $("#grid");
  f.books.forEach((b) => grid.appendChild(EB.card(b)));

  // 다른 분야
  const other = $("#other-fields");
  d.wings.forEach((w) => {
    const g = document.createElement("div");
    g.className = "other-wing";
    g.innerHTML = `<b>${esc(w.name)}</b>`;
    d.fields.filter((x) => x.wing === w.id).forEach((x) => {
      const a = document.createElement("a");
      a.href = EB.fieldUrl(x.id);
      EB.tint(a, x);
      if (x === f) a.setAttribute("aria-current", "page");
      a.innerHTML = `<i></i>${esc(x.name)} <small>${x.books.length}</small>`;
      g.appendChild(a);
    });
    other.appendChild(g);
  });

  if (location.hash) {
    const t = document.getElementById(location.hash.slice(1));
    if (t) { t.scrollIntoView(); t.classList.add("flash"); }
  }
});
