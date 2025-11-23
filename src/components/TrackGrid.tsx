"use client";

import { useRef } from "react";
import SourceGrid from "@/components/SourceGrid";
import { Track } from "@/types";
import { SOURCE_EXTENSION, SOURCE_EXTENSION_REGEX } from "@/lib/constants";
import {
  TbDownload,
  TbPlus,
  TbPlayerPlay,
  TbWorldDownload,
} from "react-icons/tb";

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " B";
}

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TrackGridProps {
  tracks: Track[];
  onPlayTrack: (url: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList) => void;
  onOpenWebDav: () => void;
  audioError: string | null;
  onPlayAll?: () => void;
}

export default function TrackGrid({
  tracks,
  onPlayTrack,
  onDrop,
  onDragOver,
  onFileSelect,
  onOpenWebDav,
  audioError,
  onPlayAll,
}: TrackGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  const totalSize = tracks.reduce((sum, t) => sum + t.file.size, 0);
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const downloadableTracks = tracks.filter((t) => t.url);

  const handleDownloadAll = () => {
    downloadableTracks.forEach((track) => {
      const a = document.createElement("a");
      a.href = track.url!;
      a.download = track.meta?.musicName
        ? `${track.meta.artist?.map((ar) => ar[0]).join(" ")} - ${
            track.meta.musicName
          }.${track.meta.format || "mp3"}`
        : track.file.name.replace(
            SOURCE_EXTENSION_REGEX,
            `.${track.meta?.format || "mp3"}`
          );
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div
        className="min-h-[calc(100vh-200px)]"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {audioError && (
          <div className="mb-6 p-6 bg-red-500/10 text-red-200 rounded-2xl text-center font-semibold border border-red-500/20 backdrop-blur-sm">
            {audioError}
          </div>
        )}
        <div className="space-y-8">
          <div className="flex flex-col gap-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-5 shadow-xl">
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-base font-semibold text-white/70">
                  Files:
                </span>{" "}
                {tracks.length}
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-base font-semibold text-white/70">
                  Total Size:
                </span>{" "}
                {formatSize(totalSize)}
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-base font-semibold text-white/70">
                  Total Duration:
                </span>{" "}
                {formatDuration(totalDuration)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleFileSelect}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <TbPlus className="w-5 h-5" /> Add More Files
              </button>
              <button
                onClick={onOpenWebDav}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-white/90 font-semibold hover:bg-white/5 transition-all"
              >
                <TbWorldDownload className="w-5 h-5" /> Load from WebDAV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={SOURCE_EXTENSION}
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              {downloadableTracks.length > 0 && onPlayAll && (
                <button
                  onClick={onPlayAll}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <TbPlayerPlay className="w-5 h-5" /> Play All
                </button>
              )}
              {downloadableTracks.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <TbDownload className="w-5 h-5" /> Download All
                </button>
              )}
            </div>
          </div>
          <SourceGrid tracks={tracks} onPlayTrack={onPlayTrack} />
        </div>
      </div>
    </main>
  );
}
