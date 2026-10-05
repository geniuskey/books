/* 로그인 없는 접수와 GitHub 양식에 책·페이지 위치를 연결한다. */
EB.start("feedback", (data) => {
  const params = new URLSearchParams(location.search);
  const adminPanel = document.getElementById("feedback-admin");
  if (adminPanel) adminPanel.hidden = params.get("admin") !== "1";
  const bookId = params.get("book");
  const book = data.books.find((item) => item.id === bookId && item.status === "published");
  const page = params.get("page") || "";
  let pageUrl = "";
  if (book && page) {
    try {
      const candidate = new URL(page);
      if (candidate.protocol === "https:" && candidate.hostname === new URL(book.url).hostname) pageUrl = candidate.href;
    } catch (e) {}
  }

  if (book) {
    const context = document.getElementById("feedback-context");
    const title = document.createElement("strong");
    title.textContent = book.title;
    context.append("읽던 책: ", title);
    if (pageUrl) {
      const link = document.createElement("a");
      link.href = pageUrl;
      link.textContent = "현재 페이지 확인 ↗";
      context.append(" · ", link);
    }
    context.hidden = false;
  }

  const templates = { error: "error.yml", request: "request.yml" };
  document.querySelectorAll("[data-feedback-type]").forEach((link) => {
    const url = new URL("https://github.com/geniuskey/books/issues/new");
    url.searchParams.set("template", templates[link.dataset.feedbackType]);
    if (book) url.searchParams.set("book", book.title);
    if (pageUrl) url.searchParams.set("page", pageUrl);
    link.href = url.href;
  });

  const type = params.get("type");
  if (templates[type]) document.getElementById(type).classList.add("feedback-selected");

  const form = document.getElementById("feedback-form");
  const status = document.getElementById("feedback-status");
  const submit = document.getElementById("feedback-submit");
  const count = document.getElementById("feedback-count");
  const fields = form.elements;
  const composer = document.getElementById("feedback-compose");
  // Book links arrive with writing intent; ordinary visitors see the board first.
  if (composer && (book || ["error", "request", "cheer"].includes(type))) composer.open = true;
  data.books.filter((b) => b.status === "published").forEach((b) => {
    fields.bookId.add(new Option(`${b.title} · ${b.subtitle}`, b.id));
  });
  if (book) fields.bookId.value = book.id;
  if (["error", "request", "cheer"].includes(type)) fields.type.value = type;
  const showStatus = (text, state = "") => {
    status.textContent = text;
    status.dataset.state = state;
  };
  let endpoint = "";
  let pending = null;
  let sending = false;
  const updateCount = () => { count.textContent = `${fields.message.value.length.toLocaleString("ko-KR")} / 3,000자`; };
  form.addEventListener("input", updateCount);
  fetch("data/feedback-config.json", { cache: "no-cache" })
    .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
    .then((config) => {
      const url = new URL(config.endpoint);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error();
      endpoint = url.href;
      globalThis.FeedbackInbox?.start(config, data);
      submit.disabled = false;
      showStatus("로그인 없이 보낼 수 있습니다.");
    })
    .catch(() => {
      showStatus("접수 창구에 연결하지 못했습니다. 잠시 후 다시 방문하거나 아래 GitHub 창구를 이용해 주세요.", "error");
      const inboxStatus = document.getElementById("inbox-status");
      if (inboxStatus) inboxStatus.textContent = "게시판에 연결하지 못했습니다. 페이지를 새로고침해 주세요.";
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || !endpoint || !form.reportValidity()) return;
    if (!fields.message.value.trim()) { fields.message.focus(); showStatus("내용을 입력해 주세요.", "error"); return; }
    const payload = {
      type: fields.type.value,
      nickname: fields.nickname.value,
      message: fields.message.value,
      bookId: fields.bookId.value,
      pageUrl: book && fields.bookId.value === book.id ? pageUrl : "",
      website: fields.website.value,
      visibility: fields.visibility.value,
    };
    const signature = JSON.stringify(payload);
    // Reuse the ID if a timed-out request is retried, avoiding duplicate storage.
    if (!pending || pending.signature !== signature) pending = { signature, id: crypto.randomUUID() };
    sending = true;
    [...fields].forEach((field) => { field.disabled = true; });
    submit.disabled = true;
    submit.textContent = "보내는 중…";
    showStatus("글을 보내고 있습니다.");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: pending.id }),
        signal: AbortSignal.timeout(15000),
        credentials: "omit",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "접수하지 못했습니다. 잠시 후 다시 보내 주세요.");
      fields.message.value = "";
      pending = null;
      updateCount();
      globalThis.FeedbackInbox?.refresh();
      showStatus(payload.type === "cheer" ? "응원 감사합니다! 저자에게 잘 전달되었습니다." : "의견이 접수되었습니다. 남겨 주셔서 감사합니다.");
    } catch (error) {
      showStatus(error.name === "TimeoutError" || error instanceof TypeError ? "연결을 확인하지 못했습니다. 작성한 글은 그대로 있습니다. 잠시 후 다시 보내 주세요." : error.message, "error");
    } finally {
      sending = false;
      [...fields].forEach((field) => { field.disabled = false; });
      submit.disabled = false;
      submit.textContent = "보내기";
    }
  });
});
