import type { AlbumArtPayload } from "@/lib/embedArtwork";

const PLACEHOLDER_URL = "/api/placeholder-album";
const albumArtCache = new Map<string, Promise<AlbumArtPayload | null>>();

const resolveRequestUrl = (raw: string) => {
  if (!raw.startsWith("http")) {
    return raw;
  }
  return `/api/album-art?src=${encodeURIComponent(raw)}`;
};

async function requestAlbumArt(
  targetUrl: string
): Promise<AlbumArtPayload | null> {
  try {
    const response = await fetch(resolveRequestUrl(targetUrl));
    if (!response.ok) {
      throw new Error(`Album art request failed (${response.status})`);
    }
    const blob = await response.blob();
    const mimeType = (
      blob.type ||
      response.headers.get("Content-Type") ||
      "image/jpeg"
    ).split(";")[0];
    let width: number | undefined;
    let height: number | undefined;
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(blob);
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close();
      } catch (err) {
        console.warn("Unable to derive album art dimensions", err);
      }
    }
    const buffer = await blob.arrayBuffer();
    return {
      bytes: new Uint8Array(buffer),
      mimeType,
      width,
      height,
    };
  } catch (err) {
    console.error("Failed to fetch album art", err);
    return null;
  }
}

export async function fetchAlbumArt(
  albumPic?: string | null
): Promise<AlbumArtPayload | null> {
  const target = albumPic || PLACEHOLDER_URL;
  if (!albumArtCache.has(target)) {
    albumArtCache.set(target, requestAlbumArt(target));
  }
  const art = await albumArtCache.get(target)!;
  if (art || target === PLACEHOLDER_URL) {
    return art;
  }
  albumArtCache.delete(target);
  return fetchAlbumArt(PLACEHOLDER_URL);
}
