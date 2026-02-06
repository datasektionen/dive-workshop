"use client"

import * as React from "react"

import type { Matrix } from "@/lib/imagicharm/types"
import type {
  MarkdownImagiCachePayload,
  MarkdownImagiFrame,
} from "@/lib/markdown/imagi-types"

type MarkdownImagiSnippetProps = {
  cache: MarkdownImagiCachePayload | null
}

const EMPTY_MATRIX: Matrix = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
)

function getInitialFrame(frames: MarkdownImagiFrame[]) {
  return frames[0]?.snapshot ?? EMPTY_MATRIX
}

export function MarkdownImagiSnippet({ cache }: MarkdownImagiSnippetProps) {
  const frames = React.useMemo(
    () => (cache?.frames ?? []).filter((frame) => Array.isArray(frame.snapshot)),
    [cache?.frames]
  )
  const [matrix, setMatrix] = React.useState<Matrix>(() => getInitialFrame(frames))

  React.useEffect(() => {
    setMatrix(getInitialFrame(frames))
  }, [frames])

  React.useEffect(() => {
    if (!cache || cache.error || frames.length <= 1 || cache.mode !== "anim") {
      return
    }
    const activeCache = cache

    let frameIndex = 0
    let loops = 0
    let timerId: number | null = null
    let active = true

    function scheduleNext() {
      if (!active) return

      const frame = frames[frameIndex]
      if (!frame) return
      setMatrix(frame.snapshot)
      const duration = Math.max(25, Number(frame.duration) || 500)

      timerId = window.setTimeout(() => {
        frameIndex += 1
        if (frameIndex >= frames.length) {
          frameIndex = 0
          loops += 1
          if (activeCache.loopCount > 0 && loops >= activeCache.loopCount) {
            active = false
            return
          }
        }
        scheduleNext()
      }, duration)
    }

    scheduleNext()

    return () => {
      active = false
      if (timerId !== null) {
        window.clearTimeout(timerId)
      }
    }
  }, [cache, frames])

  return (
    <div className="my-4 flex justify-center">
      <div className="grid grid-cols-8 gap-1">
        {matrix.flatMap((row, y) =>
          row.map((pixel, x) => {
            const [r, g, b] = pixel
            return (
              <div
                key={`${y}-${x}`}
                className="h-6 w-6 rounded-xs border border-muted"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
