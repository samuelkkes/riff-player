"use client"

import { AnimatePresence, motion } from "motion/react"
import {
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  RepeatOnceIcon,
  ShuffleIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SpeakerHighIcon,
  SpeakerLowIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react/dist/ssr"

import { formatTime } from "@/lib/format"
import { usePlayer } from "@/lib/player-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CoverArt } from "@/components/cover-art"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer()

  const VolumeIcon = muted || volume === 0
    ? SpeakerSlashIcon
    : volume < 0.5
      ? SpeakerLowIcon
      : SpeakerHighIcon

  return (
    <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-t backdrop-blur">
      {/* Mobile seek bar (full width, on top) */}
      <div className="flex items-center gap-2 px-3 pt-2 md:hidden">
        <span className="text-muted-foreground w-9 text-right text-[11px] tabular-nums">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration || 0}
          step={1}
          disabled={!currentTrack}
          onValueChange={([v]) => seek(v)}
          aria-label="Seek"
          className="flex-1"
        />
        <span className="text-muted-foreground w-9 text-[11px] tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 md:grid-cols-[1fr_2fr_1fr] md:gap-4 md:px-4 md:py-3">
        {/* Now playing */}
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            key={currentTrack?.artwork ?? currentTrack?.id ?? "empty"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <CoverArt
              src={currentTrack?.artwork}
              alt={currentTrack?.album}
              className="size-12"
            />
          </motion.div>
          <div className="min-w-0 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentTrack?.id ?? "empty"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-w-0"
              >
                <p className="truncate text-sm font-medium">
                  {currentTrack?.title ?? "Nothing playing"}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {currentTrack?.artist ?? "Pick a track to start"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Transport + seek */}
        <div className="flex w-full max-w-2xl flex-col items-center gap-1.5 lg:max-w-3xl">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleShuffle}
                  aria-pressed={shuffle}
                  aria-label="Shuffle"
                  className={cn("hidden md:inline-flex", shuffle && "text-primary")}
                >
                  <ShuffleIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Shuffle</TooltipContent>
            </Tooltip>

            <Button
              size="icon"
              variant="ghost"
              onClick={previous}
              disabled={!currentTrack}
              aria-label="Previous"
            >
              <SkipBackIcon weight="fill" />
            </Button>

            <Button
              size="icon"
              className="size-10 rounded-full"
              aria-label={isPlaying ? "Pause" : "Play"}
              asChild
            >
              <motion.button
                onClick={togglePlay}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={isPlaying ? "pause" : "play"}
                    initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                    transition={{ duration: 0.18 }}
                    className="flex"
                  >
                    {isPlaying ? (
                      <PauseIcon weight="fill" />
                    ) : (
                      <PlayIcon weight="fill" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={next}
              disabled={!currentTrack}
              aria-label="Next"
            >
              <SkipForwardIcon weight="fill" />
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={cycleRepeat}
                  aria-pressed={repeat !== "off"}
                  aria-label={`Repeat: ${repeat}`}
                  className={cn(
                    "hidden md:inline-flex",
                    repeat !== "off" && "text-primary"
                  )}
                >
                  {repeat === "one" ? <RepeatOnceIcon /> : <RepeatIcon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {repeat === "off"
                  ? "Repeat off"
                  : repeat === "all"
                    ? "Repeat all"
                    : "Repeat one"}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="hidden w-full items-center gap-2 md:flex">
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 0}
              step={1}
              disabled={!currentTrack}
              onValueChange={([v]) => seek(v)}
              aria-label="Seek"
              className="flex-1"
            />
            <span className="text-muted-foreground w-10 text-xs tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <VolumeIcon />
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={([v]) => setVolume(v)}
            aria-label="Volume"
            className="w-28"
          />
        </div>
      </div>
    </footer>
  )
}
