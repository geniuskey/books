import catalog from '../data/books.json' with { type: 'json' };

const books = new Map(catalog.books.filter(b => b.status === 'published' && b.url).map(b => [b.id, b]));
const MAX_BYTES = 16384;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const { id, type, nickname = '', message, bookId = '', pageUrl = '', website = '' } = data;
  if (typeof id !== 'string' || !uuid.test(id) || !['error', 'request', 'cheer'].includes(type)) return null;
  if (![nickname, message, bookId, pageUrl, website].every(v => typeof v === 'string')) return null;
  if (!message.trim() || message.length > 3000 || nickname.length > 40 || pageUrl.length > 2048) return null;
  if (bookId && !books.has(bookId)) return null;
  if (pageUrl) {
    try {
      const url = new URL(pageUrl);
      if (!bookId || url.protocol !== 'https:' || url.origin !== new URL(books.get(bookId).url).origin || url.username || url.password) return null;
    } catch { return null; }
  }
  return { id, type, nickname: nickname.trim(), message: message.trim(), bookId, pageUrl, website };
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); throw new RangeError(); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin',
    };
    const reply = (status, error, extra = {}) => new Response(JSON.stringify(error ? { error } : { ok: true }), { status, headers: { ...headers, ...extra } });
    if (!origin || !allowed.includes(origin)) return reply(403, '이 사이트에서 접수할 수 없습니다.');
    headers['Access-Control-Allow-Origin'] = origin;
    if (new URL(request.url).pathname !== '/api/feedback') return reply(404, '요청한 주소를 찾을 수 없습니다.');
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (request.method !== 'POST') return reply(405, '지원하지 않는 요청입니다.', { Allow: 'POST, OPTIONS' });
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply(415, 'JSON 형식으로 보내 주세요.');
    try {
      const [personal, total] = await Promise.all([
        env.SUBMISSIONS.limit({ key: `feedback:${request.headers.get('CF-Connecting-IP') || 'local'}` }),
        env.TOTAL_SUBMISSIONS.limit({ key: 'feedback' }),
      ]);
      if (!personal.success || !total.success) return reply(429, '잠시 후 다시 보내 주세요. 연속 접수를 제한하고 있습니다.', { 'Retry-After': '60' });
      let data;
      try { data = validate(JSON.parse(await readBody(request))); }
      catch (error) { return reply(error instanceof RangeError ? 413 : 400, '글의 길이와 입력 내용을 확인해 주세요.'); }
      if (!data) return reply(400, '글의 길이와 입력 내용을 확인해 주세요.');
      if (data.website) return reply(400, '입력 내용을 확인해 주세요.');
      await env.DB.prepare('INSERT INTO feedback (id, type, nickname, message, book_id, page_url) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .bind(data.id, data.type, data.nickname, data.message, data.bookId, data.pageUrl).run();
      return reply(201);
    } catch {
      // Do not log reader messages or identifying request headers.
      return reply(503, '지금은 접수가 어렵습니다. 잠시 후 다시 시도해 주세요.');
    }
  },
};
