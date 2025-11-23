import { NextResponse } from "next/server";
import { createClient, FileStat } from "webdav";
import { WebDavEntry } from "@/types";
import { normalizeWebDavPath, sanitizeServerUrl } from "@/lib/webdav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ListRequestBody {
  serverUrl?: string;
  directory?: string;
  username?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ListRequestBody;
    if (!body.serverUrl) {
      return NextResponse.json(
        { error: "Missing WebDAV server URL." },
        { status: 400 }
      );
    }

    const sanitizedUrl = sanitizeServerUrl(body.serverUrl);
    const normalizedPath = normalizeWebDavPath(body.directory);

    const client = createClient(sanitizedUrl, {
      username: body.username?.trim() || undefined,
      password: body.password?.trim() || undefined,
    });

    const directoryResponse = await client.getDirectoryContents(
      normalizedPath,
      {
        deep: false,
      }
    );

    const entries = Array.isArray(directoryResponse)
      ? (directoryResponse as FileStat[])
      : (directoryResponse as { data: FileStat[] }).data || [];

    const sanitizedEntries: WebDavEntry[] = entries.map((entry) => ({
      type: entry.type === "directory" ? "directory" : "file",
      filename: entry.filename,
      basename: entry.basename,
      size: entry.size ?? null,
      lastmod: entry.lastmod ? String(entry.lastmod) : null,
    }));

    return NextResponse.json({
      path: normalizedPath,
      entries: sanitizedEntries,
    });
  } catch (error) {
    console.error("/api/webdav/list error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to list WebDAV directory.";
    const status = /unauthorized|forbidden|401|403/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
