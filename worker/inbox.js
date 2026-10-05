import { verifyAdminToken } from './auth.js';

export async function inbox(request, env, headers) {
  const url = new URL(request.url);
  const admin = url.pathname.startsWith('/api/admin/');
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
  if (admin) {
    if (!env.GOOGLE_CLIENT_ID) return reply(503, { error: '관리자 로그인을 준비 중입니다.' });
    const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
    if (!token || token.length > 8192) return reply(401, { error: '관리자 Google 로그인이 필요합니다.' });
    try { await verifyAdminToken(token, env.GOOGLE_CLIENT_ID); }
    catch { return reply(401, { error: '관리자 계정으로 다시 로그인해 주세요.' }); }
  }
  try {
    if (request.method === 'GET' && ['/api/feedback/public', '/api/admin/feedback'].includes(url.pathname)) {
      const type = url.searchParams.get('type') || '';
      const page = url.searchParams.get('page') || '0';
      const scope = admin ? url.searchParams.get('scope') || 'all' : 'public';
      if ((type && !['error', 'request', 'cheer'].includes(type)) || !/^\d{1,5}$/.test(page) || !['all', 'public', 'private', 'unread', 'hidden'].includes(scope)) {
        return reply(400, { error: '검색 조건을 확인해 주세요.' });
      }
      const conditions = admin ? [] : ["visibility = 'public'", 'is_hidden = 0'];
      if (admin && ['public', 'private'].includes(scope)) conditions.push(`visibility = '${scope}'`);
      if (admin && scope === 'unread') conditions.push('read_at IS NULL');
      if (admin && scope === 'hidden') conditions.push('is_hidden = 1');
      const args = [];
      if (type) { conditions.push('type = ?'); args.push(type); }
      const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
      // Public rows intentionally omit page URLs, private state and moderation data.
      const columns = admin ? 'id, type, nickname, message, book_id, page_url, visibility, read_at, is_hidden, created_at' : 'id, type, nickname, message, book_id, created_at';
      const { results } = await env.DB.prepare(`SELECT ${columns} FROM feedback${where} ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET ?`).bind(...args, Number(page) * 20).all();
      return reply(200, { ok: true, items: results.slice(0, 20), hasMore: results.length > 20 });
    }
    const match = url.pathname.match(/^\/api\/admin\/feedback\/([0-9a-f-]{36})$/i);
    if (admin && match && request.method === 'PATCH') {
      if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, { error: 'JSON 형식으로 보내 주세요.' });
      // A bounded stream prevents unauthenticated or oversized update payloads.
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { error: '입력 내용을 확인해 주세요.' });
      let text = '', bytes = 0;
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > 1024) { await reader.cancel(); return reply(413, { error: '요청이 너무 큽니다.' }); }
        text += decoder.decode(value, { stream: true });
      }
      let data;
      try { data = JSON.parse(text + decoder.decode()); } catch { return reply(400, { error: '입력 내용을 확인해 주세요.' }); }
      const actions = { read: "read_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')", unread: 'read_at = NULL', hide: 'is_hidden = 1', restore: 'is_hidden = 0' };
      if (!data || !Object.hasOwn(actions, data.action)) return reply(400, { error: '지원하지 않는 작업입니다.' });
      const result = await env.DB.prepare(`UPDATE feedback SET ${actions[data.action]} WHERE id = ?`).bind(match[1]).run();
      return result.meta.changes ? reply(200, { ok: true }) : reply(404, { error: '글을 찾을 수 없습니다.' });
    }
    return reply(405, { error: '지원하지 않는 요청입니다.' });
  } catch { return reply(503, { error: '글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }); }
}
