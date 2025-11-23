export interface Track {
  id: number;
  file: File;
  meta?: {
    musicId?: number;
    musicName?: string;
    artist?: [string, number][];
    album?: string;
    format?: "flac" | "mp3";
    albumPic?: string;
  };
  url?: string;
  duration?: number; // in seconds
  sampleRate?: number; // in Hz
  bitrate?: number; // in kbps
}

export interface AudioPlayerProps {
  track: Track;
  src: string | null;
  playlist?: Track[];
  playlistIndex?: number;
  onPlaylistChange?: (index: number) => void;
  onError?: () => void;
  shouldAutoPlay?: boolean;
  setShouldAutoPlay?: (v: boolean) => void;
}

export interface TrackCardProps {
  track: Track;
  onPlayTrack: (url: string) => void;
}

export interface SourceGridProps {
  tracks: Track[];
  onPlayTrack: (url: string) => void;
}

export type WebDavProtocol = "http" | "https";

export interface WebDavConfig {
  serverUrl: string;
  directory: string;
  username?: string;
  password?: string;
  protocol: WebDavProtocol;
  port: string;
}

export interface WebDavEntry {
  type: "directory" | "file";
  filename?: string;
  basename?: string;
  size?: number | null;
  lastmod?: string | null;
}
