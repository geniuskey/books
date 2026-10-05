/* Public and authenticated inbox on the same feedback page. Tokens stay in memory. */
globalThis.FeedbackInbox = (() => {
  let refresh = () => {};
  function start(config, catalog) {
    const $ = (id) => document.getElementById(id);
    const base = new URL(config.endpoint).origin;
    const books = new Map(catalog.books.map((book) => [book.id, book]));
    const types = { error: '오류 제보', request: '의견·건의', cheer: '저자 응원' };
    let token = '', page = 0, generation = 0, expiryTimer, signingIn = false;
    const list = $('inbox-list');
    const status = $('inbox-status');
    const login = $('admin-login');
    const scope = $('inbox-scope');
    function session(active) {
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
      const date = new Date(item.created_at).toLocaleString('ko-KR');
      meta.textContent = `${types[item.type]} · ${item.nickname || '익명'} · ${date}${admin ? ` · ${item.visibility === 'public' ? '공개' : '비공개'} · ${item.read_at ? '읽음' : '안 읽음'}${item.is_hidden ? ' · 숨김' : ''}` : ''}`;
      const message = document.createElement('p');
      message.className = 'inbox-message';
      message.textContent = item.message;
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
            if (url.protocol === 'https:' && url.origin === new URL(book.url).origin && !url.username && !url.password) {
              const pageLink = document.createElement('a');
              pageLink.href = url.href; pageLink.textContent = '제보 페이지';
              pageLink.target = '_blank'; pageLink.rel = 'noopener'; card.append(' · ', pageLink);
            }
          } catch {}
        }
      }
      if (admin) {
        const actions = document.createElement('div'); actions.className = 'inbox-actions';
        const buttons = [[item.read_at ? 'unread' : 'read', item.read_at ? '안 읽음으로 표시' : '읽음으로 표시']];
        if (item.visibility === 'public') buttons.push([item.is_hidden ? 'restore' : 'hide', item.is_hidden ? '공개 목록에 복원' : '공개 목록에서 숨기기']);
        for (const [action, label] of buttons) {
          const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
          button.addEventListener('click', async () => {
            const current = generation;
            button.disabled = true;
            try {
              await api(`/api/admin/feedback/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
              if (current === generation) await load(true);
            } catch (error) { if (current === generation) handleError(error); }
            finally { button.disabled = false; }
          });
          actions.append(button);
        }
        card.append(actions);
      }
      return card;
    }
    function handleError(error) {
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
      const query = new URLSearchParams({ page: String(page), type: $('inbox-type').value });
      if (credential) query.set('scope', scope.value);
      try {
        const result = await api(`${credential ? '/api/admin/feedback' : '/api/feedback/public'}?${query}`, {}, credential);
        if (current !== generation) return;
        result.items.forEach((item) => list.append(render(item, Boolean(credential))));
        status.textContent = list.children.length ? (credential ? '관리자에게만 비공개 글이 표시됩니다.' : '독자가 공개로 남긴 글입니다.') : '아직 해당하는 글이 없습니다.';
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
  return { start, refresh: () => refresh() };
})();
