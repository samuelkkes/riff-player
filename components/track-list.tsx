"use client"

import { AnimatePresence, motion } from "motion/react"
import { PlayIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr"

import { formatTime } from "@/lib/format"
import { usePlayer } from "@/lib/player-context"
import type { Track } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CoverArt } from "@/components/cover-art"
import { EqualizerBars } from "@/components/equalizer-bars"

function TrackRow({ track, index }: { track: Track; index: number }) {
  const { currentId, isPlaying, playTrack, removeTrack } = usePlayer()
  const isCurrent = track.id === currentId
  const isActive = isCurrent && isPlaying

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, height: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.03, 0.3),
        ease: "easeOut",
      }}
      onDoubleClick={() => playTrack(track.id)}
      className={cn(
        "group hover:bg-accent flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors",
        isCurrent && "bg-accent"
      )}
    >
      <div className="flex w-6 shrink-0 items-center justify-center">
        <span
          className={cn(
            "text-muted-foreground text-sm tabular-nums",
            isCurrent ? "hidden" : "group-hover:hidden"
          )}
        >
          {index + 1}
        </span>
        {isActive ? (
          <EqualizerBars playing className="size-4" />
        ) : isCurrent ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => playTrack(track.id)}
            aria-label={`Play ${track.title}`}
          >
            <PlayIcon weight="fill" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="hidden size-6 group-hover:flex"
            onClick={() => playTrack(track.id)}
            aria-label={`Play ${track.title}`}
          >
            <PlayIcon weight="fill" />
          </Button>
        )}
      </div>

      <CoverArt src={track.artwork} alt={track.album} className="size-10" />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            isCurrent && "text-primary"
          )}
        >
          {track.title}
        </p>
        <p className="text-muted-foreground truncate text-xs">{track.artist}</p>
      </div>

      <p className="text-muted-foreground hidden truncate text-sm sm:block sm:max-w-40">
        {track.album}
      </p>

      <span className="text-muted-foreground w-12 shrink-0 text-right text-sm tabular-nums">
        {track.duration ? formatTime(track.duration) : "--:--"}
      </span>

      <Button
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => removeTrack(track.id)}
        aria-label={`Remove ${track.title}`}
      >
        <TrashIcon />
      </Button>
    </motion.div>
  )
}

export function TrackList() {
  const { tracks } = usePlayer()

  return (
    <div className="flex flex-col gap-0.5 p-2">
      <AnimatePresence initial={false}>
        {tracks.map((track, index) => (
          <TrackRow key={track.id} track={track} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}
