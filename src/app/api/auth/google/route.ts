import { NextRequest, NextResponse } from "next/server";
import {
  generateOAuthPkce,
  getRequestOrigin,
  isGoogleAuthConfigured,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth";

export function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(`${origin}/?auth=unconfigured`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const redirectUri = `${origin}/api/auth/google/callback`;
  const { state, codeVerifier, codeChallenge } = generateOAuthPkce();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    JSON.stringify({ state, codeVerifier }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      path: "/",
      maxAge: 60 * 10,
    }
  );
  return res;
}
