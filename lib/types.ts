export type RepeatMode = "off" | "all" | "one"

export interface Track {
  id: string
  file: File
  url: string
  title: string
  artist: string
  album: string
  /** Duration in seconds. 0 until metadata has loaded. */
  duration: number
  /** Object URL for embedded cover art, if any. */
  artwork?: string
}
