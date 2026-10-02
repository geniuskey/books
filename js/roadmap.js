/* 로드맵: 전체·분야별 진행률, 단계별(다음 차례 → 그다음 → 언젠가) 책 목록 */
EB.start("roadmap", (d) => {
  "use strict";
  const { $, esc } = EB;
  const c = EB.counts(d.books);

  $("#rm-total").innerHTML = `<div class="rm-big"><b>${c.published}</b><span>/ ${c.total}권 출간</span></div>
    ${EB.progress(d.books)}
    <div class="rm-legend"><span><i class="pub"></i>출간 ${c.published}</span><span><i class="wri"></i>집필 중 ${c.writing}</span><span><i class="pla"></i>집필 예정 ${c.planned}</span></div>`;

  // 분야별 진행률
  const fb = $("#rm-fields");
  d.wings.forEach((w) => {
    const h = document.createElement("h3");
    h.className = "rm-wing";
    h.textContent = w.name;
    fb.appendChild(h);
    d.fields.filter((f) => f.wing === w.id).forEach((f) => {
      const k = EB.counts(f.books);
      const row = document.createElement("a");
      row.className = "rm-field";
      row.href = EB.fieldUrl(f.id);
      EB.tint(row, f);
      row.innerHTML = `<span class="nm"><i></i>${esc(f.name)}</span>${EB.progress(f.books)}<span class="ct">${k.published} / ${k.total}</span>`;
      fb.appendChild(row);
    });
  });

  // 단계별 목록
  const pb = $("#rm-phases");
  const row = (b) => {
    const r = document.createElement("div");
    r.className = "rm-row " + b.status;
    r.id = "card-" + b.id;
    EB.tint(r, b);
    const ideas = (b.ideas || []).map((i) => `<li>${esc(i)}</li>`).join("");
    r.innerHTML = `<span class="sq">${esc(b.code)}</span>
      <div class="rm-main">
        <div class="rm-title"><b>${esc(b.subtitle)}</b><small>${esc(b.title)}</small><span class="badge st-${b.status}">${esc(EB.status(b))}</span></div>
        <p>${esc(b.description)}</p>
        ${ideas ? `<ul class="rm-ideas">${ideas}</ul>` : ""}
      </div>
      <a class="rm-field-tag" href="${EB.fieldUrl(b.field)}">${esc(b.fieldObj.name)}</a>`;
    return r;
  };
  const done = d.books.filter(EB.isPublished);
  d.phases.forEach((p) => {
    const list = d.books.filter((b) => !EB.isPublished(b) && b.phase === p.id)
      .sort((a, b) => (a.status === "writing" ? -1 : 0) - (b.status === "writing" ? -1 : 0));
    const sec = document.createElement("section");
    sec.className = "rm-phase";
    sec.innerHTML = `<div class="rm-phase-head"><span class="ph">PHASE ${p.id}</span><h2>${esc(p.name)} <small>${list.length}권</small></h2><p>${esc(p.desc)}</p></div>`;
    const body = document.createElement("div");
    body.className = "rm-list";
    list.forEach((b) => body.appendChild(row(b)));
    sec.appendChild(body);
    pb.appendChild(sec);
  });
  const ds = document.createElement("section");
  ds.className = "rm-phase done";
  ds.innerHTML = `<div class="rm-phase-head"><span class="ph">SHIPPED</span><h2>이미 나온 책 <small>${done.length}권</small></h2><p>지금 바로 읽을 수 있습니다.</p></div>`;
  const dl = document.createElement("div");
  dl.className = "rm-done";
  done.forEach((b) => {
    const a = document.createElement("a");
    a.className = "chip published";
    EB.tint(a, b);
    a.href = b.url;
    a.innerHTML = `<span class="sq">${esc(b.code)}</span><span>${esc(b.title)}<small>${esc(b.subtitle)}</small></span>`;
    dl.appendChild(a);
  });
  ds.appendChild(dl);
  pb.prepend(ds);

  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) { t.scrollIntoView(); t.classList.add("flash"); } }
});
