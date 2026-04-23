import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "layout.json";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: KEY });
    const blob = blobs.find(b => b.pathname === KEY);
    if (!blob) return NextResponse.json({});
    const res = await fetch(blob.url, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await put(KEY, JSON.stringify(body), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
