import crypto from "node:crypto";

export interface AuthUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface SessionPayload extends AuthUser {
  exp: number;
}

export const SESSION_COOKIE_NAME = "exataslab_session";
export const OAUTH_STATE_COOKIE_NAME = "exataslab_oauth";

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

function getSigningSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    "exataslab-dev-fallback-secret-change-in-prod";
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64");
}

function sign(data: string): string {
  return base64UrlEncode(
    crypto.createHmac("sha256", getSigningSecret()).update(data).digest()
  );
}

export function createSessionToken(user: AuthUser, ttlSeconds = 60 * 60 * 24 * 30): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined): AuthUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  const expectedSig = sign(encoded);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const parsed = JSON.parse(base64UrlDecode(encoded).toString("utf8")) as SessionPayload;
    if (!parsed.sub || !parsed.email || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      sub: parsed.sub,
      name: parsed.name || parsed.email,
      email: parsed.email,
      picture: parsed.picture,
    };
  } catch {
    return null;
  }
}

export function generateOAuthPkce(): {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
} {
  const state = base64UrlEncode(crypto.randomBytes(24));
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  return { state, codeVerifier, codeChallenge };
}

export function getRequestOrigin(req: Request): string {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const url = new URL(req.url);
  return url.origin;
}
