// Build links with DOM nodes so submitted HTML remains plain text.
function appendFeedbackLinks(element, text) {
  const pattern = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    let label = match[0].replace(/[.,!?;:。！？、]+$/, '');
    // Keep balanced parentheses in URLs, but leave surrounding punctuation outside.
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (label.endsWith(close) && label.split(close).length > label.split(open).length) label = label.slice(0, -1);
    }
    let url;
    try { url = new URL(/^www\./i.test(label) ? `https://${label}` : label); } catch { continue; }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) continue;
    element.append(text.slice(offset, match.index));
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = label;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    element.append(link);
    offset = match.index + label.length;
  }
  if (offset === 0) element.textContent = text;
  else element.append(text.slice(offset));
}

/* Public and authenticated inbox on the same feedback page. Tokens stay in memory. */
globalThis.FeedbackInbox = (() => {
  let refresh = () => {};
  let authHeaders = () => ({});
  function start(config, catalog, { onUnavailable = () => {}, onSession = () => {} } = {}) {
    const $ = (id) => document.getElementById(id);
    const base = new URL(config.endpoint).origin;
    const books = new Map(catalog.books.map((book) => [book.id, book]));
    const types = { error: '오류 제보', request: '의견·건의', cheer: '저자 응원' };
    let visitorId;
    try { visitorId = localStorage.getItem('feedback-visitor'); } catch {}
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId || '')) {
      visitorId = crypto.randomUUID();
      try { localStorage.setItem('feedback-visitor', visitorId); } catch {}
    }
    let token = '', page = 0, generation = 0, expiryTimer, signingIn = false;
    authHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};
    const list = $('inbox-list');
    const status = $('inbox-status');
    const login = $('admin-login');
    const scope = $('inbox-scope');
    function session(active) {
      onSession(active);
      $('admin-session').hidden = !active;
      $('inbox-scope-label').hidden = !active;
      login.hidden = active;
      if (!active) { token = ''; scope.value = 'all'; clearTimeout(expiryTimer); }
    }
    async function api(path, options = {}, credential = token) {
      const response = await fetch(base + path, {
        ...options, credentials: 'omit', signal: AbortSignal.timeout(15000),
        headers: { ...(credential ? { Authorization: `Bearer ${credential}` } : {}), ...options.headers },
      });
      const result = await response.json();
      if (!response.ok) { const error = new Error(result.error || '요청을 처리하지 못했습니다.'); error.status = response.status; throw error; }
      return result;
    }
    function render(item, admin) {
      const card = document.createElement('article');
      card.className = 'inbox-item';
      const meta = document.createElement('p');
      meta.className = 'inbox-meta';
      const badge = document.createElement('span');
      badge.className = 'inbox-type';
      badge.textContent = types[item.type] || '의견';
      const author = document.createElement('span');
      author.textContent = item.is_admin ? '관리자' : item.nickname || '익명';
      if (item.is_admin) author.className = 'author-admin';
      const date = document.createElement('time');
      date.dateTime = item.created_at;
      date.textContent = new Date(item.created_at).toLocaleDateString('ko-KR');
      date.title = new Date(item.created_at).toLocaleString('ko-KR');
      meta.append(badge, author, date);
      if (admin) {
        const state = document.createElement('span');
        state.textContent = item.visibility === 'public' ? '공개' : '비공개';
        meta.append(state);
      }
      const message = document.createElement('p');
      message.className = 'inbox-message';
      appendFeedbackLinks(message, item.message);
      card.append(meta, message);
      const book = books.get(item.book_id);
      if (book) {
        const link = document.createElement('a');
        link.href = book.url;
        link.textContent = book.title;
        card.append(link);
        if (admin && item.page_url) {
          try {
            const url = new URL(item.page_url);
            const base = new URL(book.url);
            if (url.protocol === 'https:' && url.origin === base.origin && url.pathname.startsWith(base.pathname) && !url.username && !url.password) {
              const pageLink = document.createElement('a');
              pageLink.href = url.href; pageLink.textContent = '제보 페이지';
              pageLink.target = '_blank'; pageLink.rel = 'noopener'; card.append(' · ', pageLink);
            }
          } catch {}
        }
      }
      if (!admin || item.visibility === 'public') card.append(renderReactions(item));
      return card;
    }
    function renderReactions(item) {
      const area = document.createElement('div'); area.className = 'inbox-reactions';
      const notice = document.createElement('p'); notice.className = 'feedback-status'; notice.setAttribute('role', 'status');
      const like = document.createElement('button'); like.type = 'button';
      let liked = Boolean(item.liked);
      function showLike(count) {
        like.textContent = `♥ 좋아요 ${count}`;
        like.setAttribute('aria-pressed', String(liked));
        like.title = liked ? '좋아요 취소' : '좋아요 남기기';
      }
      showLike(item.like_count || 0);
      const path = `/api/feedback/${item.id}`;
      like.addEventListener('click', async () => {
        like.disabled = true; notice.textContent = '';
        try {
          const result = await api(`${path}/likes`, { method: liked ? 'DELETE' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visitorId }) }, '');
          liked = result.liked; showLike(result.count);
        } catch (error) { notice.textContent = error.message || '좋아요를 저장하지 못했습니다. 다시 시도해 주세요.'; }
        finally { like.disabled = false; }
      });
      const thread = document.createElement('details'); thread.className = 'inbox-thread';
      const summary = document.createElement('summary');
      let count = item.comment_count || 0;
      const showCount = () => { summary.textContent = `댓글 ${count}`; };
      showCount();
      const comments = document.createElement('div'); comments.className = 'inbox-comments';
      const more = document.createElement('button'); more.type = 'button'; more.textContent = '이전 댓글 더 보기'; more.hidden = true;
      const commentStatus = document.createElement('p'); commentStatus.className = 'feedback-status'; commentStatus.setAttribute('role', 'status');
      let nextPage = 0, loaded = false, loading = false, commentGeneration = 0;
      async function loadComments(reset = false) {
        if (loading && !reset) return;
        const current = ++commentGeneration;
        loading = true; more.disabled = true;
        if (reset) { nextPage = 0; comments.replaceChildren(); }
        commentStatus.textContent = '댓글을 불러오는 중…';
        try {
          const result = await api(`${path}/comments?page=${nextPage}`, {}, '');
          if (current !== commentGeneration) return;
          for (const comment of result.items) {
            const row = document.createElement('article'); row.className = 'inbox-comment';
            const meta = document.createElement('p'); meta.className = 'inbox-meta';
            const date = document.createElement('time'); date.dateTime = comment.created_at;
            date.textContent = new Date(comment.created_at).toLocaleString('ko-KR');
            const author = document.createElement('span');
            author.textContent = comment.is_admin ? '관리자' : comment.nickname || '익명';
            if (comment.is_admin) author.className = 'author-admin';
            meta.append(author, ' · ', date);
            const message = document.createElement('p'); message.className = 'inbox-message'; appendFeedbackLinks(message, comment.message);
            row.append(meta, message); comments.append(row);
          }
          nextPage++; loaded = true; more.hidden = !result.hasMore;
          commentStatus.textContent = comments.children.length ? '' : '첫 댓글을 남겨 주세요.';
        } catch (error) { if (current === commentGeneration) commentStatus.textContent = error.message || '댓글을 불러오지 못했습니다. 다시 열어 주세요.'; }
        finally { if (current === commentGeneration) { loading = false; more.disabled = false; } }
      }
      thread.addEventListener('toggle', () => { if (thread.open && !loaded) loadComments(true); });
      more.addEventListener('click', () => loadComments());
      const form = document.createElement('form'); form.className = 'inbox-comment-form';
      const nicknameLabel = document.createElement('label'); nicknameLabel.textContent = '닉네임 (선택)';
      const nickname = document.createElement('input'); nickname.name = 'nickname'; nickname.maxLength = 40; nickname.autocomplete = 'nickname'; nickname.placeholder = '익명'; nicknameLabel.append(nickname);
      if (token) { nickname.value = '관리자'; nickname.readOnly = true; }
      const messageLabel = document.createElement('label'); messageLabel.textContent = '댓글';
      const message = document.createElement('textarea'); message.name = 'message'; message.required = true; message.maxLength = 1000; message.rows = 3; message.placeholder = '함께 나누고 싶은 이야기를 남겨 주세요. (최대 1,000자)'; messageLabel.append(message);
      const trap = document.createElement('input'); trap.name = 'website'; trap.tabIndex = -1; trap.autocomplete = 'off';
      const trapLabel = document.createElement('label'); trapLabel.className = 'feedback-honeypot'; trapLabel.setAttribute('aria-hidden', 'true'); trapLabel.append('Website', trap);
      const note = document.createElement('p'); note.className = 'feedback-note'; note.textContent = '댓글은 누구나 볼 수 있습니다. 개인 정보는 적지 마세요.';
      const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = '댓글 남기기';
      const formStatus = document.createElement('p'); formStatus.className = 'feedback-status'; formStatus.setAttribute('role', 'status');
      let pending, submitting = false;
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); if (submitting) return;
        const payload = { nickname: nickname.value, message: message.value, website: trap.value };
        if (!payload.message.trim()) { formStatus.textContent = '댓글 내용을 입력해 주세요.'; return; }
        const signature = JSON.stringify(payload);
        if (!pending || pending.signature !== signature) pending = { signature, id: crypto.randomUUID() };
        submitting = true; submit.disabled = true; nickname.disabled = true; message.disabled = true;
        formStatus.textContent = '댓글을 보내는 중…';
        try {
          await api(`${path}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: pending.id }) });
          message.value = ''; pending = null; count++; showCount();
          formStatus.textContent = '댓글을 남겼습니다.';
          await loadComments(true);
        } catch (error) { formStatus.textContent = error.message || '댓글을 보내지 못했습니다. 다시 시도해 주세요.'; }
        finally { submitting = false; submit.disabled = false; nickname.disabled = false; message.disabled = false; }
      });
      form.append(nicknameLabel, messageLabel, trapLabel, note, submit, formStatus);
      thread.append(summary, comments, more, commentStatus, form);
      area.append(like, notice, thread);
      return area;
    }
    function handleError(error) {
      if (error instanceof TypeError || error.name === 'TimeoutError') {
        onUnavailable();
        return;
      }
      if (error.status === 401) {
        session(false); list.replaceChildren(); generation++;
        $('inbox-more').hidden = true;
        $('admin-status').textContent = '관리자 계정으로 다시 로그인해 주세요.';
      }
      status.textContent = error.message || '글을 불러오지 못했습니다. 다시 시도해 주세요.';
    }
    async function load(reset = true) {
      if (reset) { page = 0; list.replaceChildren(); }
      const current = ++generation;
      const credential = token;
      $('inbox-more').hidden = true;
      status.textContent = '글을 불러오는 중…';
      const query = new URLSearchParams({ page: String(page), type: $('inbox-type').value, visitorId });
      if (credential) query.set('scope', scope.value);
      try {
        const result = await api(`${credential ? '/api/admin/feedback' : '/api/feedback/public'}?${query}`, {}, credential);
        if (current !== generation) return;
        result.items.forEach((item) => list.append(render(item, Boolean(credential))));
        status.textContent = list.children.length ? (credential ? '관리자에게만 비공개 글이 표시됩니다.' : '독자가 공개로 남긴 글입니다.') : ($('inbox-type').value || credential ? '이 조건에 맞는 글이 없습니다. 다른 조건으로 살펴보세요.' : '아직 공개된 글이 없습니다. ‘의견 남기기’에서 첫 이야기를 나눠 주세요.');
        $('inbox-more').hidden = !result.hasMore;
        page++;
      } catch (error) { if (current === generation) handleError(error); }
    }
    refresh = () => load(true);
    $('inbox-refresh').addEventListener('click', refresh);
    $('inbox-more').addEventListener('click', () => load(false));
    $('inbox-type').addEventListener('change', refresh);
    scope.addEventListener('change', refresh);
    $('admin-logout').addEventListener('click', () => {
      globalThis.google?.accounts.id.disableAutoSelect();
      session(false); refresh();
    });
    let googleLoaded = false;
    login.addEventListener('toggle', () => {
      if (!login.open || googleLoaded) return;
      if (!config.googleClientId) { $('admin-status').textContent = 'Google 로그인 설정을 준비 중입니다.'; return; }
      googleLoaded = true;
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client?hl=ko'; script.async = true;
      script.onerror = () => { googleLoaded = false; $('admin-status').textContent = 'Google 로그인을 불러오지 못했습니다. 다시 열어 주세요.'; };
      script.onload = () => {
        google.accounts.id.initialize({
          client_id: config.googleClientId, auto_select: false,
          callback: async ({ credential }) => {
            if (signingIn) return;
            signingIn = true;
            $('admin-status').textContent = '관리자 권한을 확인하는 중…';
            try {
              await api('/api/admin/feedback?page=0', {}, credential);
              token = credential; session(true);
              clearTimeout(expiryTimer);
              expiryTimer = setTimeout(() => { session(false); refresh(); }, 60 * 60 * 1000);
              await refresh();
            } catch (error) { $('admin-status').textContent = error.message || '로그인하지 못했습니다.'; }
            finally { signingIn = false; }
          },
        });
        google.accounts.id.renderButton($('google-signin'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'ko' });
      };
      document.head.append(script);
    });
    refresh();
  }
  return { start, refresh: () => refresh(), authHeaders: () => authHeaders() };
})();
