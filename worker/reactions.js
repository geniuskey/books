import { authorIsAdmin } from './auth.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const visible = "SELECT id FROM feedback WHERE id = ? AND visibility = 'public' AND is_hidden = 0";

export async function reactions(request, env, headers, match, readBody) {
  const [, id, kind] = match;
  const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
  const allowed = kind === 'comments' ? ['GET', 'POST'] : ['GET', 'PUT', 'DELETE'];
  if (!allowed.includes(request.method)) return reply(405, { error: '지원하지 않는 요청입니다.' });
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const reading = request.method === 'GET';
    const limits = reading
      ? [env.INBOX_REQUESTS.limit({ key: `inbox:${ip}` })]
      : [env.SUBMISSIONS.limit({ key: `feedback:${ip}` }), env.TOTAL_SUBMISSIONS.limit({ key: 'feedback' })];
    if ((await Promise.all(limits)).some(result => !result.success)) {
      return new Response(JSON.stringify({ error: '잠시 후 다시 시도해 주세요. 연속 요청을 제한하고 있습니다.' }), { status: 429, headers: { ...headers, 'Retry-After': '60' } });
    }
    const parent = await env.DB.prepare(visible).bind(id).all();
    if (!parent.results.length) return reply(404, { error: '공개된 글을 찾을 수 없습니다.' });
    const url = new URL(request.url);
    if (kind === 'comments' && reading) {
      const page = url.searchParams.get('page') || '0';
      if (!/^\d{1,5}$/.test(page)) return reply(400, { error: '검색 조건을 확인해 주세요.' });
      const { results } = await env.DB.prepare(`SELECT id, nickname, message, created_at, is_admin FROM feedback_comments WHERE feedback_id IN (${visible}) ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET ?`).bind(id, Number(page) * 20).all();
      return reply(200, { items: results.slice(0, 20), hasMore: results.length > 20 });
    }
    let data;
    if (!reading) {
      if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, { error: 'JSON 형식으로 보내 주세요.' });
      try { data = JSON.parse(await readBody(request)); }
      catch (error) { return reply(error instanceof RangeError ? 413 : 400, { error: '입력 내용과 길이를 확인해 주세요.' }); }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { error: '입력 내용을 확인해 주세요.' });
    }
    if (kind === 'comments') {
      const { id: commentId, nickname = '', message, website = '' } = data;
      if (!uuid.test(commentId) || typeof commentId !== 'string' || typeof nickname !== 'string' || nickname.length > 40 || typeof message !== 'string' || !message.trim() || message.length > 1000 || website !== '') {
        return reply(400, { error: '댓글은 1~1,000자, 닉네임은 40자 이내로 입력해 주세요.' });
      }
      let isAdmin;
      try { isAdmin = await authorIsAdmin(request, env); }
      catch { return reply(401, { error: '관리자 계정으로 다시 로그인해 주세요.' }); }
      // Recheck visibility in the write itself, including concurrent moderation.
      const result = await env.DB.prepare(`INSERT INTO feedback_comments (id, feedback_id, nickname, message, is_admin) SELECT ?, id, ?, ?, ? FROM feedback WHERE id = ? AND visibility = 'public' AND is_hidden = 0 ON CONFLICT(id) DO NOTHING`).bind(commentId, isAdmin ? '관리자' : nickname.trim(), message.trim(), Number(isAdmin), id).run();
      if (!result.meta.changes) {
        const existing = await env.DB.prepare(`SELECT id FROM feedback_comments WHERE id = ? AND feedback_id IN (${visible})`).bind(commentId, id).all();
        if (!existing.results.length) return reply(404, { error: '공개된 글을 찾을 수 없습니다.' });
      }
      return reply(201, { ok: true });
    }
    const visitorId = reading ? url.searchParams.get('visitorId') : data.visitorId;
    if (typeof visitorId !== 'string' || !uuid.test(visitorId)) return reply(400, { error: '브라우저 식별 정보를 확인해 주세요.' });
    if (request.method === 'PUT') {
      await env.DB.prepare("INSERT INTO feedback_likes (feedback_id, visitor_id) SELECT id, ? FROM feedback WHERE id = ? AND visibility = 'public' AND is_hidden = 0 ON CONFLICT(feedback_id, visitor_id) DO NOTHING").bind(visitorId, id).run();
    } else if (request.method === 'DELETE') {
      await env.DB.prepare(`DELETE FROM feedback_likes WHERE visitor_id = ? AND feedback_id IN (${visible})`).bind(visitorId, id).run();
    }
    const { results } = await env.DB.prepare(`SELECT COUNT(*) AS count, COALESCE(MAX(visitor_id = ?), 0) AS liked FROM feedback_likes WHERE feedback_id IN (${visible})`).bind(visitorId, id).all();
    return reply(200, { count: results[0].count, liked: Boolean(results[0].liked) });
  } catch { return reply(503, { error: '지금은 처리하기 어렵습니다. 잠시 후 다시 시도해 주세요.' }); }
}
