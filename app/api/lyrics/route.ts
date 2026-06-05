import { NextResponse } from "next/server"

import { KPOE_SERVERS, parseKPoeLyrics } from "@/lib/lyrics"

export const runtime = "nodejs"

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (riff-player)" },
      cache: "no-store",
    })
  } finally {
    clearTimeout(id)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get("title")?.trim()
  const artist = searchParams.get("artist")?.trim()
  const album = searchParams.get("album")?.trim()
  const duration = searchParams.get("duration")?.trim()

  if (!title || !artist) {
    return NextResponse.json(
      { error: "title and artist are required" },
      { status: 400 }
    )
  }

  const params = new URLSearchParams({ title, artist })
  if (album) params.set("album", album)
  if (duration) params.set("duration", duration)

  for (const base of KPOE_SERVERS) {
    try {
      const res = await fetchWithTimeout(
        `${base}/v2/lyrics/get?${params.toString()}`,
        7000
      )
      if (!res.ok) continue
      const payload = await res.json()
      const result = parseKPoeLyrics(payload)
      if (result && result.lines.length > 0) {
        return NextResponse.json(result, {
          headers: {
            // Lyrics are immutable for a given track; cache aggressively.
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        })
      }
    } catch {
      // Try the next server.
    }
  }

  return NextResponse.json({ error: "No lyrics found" }, { status: 404 })
}
