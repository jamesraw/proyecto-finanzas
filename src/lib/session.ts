// Minimal signed-cookie session, deliberately simple: this app is unlocked by a
// single shared PIN (APP_PIN) for two people, not per-user auth. We just need to
// prove "someone who knows the PIN visited /login" via an HMAC-signed cookie that
// works in both the Edge middleware runtime and Node server actions.

const encoder = new TextEncoder();

export const SESSION_COOKIE = "thimphu_session";
export const PERSON_COOKIE = "thimphu_person";

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const str = atob(b64 + pad);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET no está configurado. Definilo en las variables de entorno."
    );
  }
  return secret;
}

/** Creates a signed session token to store in a cookie after a correct PIN entry. */
export async function createSessionToken(): Promise<string> {
  const secret = requireSecret();
  const payload = JSON.stringify({ iat: Date.now() });
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return `${payloadB64}.${toBase64Url(sig)}`;
}

/** Verifies a session token's HMAC signature. Returns false if missing/invalid/tampered. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  let secret: string;
  try {
    secret = requireSecret();
  } catch {
    return false;
  }
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;
  try {
    const key = await getKey(secret);
    const sig = fromBase64Url(sigB64);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sig as BufferSource,
      encoder.encode(payloadB64)
    );
  } catch {
    return false;
  }
}
