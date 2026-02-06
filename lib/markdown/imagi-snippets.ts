import {
  type ImagiSnippetMode,
  type MarkdownImagiSnippet,
} from "@/lib/markdown/imagi-types"

const IMAGI_FENCE_GRID_TOKEN = "imagi-grid"
const IMAGI_FENCE_ANIM_TOKEN = "imagi-anim"

const PYTHON_LANGUAGES = new Set(["python", "py"])

function normalizeFenceTokens(info: string) {
  return info
    .trim()
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
}

export function getImagiModeFromFence(
  language: string | null | undefined,
  meta: string | null | undefined
): ImagiSnippetMode | null {
  const normalizedLanguage = (language ?? "").trim().toLowerCase()
  if (!PYTHON_LANGUAGES.has(normalizedLanguage)) {
    return null
  }

  const tokens = normalizeFenceTokens(meta ?? "")
  if (tokens.includes(IMAGI_FENCE_ANIM_TOKEN)) {
    return "anim"
  }
  if (tokens.includes(IMAGI_FENCE_GRID_TOKEN)) {
    return "grid"
  }
  return null
}

export function hashString(input: string) {
  let hashA = 0x811c9dc5
  let hashB = 0x01000193

  for (let index = 0; index < input.length; index += 1) {
    const codePoint = input.charCodeAt(index)
    hashA ^= codePoint
    hashA = Math.imul(hashA, 0x01000193)
    hashB ^= codePoint << (index % 8)
    hashB = Math.imul(hashB, 0x85ebca6b)
  }

  const left = (hashA >>> 0).toString(16).padStart(8, "0")
  const right = (hashB >>> 0).toString(16).padStart(8, "0")
  return `${left}${right}`
}

export function createImagiSnippetKey(mode: ImagiSnippetMode, code: string) {
  const codeHash = hashString(`${mode}\n${code}`)
  return `${mode}-${codeHash.slice(0, 16)}`
}

export function parseMarkdownImagiSnippets(content: string): MarkdownImagiSnippet[] {
  const snippets: MarkdownImagiSnippet[] = []
  const fencedCodeRegex = /```([^\n`]*)\n([\s\S]*?)```/g
  let snippetIndex = 0
  let match: RegExpExecArray | null

  while ((match = fencedCodeRegex.exec(content)) !== null) {
    const info = (match[1] ?? "").trim()
    const code = (match[2] ?? "").replace(/\n$/, "")
    const tokens = normalizeFenceTokens(info)
    const language = tokens[0] ?? ""
    const meta = tokens.slice(1).join(" ")
    const mode = getImagiModeFromFence(language, meta)

    if (!mode) {
      continue
    }

    const codeHash = hashString(`${mode}\n${code}`)
    const key = createImagiSnippetKey(mode, code)
    snippets.push({
      index: snippetIndex,
      key,
      language,
      mode,
      code,
      codeHash,
    })
    snippetIndex += 1
  }

  return snippets
}
