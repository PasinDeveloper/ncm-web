import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "p1.music.126.net",
  "p2.music.126.net",
  "p3.music.126.net",
  "p4.music.126.net",
  "p5.music.126.net",
]);

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json(
      { error: "Missing src parameter" },
      { status: 400 }
    );
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json(
      { error: "Invalid album art URL" },
      { status: 400 }
    );
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json(
      { error: "Album art host is not allowed" },
      { status: 403 }
    );
  }

  try {
    const upstream = await fetch(target.toString());
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Unable to fetch album art" },
        { status: 502 }
      );
    }
    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Album art proxy failed", err);
    return NextResponse.json(
      { error: "Album art proxy failed" },
      { status: 500 }
    );
  }
}
