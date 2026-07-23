function getSecretKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET is not configured in production environment.');
    }
    console.warn('[SECURITY WARNING] SESSION_SECRET is not set. Using local development fallback secret.');
    return 'dev-secret-key-smart-class-secure-32-chars-long!';
  }
  return secret;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlEncode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8');
}

async function getCryptoKey() {
  const secretStr = getSecretKey();
  const keyData = encoder.encode(secretStr);
  return globalThis.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload: any): Promise<string> {
  const key = await getCryptoKey();
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const data = base64urlEncode(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    })
  );

  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${data}`)
  );

  const signature = Buffer.from(signatureBuffer).toString('base64url');

  return `${header}.${data}.${signature}`;
}

export async function verifySession(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;

    const key = await getCryptoKey();
    const dataToVerify = encoder.encode(`${header}.${data}`);

    // Decode signature
    const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64url'));

    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      dataToVerify
    );

    if (!isValid) return null;

    // Decode payload
    const payload = JSON.parse(base64urlDecode(data));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    return null;
  }
}
