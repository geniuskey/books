import { createRemoteJWKSet, jwtVerify } from 'jose';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function verifyAdminToken(token, clientId, keys = googleKeys) {
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ['RS256'],
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
    requiredClaims: ['exp', 'iat', 'sub', 'email', 'email_verified'],
    maxTokenAge: '2 hours',
  });
  if (payload.email_verified !== true || payload.email !== 'geniuskey@gmail.com') {
    throw new Error('Not an administrator');
  }
  return payload;
}

// No credentials means an ordinary reader; supplied credentials must be valid.
export async function authorIsAdmin(request, env) {
  const authorization = request.headers.get('Authorization');
  if (authorization === null) return false;
  const token = authorization.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!env.GOOGLE_CLIENT_ID || !token || token.length > 8192) throw new Error('Invalid credentials');
  await verifyAdminToken(token, env.GOOGLE_CLIENT_ID);
  return true;
}
