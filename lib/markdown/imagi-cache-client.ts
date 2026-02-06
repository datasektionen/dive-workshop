"use client"

import { getPythonErrorMessage, ImagiCharmRuntime } from "@/lib/imagicharm/runtime"
import type { Matrix } from "@/lib/imagicharm/types"
import { normalizeMatrix } from "@/lib/imagicharm/utils"
import { parseMarkdownImagiSnippets } from "@/lib/markdown/imagi-snippets"
import type {
  MarkdownImagiCachePayload,
  MarkdownImagiFrame,
  MarkdownImagiSnippet,
} from "@/lib/markdown/imagi-types"

type CapturedAnimation = {
  frames: unknown[]
  loopCount: number
}

const MAX_FRAMES_PER_SNIPPET = 256
const MAX_ANIMATION_DURATION_MS = 4000

function getFrameValue(frame: unknown, key: "snapshot" | "duration") {
  if (!frame || typeof frame !== "object") {
    return undefined
  }
  if (frame instanceof Map) {
    return frame.get(key)
  }
  return (frame as Record<string, unknown>)[key]
}

function normalizeFrame(frame: unknown): MarkdownImagiFrame {
  const snapshot = getFrameValue(frame, "snapshot")
  const durationValue = getFrameValue(frame, "duration")
  const duration = Math.min(
    MAX_ANIMATION_DURATION_MS,
    Math.max(25, Number(durationValue) || 500)
  )
  return {
    snapshot: normalizeMatrix(snapshot) as Matrix,
    duration,
  }
}

function toSingleFrame(frames: MarkdownImagiFrame[]) {
  const frame = frames[frames.length - 1]
  return frame
    ? [
        {
          snapshot: frame.snapshot,
          duration: 1000,
        },
      ]
    : []
}

async function renderSnippet(
  snippet: MarkdownImagiSnippet
): Promise<MarkdownImagiCachePayload> {
  const capturedRef: { current: CapturedAnimation | null } = { current: null }

  const runtime = new ImagiCharmRuntime(() => {}, {
    onAnimation: (frames, loopCount) => {
      capturedRef.current = { frames: frames as unknown[], loopCount }
    },
  })

  try {
    await runtime.run(snippet.code)
    const animation = capturedRef.current
    const capturedFrames = animation ? animation.frames : []
    const normalizedFrames = capturedFrames
      .slice(0, MAX_FRAMES_PER_SNIPPET)
      .map(normalizeFrame)

    const frames =
      snippet.mode === "grid" ? toSingleFrame(normalizedFrames) : normalizedFrames
    const loopCount = snippet.mode === "grid" ? 1 : animation?.loopCount ?? 0

    return {
      snippetKey: snippet.key,
      language: snippet.language,
      mode: snippet.mode,
      code: snippet.code,
      codeHash: snippet.codeHash,
      frames,
      loopCount,
      error:
        frames.length === 0
          ? "No frames were generated. Add drawing code and call render()."
          : null,
    }
  } catch (error) {
    return {
      snippetKey: snippet.key,
      language: snippet.language,
      mode: snippet.mode,
      code: snippet.code,
      codeHash: snippet.codeHash,
      frames: [],
      loopCount: 0,
      error: getPythonErrorMessage(error, snippet.code),
    }
  } finally {
    runtime.dispose()
  }
}

export async function generateMarkdownImagiCaches(content: string) {
  const snippets = parseMarkdownImagiSnippets(content)
  const caches: MarkdownImagiCachePayload[] = []

  for (const snippet of snippets) {
    const cache = await renderSnippet(snippet)
    caches.push(cache)
  }

  return caches
}
