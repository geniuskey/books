/* 로그인 없는 접수와 GitHub 양식에 책·페이지 위치를 연결한다. */
EB.start("feedback", (data) => {
  const params = new URLSearchParams(location.search);
  const adminPanel = document.getElementById("feedback-admin");
  if (adminPanel) adminPanel.hidden = params.get("admin") !== "1";
  const bookId = params.get("book");
  // 출간된 책과, 주소가 있는 집필 중인 책(일부 장을 공개한 책)에서 의견을 받는다.
  const acceptsFeedback = (item) => item.url && (item.status === "published" || item.status === "writing");
  // 책 하나가 서브도메인 전체일 수도(xxxbook.euiyun.com/), 서가의 하위 경로일 수도(artbook.euiyun.com/color/) 있다.
  const inBook = (url, item) => { const base = new URL(item.url); return url.protocol === "https:" && url.origin === base.origin && url.pathname.startsWith(base.pathname); };
  const book = data.books.find((item) => item.id === bookId && acceptsFeedback(item));
  const page = params.get("page") || "";
  let pageUrl = "";
  if (book && page) {
    try {
      const candidate = new URL(page);
      if (inBook(candidate, book)) pageUrl = candidate.href;
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
  let unavailable = false;
  let readerNickname = '';
  const onSession = (active) => {
    if (active && !fields.nickname.readOnly) readerNickname = fields.nickname.value;
    fields.nickname.value = active ? '관리자' : readerNickname;
    fields.nickname.readOnly = active;
  };
  const showGitHubOnly = () => {
    unavailable = true;
    composer.hidden = true;
    document.querySelector(".feedback-inbox").hidden = true;
    if (adminPanel) adminPanel.hidden = true;
    submit.disabled = true;
    const alternative = document.querySelector(".feedback-alternative");
    alternative.open = true;
    alternative.querySelector("summary").textContent = "GitHub으로 제보하기";
    alternative.querySelector(".feedback-note").textContent = "GitHub 계정으로 로그인하며 글이 공개됩니다.";
  };
  // Book links arrive with writing intent; ordinary visitors see the board first.
  if (composer && (book || ["error", "request", "cheer"].includes(type))) composer.open = true;
  data.books.filter(acceptsFeedback).forEach((b) => {
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
  fetch("/data/feedback-config.json", { cache: "no-cache" })
    .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
    .then((config) => {
      const url = new URL(config.endpoint);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error();
      endpoint = url.href;
      globalThis.FeedbackInbox?.start(config, data, { onUnavailable: showGitHubOnly, onSession });
      if (params.get("admin") === "1") {
        document.getElementById("admin-login").open = true;
        if (location.hash === "#feedback-admin") adminPanel?.scrollIntoView();
      }
      submit.disabled = false;
      showStatus("로그인 없이 보낼 수 있습니다.");
    })
    .catch(() => {
      showGitHubOnly();
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (unavailable || sending || !endpoint || !form.reportValidity()) return;
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
        headers: { "Content-Type": "application/json", ...globalThis.FeedbackInbox?.authHeaders() },
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
      if (error.name === "TimeoutError" || error instanceof TypeError) showGitHubOnly();
      else showStatus(error.message, "error");
    } finally {
      sending = false;
      [...fields].forEach((field) => { field.disabled = false; });
      submit.disabled = unavailable;
      submit.textContent = "보내기";
    }
  });
});
