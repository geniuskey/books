/* 웨이퍼 맵: 다이 하나 = 책 한 권.
   EB.wafer(svg, info, { books })          — 한 분야: 중심에서 가까운 다이부터 채운다.
   EB.wafer(svg, info, { fields, n: 11 })  — 전체: 분야마다 부채꼴 하나씩 나눠 준다.
   EB.miniWafer(books)                      — 분야 카드용 작은 정적 웨이퍼 (SVG 문자열). */
(function () {
  "use strict";
  const { $, esc, pad2 } = EB;
  const SVG = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVG, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const C = 200, R = 188;

  function grid(n, pitch, die) {
    const slots = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = C + (i - (n - 1) / 2) * pitch, y = C + (j - (n - 1) / 2) * pitch;
        const far = Math.hypot(Math.abs(x - C) + die / 2, Math.abs(y - C) + die / 2);
        if (far < R - 6) slots.push({ x, y, col: i + 1, row: j + 1, d: Math.hypot(x - C, y - C), a: Math.atan2(y - C, x - C) });
      }
    }
    return slots;
  }
  const byRank = (b) => ({ published: 0, writing: 1, planned: 2 }[b.status] ?? 3) * 10 + (b.phase || 0);

  /* 전체 모드: 12시 방향부터 시계 방향으로 분야마다 부채꼴을 나누고, 부채꼴 안에서는 중심부터 채운다 */
  function assignWedges(slots, fields) {
    const total = fields.reduce((a, f) => a + f.books.length, 0);
    const spare = slots.length - total;
    const angle = (s) => (s.a + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const ring = [...slots].sort((p, q) => angle(p) - angle(q) || p.d - q.d);
    let at = 0, given = 0;
    fields.forEach((f, k) => {
      const extra = k === fields.length - 1 ? spare - given : Math.round((spare * f.books.length) / total);
      given += extra;
      const mine = ring.slice(at, at + f.books.length + extra).sort((p, q) => p.d - q.d);
      at += f.books.length + extra;
      const books = [...f.books].sort((a, b) => byRank(a) - byRank(b));
      mine.forEach((s, i) => { s.field = f; s.book = books[i] || null; });
    });
  }

  EB.wafer = (svg, info, opt) => {
    const all = !!opt.fields;
    const n = opt.n || 9;
    const pitch = 378 / n, die = pitch * 0.88, SCAN = 1.4;
    const now = new Date();
    const lot = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const slots = grid(n, pitch, die);
    let books;
    if (all) {
      assignWedges(slots, opt.fields);
      books = opt.fields.flatMap((f) => f.books);
    } else {
      slots.sort((p, q) => p.d - q.d || p.a - q.a);
      books = [...opt.books].sort((a, b) => byRank(a) - byRank(b)).slice(0, slots.length);
      slots.forEach((s, k) => { s.book = books[k] || null; s.field = opt.field || null; });
    }

    svg.innerHTML = `<defs>
      <radialGradient id="w-si" cx="50%" cy="45%" r="60%"><stop offset="0" class="si-1"/><stop offset="1" class="si-2"/></radialGradient>
      <linearGradient id="w-irid" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(0 .5 .5)">
        <stop offset="0" stop-color="#3ee8ff"/><stop offset=".22" stop-color="#8f6bff"/><stop offset=".42" stop-color="#ff5ec8"/>
        <stop offset=".62" stop-color="#ffd25e"/><stop offset=".8" stop-color="#5effa8"/><stop offset="1" stop-color="#3ee8ff"/>
      </linearGradient>
      <radialGradient id="w-glare" cx="35%" cy="25%" r="45%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <pattern id="w-circuit" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 3 H5 V9 H12 M8 0 V4 M2 12 V8" fill="none" class="circ" stroke-width=".7"/></pattern>
      <pattern id="w-circuit-lit" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 3 H5 V9 H12 M8 0 V4 M2 12 V8" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".7"/></pattern>
      <clipPath id="w-clip"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
      <linearGradient id="w-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ad7ff" stop-opacity="0"/><stop offset="1" stop-color="#7ad7ff" stop-opacity=".9"/></linearGradient>
      <path id="w-arc" d="M ${C - R - 9} ${C} A ${R + 9} ${R + 9} 0 0 1 ${C + R + 9} ${C}"/>
    </defs>`;
    el("circle", { cx: C, cy: C, r: R, class: "disc", fill: "url(#w-si)" }, svg);
    el("circle", { cx: C, cy: C, r: R, class: "irid", fill: "url(#w-irid)" }, svg);
    const dies = el("g", { class: "dies" }, svg);
    el("circle", { cx: C, cy: C, r: R, class: "glare", fill: "url(#w-glare)" }, svg);
    el("rect", { x: 0, y: -40, width: 400, height: 40, class: "scan", fill: "url(#w-scan)", "clip-path": "url(#w-clip)", style: `animation-duration:${SCAN}s` }, svg);
    el("circle", { cx: C, cy: C, r: R, class: "rim" }, svg);
    el("circle", { cx: C, cy: C + R, r: 7, class: "notch" }, svg);
    const label = el("text", { class: "arc-label" }, svg);
    el("textPath", { href: "#w-arc", startOffset: "50%" }, label).textContent =
      `LOT ${lot} · ${esc(opt.waferName || "WAFER #01")} · Ø300 mm · ${slots.length} DIES`;

    slots.forEach((s) => {
      const b = s.book, f = s.field;
      const g = el("g", { class: "die" }, dies);
      g.style.animationDelay = ((s.y / 400) * SCAN).toFixed(2) + "s";
      g.dataset.pos = `X${pad2(s.col)}·Y${pad2(s.row)}`;
      if (f) { g.dataset.field = f.id; EB.tint(g, f); }
      const box = { x: s.x - die / 2, y: s.y - die / 2, width: die, height: die, rx: n > 9 ? 3 : 4 };
      el("rect", { ...box, class: "body" }, g);
      el("rect", { ...box, class: "pattern", fill: b && EB.isPublished(b) ? "url(#w-circuit-lit)" : "url(#w-circuit)" }, g);
      if (b) {
        EB.tint(g, b);
        g.classList.add("book", b.status);
        g.dataset.id = b.id;
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `${b.title} · ${b.subtitle} (${EB.status(b)})`);
        el("text", { x: s.x, y: s.y, style: n > 9 ? "font-size:8.5px" : "" }, g).textContent = b.code;
      } else {
        g.classList.add("empty");
        if (f && all) g.classList.add("reserved");
      }
    });

    tiltOnPointer(svg);

    // 검사 결과 카드
    const c = EB.counts(books);
    const yieldPct = ((c.published / slots.length) * 100).toFixed(1);
    const pct = (k) => ((k / slots.length) * 100).toFixed(2) + "%";
    const empty = slots.length - books.length;
    const defaultInfo = () => {
      info.removeAttribute("style");
      info.classList.remove("tint");
      info.innerHTML = `<div class="k">LOT ${lot} · ${esc(opt.waferName || "WAFER #01")} · INSPECTION</div>
        <h3>수율 ${yieldPct}% <small>${esc(opt.yieldNote || "매주 올라가는 중")}</small></h3>
        <div class="ybar" aria-hidden="true"><i class="pass" style="width:${pct(c.published)}"></i><i class="fab" style="width:${pct(c.writing)}"></i><i class="plan" style="width:${pct(c.planned)}"></i></div>
        <div class="row legend"><span><b class="dot pass"></b>PASS ${c.published} · 출간</span><span><b class="dot fab"></b>IN FAB ${c.writing} · 집필 중</span><span><b class="dot plan"></b>QUEUED ${c.planned} · 집필 예정</span>${empty ? `<span><b class="dot"></b>빈 다이 ${empty}</span>` : ""}</div>
        <p class="hint">${esc(opt.hint || "다이 하나가 교과서 한 권. 다이를 가리키거나 눌러 보세요.")}</p>`;
    };
    const VERDICT = { published: ["pass", "PASS"], writing: ["fab", "IN FAB"], planned: ["plan", "QUEUED"] };
    const show = (g) => {
      const b = g.dataset.id && books.find((x) => x.id === g.dataset.id);
      const f = g.dataset.field && EB.data.fieldById[g.dataset.field];
      if (all) dimField(f && f.id);
      if (!b) {
        info.removeAttribute("style");
        info.classList.remove("tint");
        if (f) EB.tint(info, f);
        info.innerHTML = `<div class="k">DIE ${g.dataset.pos} · <span class="verdict">EMPTY</span>${f ? " · " + esc(f.name) : ""}</div>
          <h3>아직 노광되지 않은 다이</h3>
          <p>${f ? `${esc(f.name)} 분야에서 다음 책을 기다리는 자리입니다.` : "이 자리에 들어갈 다음 책을 준비하고 있습니다."} 어떤 책이 들어오면 좋을까요?</p>
          <div class="row"><a href="https://github.com/geniuskey/books/issues">다음 책 제안하기 →</a></div>`;
        return;
      }
      EB.tint(info, b);
      const [vc, vt] = VERDICT[b.status] || ["", b.status];
      const stats = EB.isPublished(b) ? `<span>${b.chapters}개 챕터</span><span>${b.simulators}+ 시뮬레이터</span>` : `<span>${esc(EB.status(b))}</span>`;
      const link = EB.readUrl(b)
        ? `<a href="${esc(b.url)}">읽으러 가기 →</a>`
        : all ? `<a href="${EB.fieldUrl(b.field)}#card-${esc(b.id)}">분야에서 보기 →</a>` : `<a href="#card-${esc(b.id)}" data-jump="${esc(b.id)}">책장에서 보기 →</a>`;
      info.innerHTML = `<div class="k">DIE ${g.dataset.pos} · <span class="verdict ${vc}">${vt}</span> · ${esc(b.code)} · ${esc(b.fieldObj.name)}</div>
        <h3>${esc(b.title)}<small>${esc(b.subtitle)}</small></h3>
        <p>${esc(b.headline && EB.isPublished(b) ? b.headline : b.description)}</p>
        <div class="row">${stats}${link}</div>`;
    };
    const dimField = (fid) => EB.$$(".die", svg).forEach((g) => g.classList.toggle("dim-soft", !!fid && g.dataset.field !== fid));

    let selected = null;
    const byId = (id) => svg.querySelector(`.die.book[data-id="${id}"]`);
    const mark = () => EB.$$(".die.book", svg).forEach((g) => g.classList.toggle("active", g.dataset.id === selected));
    const rest = () => { if (selected) show(byId(selected)); else { defaultInfo(); dimField(null); } };
    svg.addEventListener("pointerover", (e) => { const g = e.target.closest(".die"); if (g) show(g); });
    svg.addEventListener("pointerleave", rest);
    svg.addEventListener("focusin", (e) => { const g = e.target.closest(".die.book"); if (g) show(g); });
    svg.addEventListener("focusout", rest);
    const select = (g) => { selected = selected === g.dataset.id ? null : g.dataset.id; mark(); rest(); };
    svg.addEventListener("click", (e) => { const g = e.target.closest(".die.book"); if (g) select(g); else { const d = e.target.closest(".die"); if (d) show(d); } });
    svg.addEventListener("keydown", (e) => {
      const g = e.target.closest(".die.book");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(g); }
    });
    defaultInfo();
  };

  /* 마우스를 따라 웨이퍼가 기울고, 간섭색과 반사광이 움직인다 */
  function tiltOnPointer(svg) {
    const tilt = svg.parentElement;
    const area = svg.closest("section") || document.body;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    area.addEventListener("pointermove", (e) => {
      if (still.matches || e.pointerType === "touch") return;
      const r = svg.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
      tilt.style.setProperty("--ry", (dx * 10).toFixed(2) + "deg");
      tilt.style.setProperty("--rx", (-dy * 10).toFixed(2) + "deg");
      $("#w-irid", svg).setAttribute("gradientTransform", `rotate(${(dx * 60 + dy * 30).toFixed(1)} .5 .5)`);
      $("#w-glare", svg).setAttribute("cx", (50 + dx * 35).toFixed(1) + "%");
      $("#w-glare", svg).setAttribute("cy", (45 + dy * 35).toFixed(1) + "%");
    });
    area.addEventListener("pointerleave", () => { tilt.style.removeProperty("--rx"); tilt.style.removeProperty("--ry"); });
  }

  /* 분야 카드용 작은 웨이퍼 */
  EB.miniWafer = (books) => {
    const n = 7, pitch = 378 / n, die = pitch * 0.82;
    const slots = grid(n, pitch, die).sort((p, q) => p.d - q.d || p.a - q.a);
    const list = [...books].sort((a, b) => byRank(a) - byRank(b));
    const dies = slots.map((s, k) => {
      const b = list[k];
      const cls = b ? b.status : "empty";
      return `<rect class="m-${cls}" x="${(s.x - die / 2).toFixed(1)}" y="${(s.y - die / 2).toFixed(1)}" width="${die.toFixed(1)}" height="${die.toFixed(1)}" rx="5"/>`;
    }).join("");
    return `<svg class="mini-wafer" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="${R}" class="m-disc"/>${dies}<circle cx="200" cy="${200 + R}" r="9" class="m-notch"/></svg>`;
  };
})();
