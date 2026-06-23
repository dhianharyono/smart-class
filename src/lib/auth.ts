const secretStr = process.env.SESSION_SECRET || 'fallback-super-secret-key-32-chars-long!';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlEncode(str: string): string {
  const bytes = encoder.encode(str);
  let binString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return decoder.decode(bytes);
}

async function getCryptoKey() {
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

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = btoa(String.fromCharCode.apply(null, signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

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
    const binarySign = atob(signature.replace(/-/g, '+').replace(/_/g, '/'));
    const signatureBytes = new Uint8Array(binarySign.length);
    for (let i = 0; i < binarySign.length; i++) {
      signatureBytes[i] = binarySign.charCodeAt(i);
    }

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
