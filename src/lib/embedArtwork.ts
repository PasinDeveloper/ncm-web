import { ID3Writer } from "browser-id3-writer";
import { Track } from "@/types";

export interface AlbumArtPayload {
  bytes: Uint8Array;
  mimeType: string;
  width?: number;
  height?: number;
}

interface EmbedOptions {
  buffer: ArrayBuffer;
  format?: "mp3" | "flac";
  meta?: Track["meta"];
  albumArt?: AlbumArtPayload | null;
}

export async function embedAlbumArtIntoAudio({
  buffer,
  format,
  meta,
  albumArt,
}: EmbedOptions): Promise<ArrayBuffer> {
  if (!albumArt) {
    return buffer;
  }

  const resolvedFormat = format || detectFormat(buffer);

  if (resolvedFormat === "flac") {
    return embedIntoFlac(buffer, albumArt, meta);
  }

  return embedIntoMp3(buffer, albumArt, meta);
}

function detectFormat(buffer: ArrayBuffer): "mp3" | "flac" {
  const signature = new Uint8Array(buffer, 0, 4);
  if (
    signature.length >= 4 &&
    signature[0] === 0x66 &&
    signature[1] === 0x4c &&
    signature[2] === 0x61 &&
    signature[3] === 0x43
  ) {
    return "flac";
  }
  return "mp3";
}

function embedIntoMp3(
  buffer: ArrayBuffer,
  albumArt: AlbumArtPayload,
  meta?: Track["meta"]
): ArrayBuffer {
  const COVER_FRONT_TYPE = 0x03;
  try {
    const writer = new ID3Writer(buffer);
    writer.removeTag();

    if (meta?.musicName) {
      writer.setFrame("TIT2", meta.musicName);
    }

    if (meta?.artist?.length) {
      writer.setFrame(
        "TPE1",
        meta.artist.map(([name]) => name)
      );
    }

    if (meta?.album) {
      writer.setFrame("TALB", meta.album);
    }

    writer.setFrame("APIC", {
      description: meta?.album || "Cover",
      data: albumArt.bytes.buffer,
      type: COVER_FRONT_TYPE,
      useUnicodeEncoding: true,
    });

    return writer.addTag();
  } catch (err) {
    console.error("Failed to embed ID3 artwork", err);
    return buffer;
  }
}

function embedIntoFlac(
  buffer: ArrayBuffer,
  albumArt: AlbumArtPayload,
  meta?: Track["meta"]
): ArrayBuffer {
  const source = new Uint8Array(buffer);
  if (
    source.length < 4 ||
    source[0] !== 0x66 ||
    source[1] !== 0x4c ||
    source[2] !== 0x61 ||
    source[3] !== 0x43
  ) {
    return buffer;
  }

  let offset = 4;
  const preservedBlocks: Uint8Array[] = [];

  while (offset + 4 <= source.length) {
    const blockHeader = source[offset];
    const isLastBlock = (blockHeader & 0x80) !== 0;
    const blockType = blockHeader & 0x7f;
    const blockLength =
      (source[offset + 1] << 16) |
      (source[offset + 2] << 8) |
      source[offset + 3];
    const blockEnd = offset + 4 + blockLength;

    if (blockEnd > source.length) {
      return buffer;
    }

    offset = blockEnd;

    if (blockType === 4 || blockType === 6) {
      if (isLastBlock) {
        break;
      }
      continue;
    }

    const chunk = source.slice(offset - (4 + blockLength), blockEnd);
    chunk[0] &= 0x7f; // clear "is-last" bit for every preserved block
    preservedBlocks.push(chunk);

    if (isLastBlock) {
      break;
    }
  }

  const commentContent = buildVorbisCommentBlock(meta);
  if (commentContent) {
    const commentHeader = new Uint8Array(4);
    commentHeader[0] = 0x04;
    commentHeader[1] = (commentContent.length >>> 16) & 0xff;
    commentHeader[2] = (commentContent.length >>> 8) & 0xff;
    commentHeader[3] = commentContent.length & 0xff;
    preservedBlocks.push(commentHeader);
    preservedBlocks.push(commentContent);
  }

  const pictureContent = buildFlacPictureBlock(albumArt, meta?.album);
  const pictureHeader = new Uint8Array(4);
  pictureHeader[0] = 0x80 | 6;
  pictureHeader[1] = (pictureContent.length >>> 16) & 0xff;
  pictureHeader[2] = (pictureContent.length >>> 8) & 0xff;
  pictureHeader[3] = pictureContent.length & 0xff;

  preservedBlocks.push(pictureHeader);
  preservedBlocks.push(pictureContent);

  const metadataBytes = concatChunks(preservedBlocks);
  const audioFrames = source.slice(offset);
  const result = new Uint8Array(4 + metadataBytes.length + audioFrames.length);

  result.set(source.slice(0, 4), 0);
  result.set(metadataBytes, 4);
  result.set(audioFrames, 4 + metadataBytes.length);

  return result.buffer;
}

