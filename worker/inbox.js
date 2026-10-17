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
      const visitorId = url.searchParams.get('visitorId') || '';
      if (visitorId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) return reply(400, { error: '브라우저 식별 정보를 확인해 주세요.' });
      if ((type && !['error', 'request', 'cheer'].includes(type)) || !/^\d{1,5}$/.test(page) || !['all', 'public', 'private'].includes(scope)) {
        return reply(400, { error: '검색 조건을 확인해 주세요.' });
      }
      const conditions = admin ? [] : ["visibility = 'public'"];
      if (admin && ['public', 'private'].includes(scope)) conditions.push(`visibility = '${scope}'`);
      const args = [];
      if (type) { conditions.push('type = ?'); args.push(type); }
      const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
      // Public rows intentionally omit page URLs, private state and moderation data.
      const columns = admin ? 'id, type, nickname, message, book_id, page_url, visibility, created_at' : 'id, type, nickname, message, book_id, created_at';
      const counts = ', is_admin, (SELECT COUNT(*) FROM feedback_likes WHERE feedback_id = feedback.id) AS like_count, (SELECT COUNT(*) FROM feedback_comments WHERE feedback_id = feedback.id) AS comment_count, EXISTS(SELECT 1 FROM feedback_likes WHERE feedback_id = feedback.id AND visitor_id = ?) AS liked';
      const { results } = await env.DB.prepare(`SELECT ${columns}${counts} FROM feedback${where} ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET ?`).bind(visitorId, ...args, Number(page) * 20).all();
      // Only the aggregate includes private posts; their contents remain authenticated.
      const { results: totals } = await env.DB.prepare('SELECT COUNT(*) AS total FROM feedback').bind().all();
      return reply(200, { ok: true, total: totals[0].total, items: results.slice(0, 20), hasMore: results.length > 20 });
    }
    return reply(405, { error: '지원하지 않는 요청입니다.' });
  } catch { return reply(503, { error: '글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }); }
}
