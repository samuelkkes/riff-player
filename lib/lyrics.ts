/**
 * Synced-lyrics types and a parser for the LyricsPlus / KPoe API
 * (https://github.com/ibratabian17/lyricsplus). The KPoe `/v2/lyrics/get`
 * endpoint returns either word-synced ("Word") or line-synced ("Line") lyrics.
 */

export interface LyricsWord {
  text: string
  startMs: number
  endMs: number
}

export interface LyricsLine {
  startMs: number
  endMs: number
  text: string
  /** Word/syllable timings (one entry holding the whole line when line-synced). */
  words: LyricsWord[]
}

export interface LyricsResult {
  source: string
  /** True when at least one line has per-word timing. */
  wordSynced: boolean
  lines: LyricsLine[]
}

/** Public KPoe servers, tried in order by the proxy route. */
export const KPOE_SERVERS = [
  "https://lyricsplus.prjktla.workers.dev",
  "https://lyricsplus.binimum.org",
  "https://lyricsplus-seven.vercel.app",
  "https://lyrics-plus-backend.vercel.app",
]

/**
 * KPoe encodes times as either integer milliseconds or fractional seconds.
 * Mirrors the reference client's `toMilliseconds`.
 */
function toMs(value: unknown, fallback = 0): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  if (!Number.isInteger(num)) return Math.round(num * 1000)
  return Math.max(0, Math.round(num))
}

export function parseKPoeLyrics(payload: unknown): LyricsResult | null {
  if (!payload || typeof payload !== "object") return null
  // The KPoe payload is untyped external JSON; we narrow defensively below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = payload as Record<string, any>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] | null = Array.isArray(p.lyrics)
    ? p.lyrics
    : Array.isArray(p.data?.lyrics)
      ? p.data.lyrics
      : Array.isArray(p.data)
        ? p.data
        : null
  if (!raw || raw.length === 0) return null

  const isLineType = p.type === "Line" || p.type === "line"
  const source: string =
    p.metadata?.source || p.metadata?.provider || "LyricsPlus (KPoe)"

  let wordSynced = false
  const lines: LyricsLine[] = []

  for (const entry of raw) {
    if (!entry) continue
    const start = toMs(entry.time)
    const dur = toMs(entry.duration)
    const end = toMs(entry.endTime) || start + dur
    const lineText = typeof entry.text === "string" ? entry.text : ""

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSyl: any[] = Array.isArray(entry.syllabus)
      ? entry.syllabus
      : Array.isArray(entry.words)
        ? entry.words
        : []

    const words: LyricsWord[] = []
    if (!isLineType) {
      for (const syl of rawSyl) {
        if (!syl || syl.isBackground) continue // skip backing vocals for clarity
        const text = typeof syl.text === "string" ? syl.text : ""
        if (!text) continue
        const ws = toMs(syl.time, start)
        const wd = toMs(syl.duration)
        words.push({ text, startMs: ws, endMs: wd ? ws + wd : end })
      }
    }

    if (words.length > 1) wordSynced = true

    if (words.length === 0) {
      // Line-synced (or empty syllabus): one word spanning the whole line.
      words.push({ text: lineText, startMs: start, endMs: end || start })
    }

    const text = lineText || words.map((w) => w.text).join("")
    lines.push({ startMs: start, endMs: end, text, words })
  }

  if (lines.length === 0) return null
  return { source, wordSynced, lines }
}
