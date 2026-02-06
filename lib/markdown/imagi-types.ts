import type { Matrix } from "@/lib/imagicharm/types"

export const IMAGI_SNIPPET_MODES = ["grid", "anim"] as const

export type ImagiSnippetMode = (typeof IMAGI_SNIPPET_MODES)[number]

export type MarkdownImagiFrame = {
  snapshot: Matrix
  duration: number
}

export type MarkdownImagiSnippet = {
  index: number
  key: string
  language: string
  mode: ImagiSnippetMode
  code: string
  codeHash: string
}

export type MarkdownImagiCachePayload = {
  snippetKey: string
  language: string
  mode: ImagiSnippetMode
  code: string
  codeHash: string
  frames: MarkdownImagiFrame[]
  loopCount: number
  error: string | null
}

export function isImagiSnippetMode(value: unknown): value is ImagiSnippetMode {
  return (
    typeof value === "string" &&
    (IMAGI_SNIPPET_MODES as readonly string[]).includes(value)
  )
}
