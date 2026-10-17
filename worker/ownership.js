// Independent from public reaction visitor IDs. Never return or log this bearer secret.
export async function ownerHash(request) {
  const token = request.headers.get('X-Feedback-Owner');
  if (token === null) return null;
  if (!/^[0-9a-f]{64}$/.test(token)) throw new Error('Invalid owner key');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
