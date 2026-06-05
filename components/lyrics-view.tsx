"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  CrosshairSimpleIcon,
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
  seekable,
  blurPx,
  opacity,
  shrink,
  nowMs,
  onSeek,
}: {
  line: LyricsLine
  index: number
  active: boolean
  wordSynced: boolean
  seekable: boolean
  blurPx: number
  opacity: number
  shrink: boolean
  nowMs: number
  onSeek: (seconds: number) => void
}) {
  return (
    <button
      type="button"
      data-line={index}
      disabled={!seekable}
      onClick={() => seekable && onSeek(line.startMs / 1000)}
      style={{ filter: blurPx ? `blur(${blurPx}px)` : undefined, opacity }}
      className={cn(
        "block w-full origin-left text-left text-2xl leading-snug font-semibold text-balance transition-all duration-500 ease-out will-change-[filter,opacity,transform] sm:text-3xl",
        shrink ? "scale-[0.97]" : "scale-100",
        seekable && "hover:!opacity-100 hover:!blur-none",
        !seekable && "cursor-default",
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
  // Guards scroll events fired by our own auto-scroll so they aren't mistaken
  // for the user scrolling.
  const programmatic = React.useRef(false)
  const programmaticTimer = React.useRef(0)
  const [nowMs, setNowMs] = React.useState(0)
  // True once the user scrolls away from the focused line (synced lyrics only).
  const [browsing, setBrowsing] = React.useState(false)

  const synced = result?.synced ?? false
  const lines = result?.lines

  // Scroll a line to the vertical center of the container only (never ancestors).
  const scrollToIndex = React.useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const container = containerRef.current
      if (!container || index < 0) return
      const el = container.querySelector<HTMLElement>(`[data-line="${index}"]`)
      if (!el) return
      const cRect = container.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      const top =
        container.scrollTop +
        (eRect.top - cRect.top) -
        (container.clientHeight - eRect.height) / 2
      programmatic.current = true
      container.scrollTo({ top, behavior })
      window.clearTimeout(programmaticTimer.current)
      programmaticTimer.current = window.setTimeout(
        () => {
          programmatic.current = false
        },
        behavior === "smooth" ? 600 : 50
      )
    },
    []
  )

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

  // Reset browsing mode whenever the track changes.
  React.useEffect(() => {
    const reset = () => setBrowsing(false)
    reset()
  }, [currentTrack?.id])

  const activeIndex = React.useMemo(() => {
    if (!lines || !synced) return -1
    let idx = -1
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].startMs <= nowMs) idx = i
      else break
    }
    return idx
  }, [lines, synced, nowMs])

  // Auto-scroll the active line to center — only while focused (not browsing).
  React.useEffect(() => {
    if (browsing || activeIndex < 0) return
    scrollToIndex(activeIndex, reduceMotion ? "auto" : "smooth")
  }, [activeIndex, browsing, reduceMotion, scrollToIndex])

  const refocus = React.useCallback(() => {
    setBrowsing(false)
    scrollToIndex(activeIndex, reduceMotion ? "auto" : "smooth")
  }, [activeIndex, reduceMotion, scrollToIndex])

  // Any scroll the user initiates (touch, wheel, drag) enters browsing mode.
  const onScroll = React.useCallback(() => {
    if (synced && !programmatic.current) setBrowsing(true)
  }, [synced])

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

  if (status === "empty" || !lines || !result) {
    return (
      <CenteredEmpty
        icon={<MicrophoneStageIcon />}
        title="No lyrics found"
        description={`We couldn't find lyrics for “${currentTrack.title}”.`}
      />
    )
  }

  const focusMode = synced && !browsing
  const showRefocus = synced && browsing && activeIndex >= 0

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={onScroll}
        className={cn(
          "no-scrollbar h-full overflow-y-auto overscroll-contain px-6",
          synced ? "py-[40vh]" : "py-10"
        )}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {lines.map((line, i) => {
            const active = i === activeIndex
            let blurPx = 0
            let opacity = 1
            let shrink = false

            if (focusMode) {
              const distance = activeIndex < 0 ? -1 : Math.abs(i - activeIndex)
              blurPx =
                reduceMotion || distance <= 0
                  ? 0
                  : Math.min(distance * BLUR_PER_LINE, MAX_BLUR)
              opacity = active
                ? 1
                : distance < 0
                  ? 0.5
                  : Math.max(0.22, 0.55 - (distance - 1) * 0.08)
              shrink = distance > 0
            } else if (synced) {
              // Browsing synced lyrics: crisp and readable, light dim on others.
              opacity = active ? 1 : 0.7
            }

            return (
              <LineRow
                key={i}
                line={line}
                index={i}
                active={active}
                wordSynced={result.wordSynced}
                seekable={synced}
                blurPx={blurPx}
                opacity={opacity}
                shrink={shrink}
                nowMs={active ? nowMs : 0}
                onSeek={seek}
              />
            )
          })}
          <p className="text-muted-foreground pt-8 text-center text-xs">
            Lyrics via {result.source} · LyricsPlus (KPoe)
            {!synced && " · unsynced"}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showRefocus && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <motion.button
              type="button"
              onClick={refocus}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-primary text-primary-foreground pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg"
            >
              <CrosshairSimpleIcon weight="bold" />
              Refocus
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