function buildVorbisCommentBlock(meta?: Track["meta"]): Uint8Array | null {
  if (!meta) {
    return null;
  }

  const comments: string[] = [];
  if (meta.musicName) {
    comments.push(`TITLE=${meta.musicName}`);
  }
  if (meta.artist?.length) {
    const artists = meta.artist.map(([name]) => name).join(" / ");
    comments.push(`ARTIST=${artists}`);
  }
  if (meta.album) {
    comments.push(`ALBUM=${meta.album}`);
  }

  if (comments.length === 0) {
    return null;
  }

  const encoder = new TextEncoder();
  const vendor = encoder.encode("web-audio-studio");
  const encodedComments = comments.map((entry) => encoder.encode(entry));

  let totalLength = 4 + vendor.length + 4;
  for (const comment of encodedComments) {
    totalLength += 4 + comment.length;
  }

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint32(offset, vendor.length, true);
  offset += 4;
  new Uint8Array(buffer, offset, vendor.length).set(vendor);
  offset += vendor.length;

  view.setUint32(offset, encodedComments.length, true);
  offset += 4;

  for (const comment of encodedComments) {
    view.setUint32(offset, comment.length, true);
    offset += 4;
    new Uint8Array(buffer, offset, comment.length).set(comment);
    offset += comment.length;
  }

  return new Uint8Array(buffer);
}

function buildFlacPictureBlock(
  albumArt: AlbumArtPayload,
  albumTitle?: string
): Uint8Array {
  const encoder = new TextEncoder();
  const mimeBytes = encoder.encode(albumArt.mimeType || "image/jpeg");
  const descriptionBytes = albumTitle
    ? encoder.encode(albumTitle)
    : new Uint8Array();
  const artworkBytes = albumArt.bytes;

  const totalLength =
    32 + mimeBytes.length + descriptionBytes.length + artworkBytes.length;

  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint32(offset, 3); // front cover
  offset += 4;

  view.setUint32(offset, mimeBytes.length);
  offset += 4;
  new Uint8Array(buffer, offset, mimeBytes.length).set(mimeBytes);
  offset += mimeBytes.length;

  view.setUint32(offset, descriptionBytes.length);
  offset += 4;
  new Uint8Array(buffer, offset, descriptionBytes.length).set(descriptionBytes);
  offset += descriptionBytes.length;

  view.setUint32(offset, albumArt.width ?? 0);
  offset += 4;

  view.setUint32(offset, albumArt.height ?? 0);
  offset += 4;

  view.setUint32(offset, 24);
  offset += 4;

  view.setUint32(offset, 0);
  offset += 4;

  view.setUint32(offset, artworkBytes.length);
  offset += 4;
  new Uint8Array(buffer, offset, artworkBytes.length).set(artworkBytes);

  return new Uint8Array(buffer);
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}
