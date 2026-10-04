/* 책에서 전달한 위치를 GitHub 접수 양식에 미리 채운다. */
EB.start(null, (data) => {
  const params = new URLSearchParams(location.search);
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

  const templates = { error: "error.yml", question: "question.yml", request: "request.yml" };
  document.querySelectorAll("[data-feedback-type]").forEach((link) => {
    const url = new URL("https://github.com/geniuskey/books/issues/new");
    url.searchParams.set("template", templates[link.dataset.feedbackType]);
    if (book) url.searchParams.set("field:book", book.title);
    if (pageUrl) url.searchParams.set("field:page", pageUrl);
    link.href = url.href;
  });

  const type = params.get("type");
  if (templates[type]) document.getElementById(type).classList.add("feedback-selected");
});
