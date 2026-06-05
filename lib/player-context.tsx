"use client"

import * as React from "react"
import { toast } from "sonner"

import type { RepeatMode, Track } from "@/lib/types"

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|flac|wav|ogg|oga|opus|wma|aiff?|weba)$/i

interface PlayerState {
  tracks: Track[]
  currentId: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  loadingCount: number
}

interface PlayerContextValue extends PlayerState {
  currentTrack: Track | null
  addFiles: (files: FileList | File[]) => Promise<void>
  removeTrack: (id: string) => void
  clear: () => void
  playTrack: (id: string) => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (time: number) => void
  /** Live playback position in seconds, read straight off the audio element. */
  getCurrentTime: () => number
  setVolume: (value: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null)

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "")
}

/** Push the current playback position to the OS media controls' scrubber. */
function syncPositionState(audio: HTMLAudioElement) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
  if (!navigator.mediaSession.setPositionState) return
  const duration = audio.duration
  if (!Number.isFinite(duration) || duration <= 0) return
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: audio.playbackRate || 1,
      position: Math.min(Math.max(audio.currentTime, 0), duration),
    })
  } catch {
    // Some browsers throw on invalid state; ignore.
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  // Object URLs we own and must revoke on cleanup.
  const objectUrls = React.useRef<Set<string>>(new Set())

  const [tracks, setTracks] = React.useState<Track[]>([])
  const [currentId, setCurrentId] = React.useState<string | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolumeState] = React.useState(1)
  const [muted, setMuted] = React.useState(false)
  const [shuffle, setShuffle] = React.useState(false)
  const [repeat, setRepeat] = React.useState<RepeatMode>("off")
  const [loadingCount, setLoadingCount] = React.useState(0)

  // Keep refs of the latest tracks/state for use inside audio event handlers
  // that are bound once. Updated in an effect (after commit) so render stays pure.
  const tracksRef = React.useRef(tracks)
  const currentIdRef = React.useRef(currentId)
  const shuffleRef = React.useRef(shuffle)
  const repeatRef = React.useRef(repeat)
  React.useEffect(() => {
    tracksRef.current = tracks
    currentIdRef.current = currentId
    shuffleRef.current = shuffle
    repeatRef.current = repeat
  })

  const currentTrack = React.useMemo(
    () => tracks.find((t) => t.id === currentId) ?? null,
    [tracks, currentId]
  )

  const playId = React.useCallback((id: string) => {
    const audio = audioRef.current
    const track = tracksRef.current.find((t) => t.id === id)
    if (!audio || !track) return
    setCurrentId(id)
    audio.src = track.url
    audio.load()
    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }, [])

  const pickNextId = React.useCallback(
    (direction: 1 | -1): string | null => {
      const list = tracksRef.current
      if (list.length === 0) return null
      const id = currentIdRef.current
      if (shuffleRef.current && list.length > 1) {
        let next = id
        while (next === id) {
          next = list[Math.floor(Math.random() * list.length)].id
        }
        return next
      }
      const index = list.findIndex((t) => t.id === id)
      if (index === -1) return list[0].id
      const nextIndex = index + direction
      if (nextIndex < 0) return list[list.length - 1].id
      if (nextIndex >= list.length) return list[0].id
      return list[nextIndex].id
    },
    []
  )

  // Bind the audio element once.
  React.useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    audioRef.current = audio

    const onTime = () => {
      setCurrentTime(audio.currentTime)
      syncPositionState(audio)
    }
    const onLoaded = () => {
      setDuration(audio.duration || 0)
      syncPositionState(audio)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      if (repeatRef.current === "one") {
        audio.currentTime = 0
        void audio.play()
        return
      }
      const list = tracksRef.current
      const index = list.findIndex((t) => t.id === currentIdRef.current)
      const atEnd = index === list.length - 1
      if (repeatRef.current === "off" && atEnd && !shuffleRef.current) {
        setIsPlaying(false)
        return
      }
      const nextId = pickNextId(1)
      if (nextId) playId(nextId)
    }

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("durationchange", onLoaded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("durationchange", onLoaded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.pause()
      audio.src = ""
    }
  }, [pickNextId, playId])

  // Revoke all owned object URLs on unmount.
  React.useEffect(() => {
    const urls = objectUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const addFiles = React.useCallback(async (input: FileList | File[]) => {
    const files = Array.from(input).filter(
      (f) => f.type.startsWith("audio/") || AUDIO_EXTENSIONS.test(f.name)
    )
    if (files.length === 0) {
      toast.error("No audio files found", {
        description: "Drop or pick .mp3, .flac, .m4a, .wav, .ogg files.",
      })
      return
    }

    const newTracks: Track[] = files.map((file) => {
      const url = URL.createObjectURL(file)
      objectUrls.current.add(url)
      return {
        id: crypto.randomUUID(),
        file,
        url,
        title: stripExtension(file.name),
        artist: "Unknown artist",
        album: "",
        duration: 0,
      }
    })

    setTracks((prev) => [...prev, ...newTracks])
    toast.success(
      `Added ${newTracks.length} track${newTracks.length > 1 ? "s" : ""}`
    )

    // Parse tags in the background so the UI stays responsive.
    setLoadingCount((c) => c + newTracks.length)
    const { parseBlob } = await import("music-metadata")
    for (const track of newTracks) {
      try {
        const { common, format } = await parseBlob(track.file, {
          duration: true,
        })
        let artwork: string | undefined
        const pic = common.picture?.[0]
        if (pic) {
          const blob = new Blob([pic.data as BlobPart], { type: pic.format })
          artwork = URL.createObjectURL(blob)
          objectUrls.current.add(artwork)
        }
        setTracks((prev) =>
          prev.map((t) =>
            t.id === track.id
              ? {
                  ...t,
                  title: common.title?.trim() || t.title,
                  artist: common.artist?.trim() || t.artist,
                  album: common.album?.trim() || t.album,
                  duration: format.duration || t.duration,
                  artwork,
                }
              : t
          )
        )
      } catch {
        // Leave the filename-derived defaults in place.
      } finally {
        setLoadingCount((c) => Math.max(0, c - 1))
      }
    }
  }, [])

  const removeTrack = React.useCallback((id: string) => {
    setTracks((prev) => {
      const track = prev.find((t) => t.id === id)
      if (track) {
        URL.revokeObjectURL(track.url)
        objectUrls.current.delete(track.url)
        if (track.artwork) {
          URL.revokeObjectURL(track.artwork)
          objectUrls.current.delete(track.artwork)
        }
      }
      return prev.filter((t) => t.id !== id)
    })
    if (currentIdRef.current === id) {
      audioRef.current?.pause()
      if (audioRef.current) audioRef.current.src = ""
      setCurrentId(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [])

  const clear = React.useCallback(() => {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.src = ""
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.current.clear()
    setTracks([])
    setCurrentId(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const playTrack = React.useCallback(
    (id: string) => {
      if (id === currentIdRef.current) {
        const audio = audioRef.current
        if (!audio) return
        if (audio.paused) void audio.play()
        else audio.pause()
        return
      }
      playId(id)
    },
    [playId]
  )

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!currentIdRef.current) {
      const first = tracksRef.current[0]
      if (first) playId(first.id)
      return
    }
    if (audio.paused) void audio.play()
    else audio.pause()
  }, [playId])

  const next = React.useCallback(() => {
    const id = pickNextId(1)
    if (id) playId(id)
  }, [pickNextId, playId])

  const previous = React.useCallback(() => {
    const audio = audioRef.current
    // Restart the current track if we're more than 3s in.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    const id = pickNextId(-1)
    if (id) playId(id)
  }, [pickNextId, playId])

  const seek = React.useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const getCurrentTime = React.useCallback(
    () => audioRef.current?.currentTime ?? 0,
    []
  )

  const setVolume = React.useCallback((value: number) => {
    const audio = audioRef.current
    setVolumeState(value)
    setMuted(value === 0)
    if (audio) {
      audio.volume = value
      audio.muted = value === 0
    }
  }, [])

  const toggleMute = React.useCallback(() => {
    const audio = audioRef.current
    setMuted((m) => {
      const nextMuted = !m
      if (audio) audio.muted = nextMuted
      return nextMuted
    })
  }, [])

  const toggleShuffle = React.useCallback(() => setShuffle((s) => !s), [])

  const cycleRepeat = React.useCallback(
    () =>
      setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    []
  )

  // --- Media Session: show track info + controls in the OS/browser media UI ---

  // Reflect the current track's metadata (title, artist, album, artwork).
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return
    }
    if (!currentTrack) {
      navigator.mediaSession.metadata = null
      return
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || undefined,
      artwork: currentTrack.artwork
        ? [{ src: currentTrack.artwork, sizes: "512x512" }]
        : [],
    })
  }, [currentTrack])

  // Reflect play/pause state.
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return
    }
    navigator.mediaSession.playbackState = !currentId
      ? "none"
      : isPlaying
        ? "playing"
        : "paused"
  }, [isPlaying, currentId])

  // Register transport controls. The callbacks are stable, so this binds once.
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return
    }
    const ms = navigator.mediaSession
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      ["previoustrack", () => previous()],
      ["nexttrack", () => next()],
      [
        "seekbackward",
        (d) => {
          const a = audioRef.current
          if (a) a.currentTime = Math.max(0, a.currentTime - (d.seekOffset || 10))
        },
      ],
      [
        "seekforward",
        (d) => {
          const a = audioRef.current
          if (a) {
            a.currentTime = Math.min(
              a.duration || a.currentTime,
              a.currentTime + (d.seekOffset || 10)
            )
          }
        },
      ],
      [
        "seekto",
        (d) => {
          if (typeof d.seekTime === "number") seek(d.seekTime)
        },
      ],
      [
        "stop",
        () => {
          const a = audioRef.current
          if (a) {
            a.pause()
            a.currentTime = 0
          }
        },
      ],
    ]
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler)
      } catch {
        // Action unsupported in this browser; skip it.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          ms.setActionHandler(action, null)
        } catch {
          // ignore
        }
      }
    }
  }, [next, previous, seek])

  const value: PlayerContextValue = {
    tracks,
    currentId,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    repeat,
    loadingCount,
    currentTrack,
    addFiles,
    removeTrack,
    clear,
    playTrack,
    togglePlay,
    next,
    previous,
    seek,
    getCurrentTime,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextValue {
  const ctx = React.useContext(PlayerContext)
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider")
  return ctx
}
