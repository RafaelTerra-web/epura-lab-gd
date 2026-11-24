import { NextRequest, NextResponse } from "next/server";

// Stateless/edge-compatible progress endpoint with in-memory session cache on dev/serverless.
// Client persists durably in localStorage (offline-first) and can export/import JSON across devices.
let latestSnapshot: Record<string, unknown> | null = null;

export async function GET() {
  return NextResponse.json({
    ok: true,
    storageMode: process.env.DATABASE_URL ? "cloud-configured" : "local-first",
    data: latestSnapshot,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    latestSnapshot = { ...body, syncedAt: new Date().toISOString() };
    return NextResponse.json({ ok: true, syncedAt: latestSnapshot.syncedAt });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
