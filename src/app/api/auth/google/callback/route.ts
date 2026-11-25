import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getRequestOrigin,
  isGoogleAuthConfigured,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const origin = getRequestOrigin(req);
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(`${origin}/?auth=unconfigured`);
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/?auth=cancelled`);
  }

  const rawCookie = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!rawCookie) {
    return NextResponse.redirect(`${origin}/?auth=state_error`);
  }

  let stored: { state?: string; codeVerifier?: string } = {};
  try {
    stored = JSON.parse(rawCookie) as { state?: string; codeVerifier?: string };
  } catch {
    return NextResponse.redirect(`${origin}/?auth=state_error`);
  }

  if (!stored.state || stored.state !== state || !stored.codeVerifier) {
    return NextResponse.redirect(`${origin}/?auth=state_error`);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: stored.codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/?auth=token_error`);
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/?auth=token_error`);
    }

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${origin}/?auth=profile_error`);
    }

    const profile = (await userRes.json()) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    if (!profile.sub || !profile.email) {
      return NextResponse.redirect(`${origin}/?auth=profile_error`);
    }

    const sessionToken = createSessionToken({
      sub: profile.sub,
      name: profile.name || profile.email.split("@")[0],
      email: profile.email,
      picture: profile.picture,
    });

    const res = NextResponse.redirect(`${origin}/?auth=ok`);
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }
}
