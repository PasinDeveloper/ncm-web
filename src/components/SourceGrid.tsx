"use client";

import { SourceGridProps } from "@/types";
import TrackCard from "./TrackCard";

export default function SourceGrid({ tracks, onPlayTrack }: SourceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} onPlayTrack={onPlayTrack} />
      ))}
    </div>
  );
}
