import { NextRequest, NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, storageMode: "local-first", data: null });
}

// Keep the response compatible with versions still open in other browser tabs.
export async function POST(req: NextRequest) {
  try {
    await req.json();
    return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
