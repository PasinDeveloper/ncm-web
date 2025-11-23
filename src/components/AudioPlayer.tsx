'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { AudioPlayerProps } from '@/types';
import { TbPlayerPlay, TbPlayerPause, TbVolume, TbVolumeOff, TbPlayerTrackNext, TbPlayerTrackPrev } from 'react-icons/tb';

export default function AudioPlayer({ track, src, playlist, playlistIndex, onPlaylistChange, onError, shouldAutoPlay, setShouldAutoPlay }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [titleOverflow, setTitleOverflow] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted, src]);

  useEffect(() => {
    if (shouldAutoPlay && src && audioRef.current) {
      audioRef.current.play();
      if (setShouldAutoPlay) {
        setShouldAutoPlay(false);
      }
    }
  }, [shouldAutoPlay, src, setShouldAutoPlay]);

  // Check if title/artist overflows
  const titleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      setTitleOverflow(el.scrollWidth > el.clientWidth);
    }
  }, [track]);

  const handlePlayPause = () => {
    if (audioRef.current && src) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    // Playlist support: auto-advance
    if (playlist && typeof playlistIndex === 'number' && onPlaylistChange) {
      if (playlistIndex < playlist.length - 1) {
        onPlaylistChange(playlistIndex + 1);
      }
    }
  };

  const handlePrev = () => {
    if (playlist && typeof playlistIndex === 'number' && onPlaylistChange) {
      if (playlistIndex > 0) {
        onPlaylistChange(playlistIndex - 1);
      }
    }
  };

  const handleNext = () => {
    if (playlist && typeof playlistIndex === 'number' && onPlaylistChange) {
      if (playlistIndex < playlist.length - 1) {
        onPlaylistChange(playlistIndex + 1);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Track info helpers
  const getTrackName = () => {
    if (track.meta?.musicName && track.meta?.artist) {
      return `${track.meta.artist.map(ar => ar[0]).join('/')} - ${track.meta.musicName}`;
    }
    return track.file.name.slice(0, -4);
  };

  const getAlbumName = () => {
    return track.meta?.album || 'Unknown Album';
  };

  const getAlbumPic = () => {
    return track.meta?.albumPic || '/api/placeholder-album';
  };

  const getFormat = () => {
    return track.meta?.format ? track.meta.format.toUpperCase() : '';
  };

  const isProcessing = !track.url && !track.meta;

  if (!src && !isProcessing) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-10 py-3 flex items-center space-x-7 min-w-[1184px] max-w-[1184px]">
        {/* Album Cover or Skeleton */}
        <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-xl flex items-center justify-center">
          {isProcessing ? (
            <div className="w-full h-full flex flex-col items-center justify-center animate-pulse gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 w-3/4 h-3/4" />
            </div>
          ) : (
            <Image
              src={getAlbumPic()}
              alt={getAlbumName()}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder-album';
              }}
            />
          )}
        </div>
        {/* Track Info or Skeleton */}
        <div className="flex-1 min-w-[300px]">
          {isProcessing ? (
            <>
              <div className="h-7 w-2/3 bg-white/10 rounded-full mb-2 animate-pulse" />
              <div className="h-5 w-1/2 bg-white/10 rounded-full mb-2 animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-center space-x-1">
                <div
                  ref={titleRef}
                  className={`font-bold text-white truncate min-w-[250px] ${titleOverflow ? 'marquee' : ''}`}
                  style={{ maxWidth: 500 }}
                  title={getTrackName()}
                >
                  {titleOverflow ? (
                    <span className="marquee-content">{getTrackName()}</span>
                  ) : (
                    getTrackName()
                  )}
                </div>
                {getFormat() && (
                  <span className="ml-3 inline-block bg-gradient-to-r from-blue-800 to-purple-800 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold border border-blue-900 shadow-lg backdrop-blur-md">
                    {getFormat()}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/70 truncate mt-1" title={getAlbumName()}>
                {getAlbumName()}
              </p>
            </>
          )}
        </div>
        {/* Player Controls or Skeleton */}
        <div className="flex items-center space-x-3 flex-shrink-0 min-w-[350px]">
          {isProcessing ? (
            <div className="flex items-center gap-8 w-full">
              <div className="w-14 h-14 bg-white/10 rounded-2xl animate-pulse" />
              <div className="w-32 h-4 bg-white/10 rounded-full animate-pulse" />
              <div className="w-20 h-4 bg-white/10 rounded-full animate-pulse" />
            </div>
          ) : (
            <>
              {playlist && typeof playlistIndex === 'number' && (
                <button
                  onClick={handlePrev}
                  disabled={playlistIndex === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm disabled:opacity-40"
                  title="Previous"
                >
                  <TbPlayerTrackPrev className="w-6 h-6" />
                </button>
              )}
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 group"
              >
                {isPlaying ? (
                  <TbPlayerPause className="w-7 h-7" />
                ) : (
                  <TbPlayerPlay className="w-7 h-7" />
                )}
              </button>
              {playlist && typeof playlistIndex === 'number' && (
                <button
                  onClick={handleNext}
                  disabled={playlistIndex === playlist.length - 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm disabled:opacity-40"
                  title="Next"
                >
                  <TbPlayerTrackNext className="w-6 h-6" />
                </button>
              )}
              {/* Progress Bar */}
              <div className="flex-1 min-w-[200px] max-w-[350px]">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-white/60 w-12 text-right font-medium">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider backdrop-blur-sm"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm text-white/60 w-12 font-medium">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
              {/* Volume Control & Mute Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleMuteToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <TbVolumeOff className="w-4 h-4 text-white/70" />
                  ) : (
                    <TbVolume className="w-4 h-4 text-white/70" />
                  )}
                </button>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-2 bg-white/10 rounded-full appearance-none cursor-pointer backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Audio element only if not processing */}
      {!isProcessing && (
        <audio
          ref={audioRef}
          src={src || ''}
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={onError}
          className="hidden"
        />
      )}
    </div>
  );
} 