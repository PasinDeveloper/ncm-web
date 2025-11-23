'use client';

import Image from 'next/image';
import { TrackCardProps } from '@/types';
import { TbClock, TbDatabase, TbMusic, TbWaveSine, TbPlayerPlay, TbDownload } from 'react-icons/tb';

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return bytes + ' B';
}

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatBitrate(bytes: number, duration?: number) {
  if (!duration || duration === 0) return '--';
  return ((bytes * 8) / duration / 1000).toFixed(0);
}

function formatSampleRate(sampleRate?: number) {
  if (!sampleRate) return '--';
  return `${sampleRate}`;
}

export default function TrackCard({ track, onPlayTrack }: TrackCardProps) {
  const getTrackName = () => {
    if (track.meta?.musicName && track.meta?.artist) {
      return `${track.meta.artist.map(ar => ar[0]).join('/')} - ${track.meta.musicName}`;
    }
    return track.file.name.slice(0, -4);
  };

  const getAlbumName = () => {
    return track.meta?.album || 'Unknown Album';
  };

  const getDownloadName = () => {
    if (track.meta?.format) {
      return track.file.name.slice(0, -3) + track.meta.format;
    }
    return track.file.name;
  };

  const getAlbumPic = () => {
    return track.meta?.albumPic || '/api/placeholder-album';
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (track.url) {
      onPlayTrack(track.url);
    }
  };

  const isProcessing = !track.url && !track.meta;

  return (
    <div className="group relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl hover:bg-white/8 hover:border-white/20 transition-all duration-500 hover:scale-105 overflow-hidden">
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative">
        {/* Album Cover */}
        <div className="relative aspect-square bg-gradient-to-br from-white/10 to-white/5 border-b border-white/10">
          {/* Format Chip Overlay */}
          {track.meta?.format && !isProcessing && (
            <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-800 to-purple-800 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold border border-blue-900 shadow-lg backdrop-blur-md">
              {track.meta.format.toUpperCase()}
            </span>
          )}
          {isProcessing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 animate-pulse">
              <div className="rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 w-2/3 h-2/3" />
              <div className="w-2/3 h-4 bg-white/10 rounded-full" />
              <div className="w-1/2 h-4 bg-white/10 rounded-full" />
              <div className="w-1/3 h-4 bg-white/10 rounded-full" />
            </div>
          ) : (
            <Image
              src={getAlbumPic()}
              alt={getAlbumName()}
              width={400}
              height={400}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder-album';
              }}
            />
          )}
          {/* Overlay with buttons */}
          {track.url && !isProcessing && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
              <div className="flex space-x-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                {/* Play Button */}
                <button
                  onClick={handlePlay}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 shadow-2xl hover:shadow-white/25 hover:scale-110 border border-white/20"
                  title="Play"
                >
                  <TbPlayerPlay className="w-7 h-7 text-white" />
                </button>
                {/* Download Button */}
                <a
                  href={track.url}
                  download={getDownloadName()}
                  className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 shadow-2xl hover:shadow-white/25 hover:scale-110 border border-white/20"
                  title="Download"
                >
                  <TbDownload className="w-7 h-7 text-white" />
                </a>
              </div>
            </div>
          )}
        </div>
        {/* Track Info - Redesigned 2x2 Grid Layout */}
        <div className="p-6">
          {/* Main Track Info */}
          {isProcessing ? (
            <>
              <div className="h-6 w-2/3 bg-white/10 rounded-full mb-2 animate-pulse" />
              <div className="h-4 w-1/2 bg-white/10 rounded-full mb-3 animate-pulse" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
                <div className="h-4 w-3/4 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-2/3 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-1/2 bg-white/10 rounded-full animate-pulse" />
                <div className="h-4 w-1/3 bg-white/10 rounded-full animate-pulse" />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-bold text-white truncate mb-2 text-lg" title={getTrackName()}>
                  {getTrackName()}
                </h3>
                <p className="text-sm text-white/70 truncate mb-3" title={getAlbumName()}>
                  {getAlbumName()}
                </p>
              </div>
              {/* Audio Quality Info 2x2 Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
                {/* Duration */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                    <TbClock className="w-4 h-4 text-blue-300" />
                    <span>Duration</span>
                  </div>
                  <span className="text-base font-bold text-white/90 tabular-nums">{formatDuration(track.duration)}</span>
                </div>
                {/* Size */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                    <TbDatabase className="w-4 h-4 text-purple-300" />
                    <span>Size</span>
                  </div>
                  <span className="text-base font-bold text-white/90 tabular-nums">{formatSize(track.file.size)}</span>
                </div>
                {/* Bitrate */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                    <TbMusic className="w-4 h-4 text-blue-300" />
                    <span>Bitrate</span>
                  </div>
                  <span className="text-base font-bold text-white/90 tabular-nums">{formatBitrate(track.file.size, track.duration)} <span className="text-xs font-normal text-white/60">kbps</span></span>
                </div>
                {/* Sample Rate */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                    <TbWaveSine className="w-4 h-4 text-purple-300" />
                    <span>Sample Rate</span>
                  </div>
                  <span className="text-base font-bold text-white/90 tabular-nums">{formatSampleRate(track.sampleRate)} <span className="text-xs font-normal text-white/60">Hz</span></span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 