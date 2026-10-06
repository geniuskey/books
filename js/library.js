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
    f.books.forEach((b) => {
      const card = EB.card(b);
      const description = card.querySelector(".body > p");
      if (description) {
        description.id = `${card.id}-description`;
        description.classList.add("book-description");
        description.setAttribute("role", "tooltip");
        card.tabIndex = 0;
        card.setAttribute("aria-label", b.title);
        card.setAttribute("aria-describedby", description.id);
      }
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    shelf.appendChild(sec);
  });

  // 필터: 갈래 / 분야 / 상태 (각각 하나씩 고르기)
  const state = { wing: "all", field: "all", status: "published" };
  const groups = {
    wing: [{ v: "all", t: "전체" }, ...d.wings.map((w) => ({ v: w.id, t: w.name }))],
    field: [{ v: "all", t: "모든 분야" }, ...d.fields.filter((f) => f.books.length).map((f) => ({ v: f.id, t: f.name, wing: f.wing }))],
    status: [{ v: "all", t: "모든 상태" }, ...Object.entries(d.statusLabels).map(([v, t]) => ({ v, t }))],
  };
  Object.entries(groups).forEach(([key, opts]) => {
    const select = $(`#f-${key}`);
    opts.forEach((o) => select.add(new Option(o.t, o.v)));
    select.addEventListener("change", () => {
      state[key] = select.value;
      if (key === "wing") state.field = "all";
      sync();
    });
  });
  const search = $("#search");
  search.addEventListener("input", sync);

  // 주소로 필터 열기: /library/?status=planned&wing=life
  const qs = new URLSearchParams(location.search);
  ["wing", "field", "status"].forEach((k) => {
    if (groups[k].some((o) => o.v === qs.get(k))) state[k] = qs.get(k);
  });
  if (state.wing !== "all" && !groups.field.some((o) => o.v === state.field && (!o.wing || o.wing === state.wing))) state.field = "all";
  if (qs.get("q")) search.value = qs.get("q");

  function sync() {
    const field = $("#f-field");
    field.replaceChildren(...groups.field.filter((o) => !o.wing || state.wing === "all" || o.wing === state.wing).map((o) => new Option(o.t, o.v)));
    Object.keys(groups).forEach((key) => { $(`#f-${key}`).value = state[key]; });
    const q = search.value.trim().toLowerCase();
    const params = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => {
      if (v !== (k === "status" ? "published" : "all")) params.set(k, v);
    });
    if (q) params.set("q", search.value.trim());
    history.replaceState(null, "", `${location.pathname}${params.size ? "?" + params : ""}${location.hash}`);
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
