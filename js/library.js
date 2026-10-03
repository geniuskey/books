/* 전체 책장: 갈래·분야·상태 필터와 검색, 분야별로 묶어서 보여 준다 */
EB.start("library", (d) => {
  "use strict";
  const { $, esc } = EB;
  const c = EB.counts(d.books);
  $("#lib-count").textContent = `${c.total}권 · 출간 ${c.published} · 집필 중 ${c.writing} · 집필 예정 ${c.planned}`;

  // 분야별 묶음
  const shelf = $("#shelf-groups");
  d.fields.forEach((f) => {
    const sec = document.createElement("section");
    sec.className = "group";
    sec.dataset.field = f.id;
    sec.dataset.wing = f.wing;
    EB.tint(sec, f);
    sec.innerHTML = `<div class="group-head"><h2><i></i>${esc(f.name)} <small>${esc(f.en)}</small></h2><a href="${EB.fieldUrl(f.id)}">분야 보기 →</a></div>`;
    const grid = document.createElement("div");
    grid.className = "grid";
    f.books.forEach((b) => grid.appendChild(EB.card(b)));
    sec.appendChild(grid);
    shelf.appendChild(sec);
  });

  // 필터: 갈래 / 분야 / 상태 (각각 하나씩 고르기)
  const state = { wing: "all", field: "all", status: "published" };
  const groups = {
    wing: [{ v: "all", t: "전체" }, ...d.wings.map((w) => ({ v: w.id, t: w.name }))],
    field: [{ v: "all", t: "모든 분야" }, ...d.fields.map((f) => ({ v: f.id, t: f.name, wing: f.wing }))],
    status: [{ v: "all", t: "모든 상태" }, ...Object.entries(d.statusLabels).map(([v, t]) => ({ v, t }))],
  };
  Object.entries(groups).forEach(([key, opts]) => {
    const box = $(`#f-${key}`);
    opts.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o.t;
      b.dataset.v = o.v;
      if (o.wing) b.dataset.wing = o.wing;
      b.setAttribute("aria-pressed", String(o.v === "all"));
      box.appendChild(b);
    });
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      state[key] = b.dataset.v;
      if (key === "wing") state.field = "all";
      sync();
    });
  });
  const search = $("#search");
  search.addEventListener("input", sync);

  // 주소로 필터 열기: library.html?status=planned&wing=life
  const qs = new URLSearchParams(location.search);
  ["wing", "field", "status"].forEach((k) => {
    if (groups[k].some((o) => o.v === qs.get(k))) state[k] = qs.get(k);
  });
  if (qs.get("q")) search.value = qs.get("q");

  function sync() {
    Object.keys(groups).forEach((key) => {
      EB.$$(`#f-${key} button`).forEach((b) => {
        b.setAttribute("aria-pressed", String(b.dataset.v === state[key]));
        if (key === "field") b.hidden = state.wing !== "all" && b.dataset.wing && b.dataset.wing !== state.wing;
      });
    });
    const q = search.value.trim().toLowerCase();
    const params = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => params.set(k, v));
    if (q) params.set("q", search.value.trim());
    history.replaceState(null, "", `${location.pathname}?${params}${location.hash}`);
    let shown = 0;
    EB.$$("#shelf-groups .group").forEach((sec) => {
      let n = 0;
      EB.$$(".card", sec).forEach((card) => {
        const ok = (state.wing === "all" || card.dataset.wing === state.wing)
          && (state.field === "all" || card.dataset.field === state.field)
          && (state.status === "all" || card.dataset.status === state.status)
          && (!q || card.dataset.text.includes(q));
        card.hidden = !ok;
        if (ok) n++;
      });
      sec.hidden = n === 0;
      shown += n;
    });
    $("#no-result").hidden = shown > 0;
    $("#shown").textContent = shown === d.books.length ? "" : `${shown}권 표시 중`;
  }
  sync();
});
