EB.start(document.body.dataset.page, async (d) => {
  "use strict";
  const { $, esc } = EB;
  const response = await fetch("data/discovery.json");
  if (!response.ok) throw new Error("실험 목록 로딩 실패");
  const data = await response.json();
  const books = Object.fromEntries(d.books.map((b) => [b.id, b]));
  const concepts = Object.fromEntries(data.concepts.map((c) => [c.id, c]));
  const normalize = (s) => s.normalize("NFKC").toLowerCase();
  if (document.body.dataset.page === "paths") {
    $("#learning-paths").innerHTML = data.paths.map((p) => `<article class="learning-path" id="${esc(p.id)}">
      <h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><p><b>시작하기 전에:</b> ${esc(p.prerequisites)}</p>
      <ol>${p.steps.map((s) => `<li><a href="${esc(new URL(s.link, books[s.bookId].url).href)}">${esc(s.title)}</a>
        <small> · ${esc(books[s.bookId].title)}</small><p>${esc(s.task)}</p></li>`).join("")}</ol>
      <div class="challenge"><b>마지막으로 설명해 보세요</b><p>${esc(p.challenge)}</p></div>
      <p><a href="simulators.html?q=${encodeURIComponent(p.query)}">관련 실험 더 찾기 →</a> · <a href="#${esc(p.id)}">이 경로 링크</a></p>
    </article>`).join("");
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    return;
  }
  const search = $("#search");
  const field = $("#experiment-field");
  const level = $("#experiment-level");
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") || "";
  d.fields.filter((f) => data.experiments.some((e) => books[e.bookId].field === f.id)).forEach((f) => {
    field.add(new Option(f.name, f.id));
  });
  [...new Set(data.experiments.map((e) => e.level))].forEach((v) => level.add(new Option(v, v)));
  if ([...field.options].some((o) => o.value === params.get("field"))) field.value = params.get("field");
  if ([...level.options].some((o) => o.value === params.get("level"))) level.value = params.get("level");
  function render() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const matches = data.experiments.filter((e) => {
      const book = books[e.bookId];
      const text = normalize([e.title, e.description, e.question, book.title, book.subtitle,
        ...e.concepts.flatMap((id) => [concepts[id].label, ...concepts[id].aliases])].join(" "));
      return (!field.value || book.field === field.value) && (!level.value || e.level === level.value)
        && words.every((word) => text.includes(word));
    });
    $("#shown").textContent = `대표 실험 ${data.experiments.length}개 중 ${matches.length}개 · 난이도는 교과서 기준`;
    $("#no-result").hidden = matches.length > 0;
    $("#experiments").innerHTML = matches.map((e) => `<article class="experiment">
      <a href="${esc(e.url)}" tabindex="-1" aria-hidden="true"><img src="${esc(e.image)}" alt="" loading="lazy" width="720" height="450"></a>
      <div class="body"><div class="source">${esc(books[e.bookId].title)} · ${esc(e.level)}</div>
      <h2><a href="${esc(e.url)}">${esc(e.title)}</a></h2><p><b>${esc(e.question)}</b></p><p>${esc(e.description)}</p>
      <div class="tags">${e.concepts.map((id) => `<a href="simulators.html?q=${encodeURIComponent(concepts[id].label)}">${esc(concepts[id].label)}</a>`).join(" ")}</div>
      <a href="${esc(e.url)}">예측하고 실험하기 →</a></div></article>`).join("");
    const next = new URLSearchParams();
    if (search.value.trim()) next.set("q", search.value.trim());
    if (field.value) next.set("field", field.value);
    if (level.value) next.set("level", level.value);
    history.replaceState(null, "", location.pathname + (next.size ? `?${next}` : ""));
  }
  search.addEventListener("input", render);
  field.addEventListener("change", render);
  level.addEventListener("change", render);
  $("#reset-filters").addEventListener("click", () => { search.value = field.value = level.value = ""; render(); search.focus(); });
  render();
});
