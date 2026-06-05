"use client"

import * as React from "react"
import {
  MicrophoneStageIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr"

import type { LyricsLine } from "@/lib/lyrics"
import { usePlayer } from "@/lib/player-context"
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion"
import { useLyrics } from "@/lib/use-lyrics"
import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Progressive blur: further from the active line → blurrier and dimmer,
// giving an Apple-Music-style depth-of-field focus on the current line.
const MAX_BLUR = 5 // px
const BLUR_PER_LINE = 1.1

const LineRow = React.memo(function LineRow({
  line,
  index,
  active,
  wordSynced,
  distance,
  reduceMotion,
  nowMs,
  onSeek,
}: {
  line: LyricsLine
  index: number
  active: boolean
  wordSynced: boolean
  /** Distance from the active line (0 = active). -1 means nothing is active yet. */
  distance: number
  reduceMotion: boolean
  nowMs: number
  onSeek: (seconds: number) => void
}) {
  const blur =
    reduceMotion || distance <= 0 ? 0 : Math.min(distance * BLUR_PER_LINE, MAX_BLUR)
  const opacity = active
    ? 1
    : distance < 0
      ? 0.5
      : Math.max(0.22, 0.55 - (distance - 1) * 0.08)

  return (
    <button
      type="button"
      data-line={index}
      onClick={() => onSeek(line.startMs / 1000)}
      style={{
        filter: blur ? `blur(${blur}px)` : undefined,
        opacity,
      }}
      className={cn(
        "block w-full origin-left text-left text-2xl leading-snug font-semibold text-balance transition-all duration-500 ease-out will-change-[filter,opacity,transform] sm:text-3xl",
        active ? "scale-100" : "scale-[0.97] hover:!opacity-80 hover:!blur-none",
        "motion-reduce:transition-none"
      )}
    >
      {wordSynced && active ? (
        line.words.map((w, i) => (
          <span
            key={i}
            className={cn(
              "transition-colors duration-200",
              nowMs >= w.startMs ? "text-foreground" : "text-foreground/35"
            )}
          >
            {w.text}
          </span>
        ))
      ) : (
        <span className={active ? "text-foreground" : ""}>{line.text}</span>
      )}
    </button>
  )
})

function CenteredEmpty({
  icon,
  title,
  description,
  spin,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  spin?: boolean
}) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(spin && "[&_svg]:animate-spin")}
        >
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  )
}

export function LyricsView() {
  const { currentTrack, isPlaying, currentTime, getCurrentTime, seek } =
    usePlayer()
  const { status, result } = useLyrics(currentTrack)
  const reduceMotion = usePrefersReducedMotion()

  const containerRef = React.useRef<HTMLDivElement>(null)
  const userScrolledAt = React.useRef(0)
  const [nowMs, setNowMs] = React.useState(0)

  // Track the live position: rAF while playing, single sync otherwise.
  React.useEffect(() => {
    const sync = () => setNowMs(getCurrentTime() * 1000)
    if (!isPlaying) {
      sync()
      return
    }
    let raf = 0
    const tick = () => {
      sync()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, getCurrentTime, currentTime])

  const lines = result?.lines
  const activeIndex = React.useMemo(() => {
    if (!lines) return -1
    let idx = -1
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].startMs <= nowMs) idx = i
      else break
    }
    return idx
  }, [lines, nowMs])

  // Auto-scroll the active line to the center, unless the user just scrolled.
  React.useEffect(() => {
    if (activeIndex < 0) return
    if (Date.now() - userScrolledAt.current < 4000) return
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-line="${activeIndex}"]`
    )
    el?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    })
  }, [activeIndex, reduceMotion])

  if (!currentTrack) {
    return (
      <CenteredEmpty
        icon={<MicrophoneStageIcon />}
        title="No track playing"
        description="Play a song to see synced lyrics here."
      />
    )
  }

  if (status === "loading") {
    return (
      <CenteredEmpty
        icon={<SpinnerGapIcon />}
        title="Finding lyrics…"
        description={`${currentTrack.title} — ${currentTrack.artist}`}
        spin
      />
    )
  }

  if (status === "error") {
    return (
      <CenteredEmpty
        icon={<WarningCircleIcon />}
        title="Couldn't load lyrics"
        description="The lyrics service may be unavailable. Try again later."
      />
    )
  }

  if (status === "empty" || !lines) {
    return (
      <CenteredEmpty
        icon={<MicrophoneStageIcon />}
        title="No lyrics found"
        description={`We couldn't find lyrics for “${currentTrack.title}”.`}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      onWheel={() => (userScrolledAt.current = Date.now())}
      onTouchMove={() => (userScrolledAt.current = Date.now())}
      className="no-scrollbar h-full overflow-y-auto px-6 py-[45%]"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        {lines.map((line, i) => (
          <LineRow
            key={i}
            line={line}
            index={i}
            active={i === activeIndex}
            wordSynced={result.wordSynced}
            distance={activeIndex < 0 ? -1 : Math.abs(i - activeIndex)}
            reduceMotion={reduceMotion}
            nowMs={i === activeIndex ? nowMs : 0}
            onSeek={seek}
          />
        ))}
        <p className="text-muted-foreground pt-8 text-center text-xs">
          Lyrics via {result.source} · LyricsPlus (KPoe)
        </p>
      </div>
    </div>
  )
}
