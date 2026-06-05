import { DynamicColorProvider } from "@/lib/dynamic-color-context"
import { PlayerProvider } from "@/lib/player-context"
import { MusicPlayer } from "@/components/music-player"

export default function Page() {
  return (
    <PlayerProvider>
      <DynamicColorProvider>
        <MusicPlayer />
      </DynamicColorProvider>
    </PlayerProvider>
  )
}
