import { NextRequest, NextResponse } from "next/server";
import {
  isGoogleAuthConfigured,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = verifySessionToken(token);
  return NextResponse.json({
    user,
    googleConfigured: isGoogleAuthConfigured(),
  });
}
