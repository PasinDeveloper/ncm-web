"use client";

import { useState, useRef, useEffect } from "react";
import { produce } from "immer";
import { parseBlob } from "music-metadata-browser";
import { Track, WebDavConfig, WebDavEntry } from "@/types";
import ErrorBoundary from "@/components/ErrorBoundary";
import Header from "@/components/Header";
import UploadArea from "@/components/UploadArea";
import FeaturesSection from "@/components/FeaturesSection";
import CreditsSection from "@/components/CreditsSection";
import TrackGrid from "@/components/TrackGrid";
import AudioPlayer from "@/components/AudioPlayer";
import WebDavModal from "@/components/WebDavModal";
import {
  normalizeWebDavPath,
  getParentWebDavPath,
  composeWebDavServerUrl,
  parseWebDavServerUrl,
  WEB_DAV_DEFAULT_PORT,
  WEB_DAV_DEFAULT_PROTOCOL,
} from "@/lib/webdav";
import { SOURCE_EXTENSION } from "@/lib/constants";
import { embedAlbumArtIntoAudio } from "@/lib/embedArtwork";
import { fetchAlbumArt } from "@/lib/albumArt";

interface WebDavListResponse {
  path: string;
  entries: WebDavEntry[];
}

interface WebDavDownloadResponse {
  files: { name: string; mime: string; base64: string }[];
}

const WEB_DAV_STORAGE_KEY = "webdav-credentials";

type StoredWebDavCredentials = Pick<
  WebDavConfig,
  "serverUrl" | "username" | "password" | "directory" | "protocol" | "port"
>;

let globalTrackId = 0;

const normalizeWebDavConfigShape = (config: WebDavConfig): WebDavConfig => {
  const parsed = parseWebDavServerUrl(
    config.serverUrl,
    config.protocol || WEB_DAV_DEFAULT_PROTOCOL,
    config.port
  );
  const protocol = config.protocol || parsed.protocol;
  const port = config.port || parsed.port;
  return {
    ...config,
    serverUrl: parsed.address,
    protocol: protocol || WEB_DAV_DEFAULT_PROTOCOL,
    port: port || WEB_DAV_DEFAULT_PORT[protocol || WEB_DAV_DEFAULT_PROTOCOL],
  };
};

