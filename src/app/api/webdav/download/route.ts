import { NextResponse } from "next/server";
import { createClient, FileStat } from "webdav";
import {
  normalizeWebDavPath,
  sanitizeServerUrl,
  buildRemotePath,
} from "@/lib/webdav";
import { SOURCE_EXTENSION, SOURCE_EXTENSION_REGEX } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DownloadRequestBody {
  serverUrl?: string;
  directory?: string;
  username?: string;
  password?: string;
}

interface DownloadedFilePayload {
  name: string;
  mime: string;
  base64: string;
}

const toBuffer = async (contents: unknown): Promise<Buffer> => {
  if (contents && typeof contents === "object" && "data" in contents) {
    return toBuffer((contents as { data: unknown }).data);
  }
  if (contents instanceof Buffer) {
    return contents;
  }
  if (contents instanceof ArrayBuffer) {
    return Buffer.from(contents);
  }
  if (ArrayBuffer.isView(contents)) {
    return Buffer.from(
      contents.buffer,
      contents.byteOffset,
      contents.byteLength
    );
  }
  if (typeof Blob !== "undefined" && contents instanceof Blob) {
    const arrayBuffer = await contents.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  if (typeof contents === "string") {
    return Buffer.from(contents, "utf-8");
  }
  throw new Error("Unsupported WebDAV response format.");
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DownloadRequestBody;
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

    const eligibleEntries = entries.filter(
      (entry) =>
        entry.type === "file" &&
        (entry.filename || "").toLowerCase().endsWith(SOURCE_EXTENSION)
    );

    if (eligibleEntries.length === 0) {
      return NextResponse.json(
        { error: "No eligible files found in the selected directory." },
        { status: 404 }
      );
    }

    const files: DownloadedFilePayload[] = [];

    for (const entry of eligibleEntries) {
      const remotePath =
        entry.filename || buildRemotePath(normalizedPath, entry.basename);
      const fileContents = await client.getFileContents(remotePath, {
        format: "binary",
      });

      const buffer = await toBuffer(fileContents);
      const rawName =
        entry.basename ||
        remotePath.split("/").pop() ||
        `track-${Date.now()}${SOURCE_EXTENSION}`;
      const decodedName = decodeURIComponent(rawName);
      const safeName = SOURCE_EXTENSION_REGEX.test(decodedName)
        ? decodedName
        : `${decodedName}${SOURCE_EXTENSION}`;

      files.push({
        name: safeName,
        mime: "application/octet-stream",
        base64: buffer.toString("base64"),
      });
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error("/api/webdav/download error", error);
    const message =
      error instanceof Error ? error.message : "Failed to download files.";
    const status = /unauthorized|forbidden|401|403/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
