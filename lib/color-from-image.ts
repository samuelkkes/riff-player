import {
  Hct,
  MaterialDynamicColors,
  QuantizerCelebi,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeTonalSpot,
  SchemeVibrant,
  Score,
  argbFromRgb,
  hexFromArgb,
} from "@material/material-color-utilities"

/** Material 3 scheme variants, from album-faithful to playfully detached. */
export type SchemeVariant =
  | "fidelity"
  | "content"
  | "vibrant"
  | "expressive"
  | "tonalSpot"

const SCHEMES = {
  fidelity: SchemeFidelity,
  content: SchemeContent,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  tonalSpot: SchemeTonalSpot,
} as const

export interface DerivedPalette {
  /** The MD3 source color extracted from the image, as hex. */
  source: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Extract a single representative "source color" from an image using the same
 * quantize + score pipeline Material Design 3 uses. The image is downscaled
 * first so quantization stays fast.
 */
export async function sourceColorFromImageUrl(url: string): Promise<number> {
  const img = await loadImage(url)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  const MAX = 128
  const scale = Math.min(1, MAX / Math.max(img.width, img.height, 1))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  canvas.width = w
  canvas.height = h
  ctx.drawImage(img, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, w, h)
  const pixels: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) continue // skip transparent
    pixels.push(argbFromRgb(data[i], data[i + 1], data[i + 2]))
  }
  if (pixels.length === 0) return argbFromRgb(128, 128, 128)

  const quantized = QuantizerCelebi.quantize(pixels, 128)
  const ranked = Score.score(quantized)
  return ranked[0] ?? argbFromRgb(128, 128, 128)
}

/**
 * Build a full set of role colors from a source color using Material 3's
 * **Expressive** scheme — higher chroma and a tertiary hue intentionally shifted
 * away from the source for a bolder, more colorful result. `contrastLevel` can
 * be nudged up (0..1) for even punchier output.
 */
export function paletteFromSource(
  source: number,
  isDark: boolean,
  contrastLevel = 0,
  variant: SchemeVariant = "expressive"
): DerivedPalette {
  const Scheme = SCHEMES[variant] ?? SchemeExpressive
  const scheme = new Scheme(Hct.fromInt(source), isDark, contrastLevel)
  const mdc = new MaterialDynamicColors()
  const hex = (role: { getArgb: (s: typeof scheme) => number }) =>
    hexFromArgb(role.getArgb(scheme))

  return {
    source: hexFromArgb(source),
    background: hex(mdc.surface()),
    foreground: hex(mdc.onSurface()),
    card: hex(mdc.surfaceContainerLow()),
    cardForeground: hex(mdc.onSurface()),
    popover: hex(mdc.surfaceContainer()),
    popoverForeground: hex(mdc.onSurface()),
    primary: hex(mdc.primary()),
    primaryForeground: hex(mdc.onPrimary()),
    secondary: hex(mdc.secondaryContainer()),
    secondaryForeground: hex(mdc.onSecondaryContainer()),
    muted: hex(mdc.surfaceContainerHigh()),
    mutedForeground: hex(mdc.onSurfaceVariant()),
    accent: hex(mdc.tertiaryContainer()),
    accentForeground: hex(mdc.onTertiaryContainer()),
    border: hex(mdc.outlineVariant()),
    input: hex(mdc.outlineVariant()),
    ring: hex(mdc.primary()),
  }
}
