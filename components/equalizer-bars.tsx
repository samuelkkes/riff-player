import { cn } from "@/lib/utils"

interface EqualizerBarsProps {
  /** When false the bars rest in a flat, static state (paused). */
  playing?: boolean
  className?: string
}

// Per-bar timing + resting height so the four bars stay out of phase. The
// animation itself lives in globals.css (.eq-bar) so it runs via the compositor
// and honors `prefers-reduced-motion` through a real media query.
const BARS = [
  { duration: "0.9s", delay: "0s", static: 0.6 },
  { duration: "1.15s", delay: "0.15s", static: 1 },
  { duration: "0.8s", delay: "0.1s", static: 0.45 },
  { duration: "1.05s", delay: "0.2s", static: 0.8 },
]

/** Four animated bars that mimic an audio equalizer. */
export function EqualizerBars({ playing = true, className }: EqualizerBarsProps) {
  return (
    <div
      className={cn("flex h-4 items-center justify-center gap-0.5", className)}
      aria-hidden
    >
      {BARS.map((bar, i) => (
        <span
          key={i}
          data-playing={playing}
          className="eq-bar bg-primary h-full w-0.5 rounded-full"
          style={
            {
              animationDuration: bar.duration,
              animationDelay: bar.delay,
              "--eq-static": bar.static,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
