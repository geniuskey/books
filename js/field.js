/* 분야 페이지 (field.html?f=semiconductor): 분야 웨이퍼, 흐름 지도, 책장, 다른 분야 */
EB.start(null, (d) => {
  "use strict";
  const { $, esc } = EB;
  const id = new URLSearchParams(location.search).get("f");
  const f = d.fieldById[id] || d.fields[0];
  const wing = d.wingById[f.wing];
  const idx = d.fields.indexOf(f) + 1;

  document.title = `${f.name} · euiyun books`;
  EB.$$(`.topnav a[href="index.html#${f.wing}"]`).forEach((a) => a.setAttribute("aria-current", "page"));
  EB.tint(document.body, f);

  // 머리
  $("#f-wing").innerHTML = `<a href="index.html#${esc(f.wing)}">${esc(wing.name)}</a> · ${esc(f.en)}`;
  $("#f-name").textContent = f.name;
  $("#f-desc").textContent = f.desc;
  const k = EB.counts(f.books);
  const pub = f.books.filter(EB.isPublished);
  const vals = { published: k.published, writing: k.writing, planned: k.planned, simulators: pub.length ? pub.reduce((a, b) => a + (b.simulators || 0), 0) + "+" : "–" };
  EB.$$("[data-stat]").forEach((el) => { el.textContent = vals[el.dataset.stat]; });

  EB.wafer($("#wafer"), $("#die-info"), {
    books: f.books, field: f, waferName: `WAFER #${EB.pad2(idx)}`,
    yieldNote: k.published ? "매주 올라가는 중" : "첫 다이를 노광하는 중",
  });

  // 흐름 지도: 단계가 있으면 가치사슬, 없으면 추천 읽기 순서
  const chain = $("#chain");
  if (f.stages) {
    $("#flow-title").textContent = `${f.name} 가치사슬 위의 교과서`;
    $("#flow-desc").textContent = "각 단계를 다루는 교과서를 그 자리에 놓았습니다.";
    chain.classList.add("cols-" + Math.min(f.stages.length, 6));
    f.stages.forEach((s, i) => {
      const books = f.books.filter((b) => b.stage === s.id);
      const el = document.createElement("div");
      el.className = "stage";
      el.innerHTML = `<div class="num">STAGE ${EB.pad2(i + 1)}</div>
        <h3>${esc(s.name)}<small>${esc(s.en)}</small></h3>
        <p class="desc">${esc(s.desc)}</p>`;
      const chips = document.createElement("div");
      chips.className = "chips";
      books.forEach((b) => chips.appendChild(chip(b)));
      if (!books.length) chips.innerHTML = `<div class="empty-slot">곧 채워집니다</div>`;
      el.appendChild(chips);
      chain.appendChild(el);
    });
  } else {
    $("#flow-title").textContent = "추천 읽기 순서";
    $("#flow-desc").textContent = "처음 시작한다면 이 순서로 읽기를 권합니다. 아직 나오지 않은 책은 집필 순서이기도 합니다.";
    chain.className = "path";
    f.books.forEach((b, i) => {
      const step = document.createElement("div");
      step.className = "step";
      step.innerHTML = `<span class="n">${i + 1}</span>`;
      step.appendChild(chip(b));
      chain.appendChild(step);
    });
  }
  function chip(b) {
    const a = document.createElement("a");
    a.className = "chip " + b.status;
    EB.tint(a, b);
    a.href = EB.readUrl(b) || `#card-${b.id}`;
    if (!EB.readUrl(b)) a.dataset.jump = b.id;
    a.innerHTML = `<span class="sq">${esc(b.code)}</span><span>${esc(b.title).replace(/Book$/, "<wbr>Book")}<small>${esc(EB.isPublished(b) ? b.subtitle : `${b.subtitle} · ${EB.status(b)}`)}</small></span>`;
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