const resolveWebDavServerUrl = (config: WebDavConfig) => {
  const protocol = config.protocol || WEB_DAV_DEFAULT_PROTOCOL;
  const port = config.port || WEB_DAV_DEFAULT_PORT[protocol];
  return composeWebDavServerUrl(config.serverUrl, protocol, port);
};

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [playlist, setPlaylist] = useState<Track[] | null>(null);
  const [playlistIndex, setPlaylistIndex] = useState<number | null>(null);
  const [isWebDavModalOpen, setIsWebDavModalOpen] = useState(false);
  const [webDavConfig, setWebDavConfig] = useState<WebDavConfig>({
    serverUrl: "",
    directory: "/",
    username: "",
    password: "",
    protocol: WEB_DAV_DEFAULT_PROTOCOL,
    port: WEB_DAV_DEFAULT_PORT[WEB_DAV_DEFAULT_PROTOCOL],
  });
  const [webDavEntries, setWebDavEntries] = useState<WebDavEntry[] | null>(
    null
  );
  const [webDavCurrentPath, setWebDavCurrentPath] = useState("/");
  const [webDavSelectedPath, setWebDavSelectedPath] = useState<string | null>(
    null
  );
  const [webDavListingLoading, setWebDavListingLoading] = useState(false);
  const [webDavFetching, setWebDavFetching] = useState(false);
  const [webDavError, setWebDavError] = useState<string | null>(null);
  const [rememberWebDavCreds, setRememberWebDavCreds] = useState(false);
  const [hasSavedWebDavCreds, setHasSavedWebDavCreds] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const rememberWebDavRef = useRef(false);

  useEffect(() => {
    setCurrentTrack(null);
    setAudioError(null);
    if (!workerRef.current) {
      workerRef.current = new Worker("/workers/source-worker.js");
      console.log("Worker created");
    }
    const worker = workerRef.current;
    worker.onmessage = async (e) => {
      console.log("Worker message:", e.data);
      const { id, type, payload } = e.data as {
        id: number;
        type: "error" | "data";
        payload: {
          meta?: Track["meta"];
          audioBuffer?: ArrayBuffer;
          mimeType?: string;
          format?: "mp3" | "flac";
        };
      };
      if (type === "error") {
        alert(`Error: file is not a valid NCM file.`);
        return;
      }

      if (type !== "data") return;

      const { meta, audioBuffer, mimeType, format } = payload;
      let taggedBlob: Blob | null = null;
      let objectUrl: string | null = null;
      let previousUrl: string | undefined;

      if (audioBuffer instanceof ArrayBuffer) {
        try {
          const albumArt = await fetchAlbumArt(meta?.albumPic);
          const taggedBuffer = await embedAlbumArtIntoAudio({
            buffer: audioBuffer,
            format,
            meta,
            albumArt,
          });
          taggedBlob = new Blob([taggedBuffer], {
            type: mimeType || "application/octet-stream",
          });
        } catch (err) {
          console.error("Album art embedding failed:", err);
          taggedBlob = new Blob([audioBuffer], {
            type: mimeType || "application/octet-stream",
          });
        }

        objectUrl = URL.createObjectURL(taggedBlob);
      }

      setTracks((prevTracks) =>
        produce(prevTracks, (draft) => {
          const trackIndex = draft.findIndex((t) => t.id === id);
          if (trackIndex === -1) return;
          if (meta) {
            draft[trackIndex].meta = meta;
          }
          if (objectUrl) {
            previousUrl = draft[trackIndex].url || undefined;
            draft[trackIndex].url = objectUrl;
          }
        })
      );

      if (previousUrl && previousUrl !== objectUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      if (taggedBlob) {
        try {
          const metadata = await parseBlob(taggedBlob);
          setTracks((prevTracks) =>
            produce(prevTracks, (draft) => {
              const trackIndex = draft.findIndex((t) => t.id === id);
              if (trackIndex === -1) return;
              if (metadata.format.duration)
                draft[trackIndex].duration = metadata.format.duration;
              if (metadata.format.sampleRate)
                draft[trackIndex].sampleRate = metadata.format.sampleRate;
              if (metadata.format.bitrate)
                draft[trackIndex].bitrate = Math.round(
                  metadata.format.bitrate / 1000
                );
            })
          );
        } catch (err) {
          console.error("Error parsing metadata:", err);
        }
      }
    };
    worker.onerror = (e) => {
      console.error("Worker error:", e);
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(WEB_DAV_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as StoredWebDavCredentials;
      const parsed = parseWebDavServerUrl(
        saved.serverUrl || "",
        saved.protocol || WEB_DAV_DEFAULT_PROTOCOL,
        saved.port
      );
      setWebDavConfig((prev) => ({
        ...prev,
        serverUrl: parsed.address,
        directory: saved.directory || prev.directory || "/",
        username: saved.username || "",
        password: saved.password || "",
        protocol:
          saved.protocol ||
          parsed.protocol ||
          prev.protocol ||
          WEB_DAV_DEFAULT_PROTOCOL,
        port:
          saved.port ||
          parsed.port ||
          prev.port ||
          WEB_DAV_DEFAULT_PORT[prev.protocol],
      }));
      rememberWebDavRef.current = true;
      setRememberWebDavCreds(true);
      setHasSavedWebDavCreds(true);
    } catch (err) {
      console.error("Failed to load WebDAV credentials", err);
    }
  }, []);

  const persistWebDavCredentials = (config: WebDavConfig) => {
    if (typeof window === "undefined") return;
    const resolvedUrl = resolveWebDavServerUrl(config);
    if (!resolvedUrl) return;
    const protocol = config.protocol || WEB_DAV_DEFAULT_PROTOCOL;
    const port = config.port || WEB_DAV_DEFAULT_PORT[protocol];
    const payload: StoredWebDavCredentials = {
      serverUrl: resolvedUrl,
      username: config.username || "",
      password: config.password || "",
      directory: config.directory || "/",
      protocol,
      port,
    };
    window.localStorage.setItem(WEB_DAV_STORAGE_KEY, JSON.stringify(payload));
    setHasSavedWebDavCreds(true);
  };

  const updateWebDavConfig = (
    updater: WebDavConfig | ((prev: WebDavConfig) => WebDavConfig)
  ) => {
    setWebDavConfig((prev) => {
      const rawNext =
        typeof updater === "function"
          ? (updater as (prev: WebDavConfig) => WebDavConfig)(prev)
          : updater;
      const next = normalizeWebDavConfigShape(rawNext);
      if (rememberWebDavRef.current && resolveWebDavServerUrl(next)) {
        persistWebDavCredentials(next);
      }
      return next;
    });
  };

  const handleRememberCredentialsChange = (value: boolean) => {
    rememberWebDavRef.current = value;
    setRememberWebDavCreds(value);
    if (value) {
      persistWebDavCredentials(webDavConfig);
    }
  };

  const handleClearSavedCredentials = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(WEB_DAV_STORAGE_KEY);
    }
    rememberWebDavRef.current = false;
    setRememberWebDavCreds(false);
    setHasSavedWebDavCreds(false);
    updateWebDavConfig((prev) => ({
      ...prev,
      username: "",
      password: "",
    }));
  };

  const handleWebDavConfigChange = (config: WebDavConfig) => {
    updateWebDavConfig(config);
  };

  const handleFiles = (fileList: FileList) => {
    console.log("handleFiles called with:", fileList.length, "files");

    const files = [...fileList]
      .filter((f) => f.name.toLowerCase().endsWith(SOURCE_EXTENSION))
      .map((file) => ({
        id: ++globalTrackId,
        file,
      }));

    console.log("Filtered files:", files.length);

    setTracks((prevTracks) =>
      produce(prevTracks, (draft) => {
        files.forEach((file) => draft.push(file));
      })
    );

    if (workerRef.current) {
      workerRef.current.postMessage(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    console.log("handleDrop called");
    e.preventDefault();
    e.stopPropagation();
    console.log("Files dropped:", e.dataTransfer.files.length);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePlayTrack = (url: string) => {
    const track = tracks.find((t) => t.url === url) || null;
    setCurrentTrack(track);
    setPlaylist(null);
    setPlaylistIndex(null);
    setAudioError(null);
    setShouldAutoPlay(true);
  };

  const handlePlayAll = () => {
    const playable = tracks.filter((t) => t.url);
    if (playable.length > 0) {
      setPlaylist(playable);
      setPlaylistIndex(0);
      setCurrentTrack(playable[0]);
      setShouldAutoPlay(true);
    }
  };

  const handlePlaylistChange = (index: number) => {
    if (playlist && playlist[index]) {
      setPlaylistIndex(index);
      setCurrentTrack(playlist[index]);
      setShouldAutoPlay(true);
    }
  };

  const handleAudioError = () => {
    setAudioError("Audio playback failed. Please re-upload your file.");
    setCurrentTrack(null);
  };

  const handleWebDavSelectPath = (path: string) => {
    const normalized = normalizeWebDavPath(path);
    setWebDavSelectedPath(normalized);
    updateWebDavConfig((prev) => ({ ...prev, directory: normalized }));
  };

  const handleWebDavBrowse = async (
    configOverride?: WebDavConfig,
    pathOverride?: string
  ) => {
    if (webDavFetching) return;
    const effectiveConfig = configOverride
      ? normalizeWebDavConfigShape({ ...webDavConfig, ...configOverride })
      : webDavConfig;
    const resolvedServerUrl = resolveWebDavServerUrl(effectiveConfig);
    if (!resolvedServerUrl) {
      setWebDavError("Please provide a WebDAV server URL.");
      return;
    }

    const targetPath = normalizeWebDavPath(
      pathOverride ?? effectiveConfig.directory ?? "/"
    );

    setWebDavListingLoading(true);
    setWebDavError(null);

    try {
      updateWebDavConfig((prev) => ({ ...prev, ...effectiveConfig }));

      const response = await fetch("/api/webdav/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverUrl: resolvedServerUrl,
          directory: targetPath,
          username: effectiveConfig.username,
          password: effectiveConfig.password,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          (payload && typeof payload === "object" && "error" in payload
            ? (payload as { error?: string }).error
            : null) || "Failed to list WebDAV directory."
        );
      }

      const data = payload as WebDavListResponse;

      const nextPath = data.path || targetPath;
      setWebDavEntries((data.entries || []) as WebDavEntry[]);
      setWebDavCurrentPath(nextPath);
      setWebDavSelectedPath(nextPath);
      updateWebDavConfig((prev) => ({
        ...prev,
        ...effectiveConfig,
        directory: nextPath,
      }));
    } catch (err) {
      console.error("WebDAV directory listing failed", err);
      setWebDavError(
        err instanceof Error ? err.message : "Failed to list WebDAV directory."
      );
    } finally {
      setWebDavListingLoading(false);
    }
  };

  const handleWebDavGoUp = () => {
    if (webDavListingLoading || webDavFetching) return;
    const parent = getParentWebDavPath(webDavCurrentPath);
    handleWebDavBrowse(webDavConfig, parent);
  };

  const openWebDavModal = () => {
    setWebDavError(null);
    setWebDavEntries(null);
    const normalized = normalizeWebDavPath(webDavConfig.directory);
    setWebDavCurrentPath(normalized);
    setWebDavSelectedPath(null);
    setIsWebDavModalOpen(true);
  };

  const closeWebDavModal = () => {
    if (webDavListingLoading || webDavFetching) return;
    setIsWebDavModalOpen(false);
  };

  const handleWebDavSubmit = async (config: WebDavConfig) => {
    if (typeof window === "undefined") return;

    const effectiveConfig = normalizeWebDavConfigShape({
      ...webDavConfig,
      ...config,
    });
    const resolvedServerUrl = resolveWebDavServerUrl(effectiveConfig);

    if (!resolvedServerUrl) {
      setWebDavError("Please provide a WebDAV server URL.");
      return;
    }

    const normalizedDir = normalizeWebDavPath(
      webDavSelectedPath ||
        effectiveConfig.directory ||
        webDavCurrentPath ||
        "/"
    );

    updateWebDavConfig((prev) => ({
      ...prev,
      ...effectiveConfig,
      directory: normalizedDir,
    }));

    setWebDavSelectedPath(normalizedDir);
    setWebDavFetching(true);
    setWebDavError(null);

    try {
      const response = await fetch("/api/webdav/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serverUrl: resolvedServerUrl,
          directory: normalizedDir,
          username: effectiveConfig.username,
          password: effectiveConfig.password,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          (payload && typeof payload === "object" && "error" in payload
            ? (payload as { error?: string }).error
            : null) || "Failed to download files."
        );
      }

      const data = payload as WebDavDownloadResponse;

      const remoteFiles: File[] = (data.files || []).map(
        (file: { name: string; mime: string; base64: string }) => {
          const byteString = atob(file.base64);
          const byteNumbers = new Array(byteString.length);
          for (let i = 0; i < byteString.length; i += 1) {
            byteNumbers[i] = byteString.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: file.mime });
          return new File([blob], file.name, { type: file.mime });
        }
      );

      if (remoteFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        remoteFiles.forEach((file: File) => dataTransfer.items.add(file));
        handleFiles(dataTransfer.files);
        setIsWebDavModalOpen(false);
      }
    } catch (err) {
      console.error("WebDAV load failed", err);
      setWebDavError(
        err instanceof Error ? err.message : "Failed to load files from WebDAV."
      );
    } finally {
      setWebDavFetching(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen pb-32 bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white font-sans relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <Header />

        {tracks.length === 0 ? (
          <>
            <UploadArea
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onFileSelect={handleFiles}
              onOpenWebDav={openWebDavModal}
            />
            <FeaturesSection />
            <CreditsSection />
          </>
        ) : (
          <TrackGrid
            tracks={tracks}
            onPlayTrack={handlePlayTrack}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onFileSelect={handleFiles}
            onOpenWebDav={openWebDavModal}
            audioError={audioError}
            onPlayAll={handlePlayAll}
          />
        )}

        {/* Audio Player */}
        {currentTrack && (
          <AudioPlayer
            track={currentTrack}
            src={currentTrack.url || ""}
            playlist={playlist || undefined}
            playlistIndex={playlistIndex ?? undefined}
            onPlaylistChange={handlePlaylistChange}
            onError={handleAudioError}
            shouldAutoPlay={shouldAutoPlay}
            setShouldAutoPlay={setShouldAutoPlay}
          />
        )}

        <WebDavModal
          isOpen={isWebDavModalOpen}
          config={webDavConfig}
          onConfigChange={handleWebDavConfigChange}
          onSubmit={handleWebDavSubmit}
          onClose={closeWebDavModal}
          entries={webDavEntries}
          currentPath={webDavCurrentPath}
          selectedPath={webDavSelectedPath}
          onBrowse={handleWebDavBrowse}
          onSelectPath={handleWebDavSelectPath}
          onGoUp={handleWebDavGoUp}
          isListing={webDavListingLoading}
          isFetching={webDavFetching}
          rememberCredentials={rememberWebDavCreds}
          hasSavedCredentials={hasSavedWebDavCreds}
          onRememberChange={handleRememberCredentialsChange}
          onClearSaved={handleClearSavedCredentials}
          error={webDavError}
        />
      </div>
    </ErrorBoundary>
  );
}
