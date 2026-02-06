import type { LearningBlockWithContext } from "@/lib/learning/types"

function normalizeBlockSlugValue(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  return normalized || "block"
}

export function buildBlockSlugMaps(blocks: LearningBlockWithContext[]) {
  const byBlockId: Record<string, string> = {}
  const bySlug: Record<string, string> = {}
  const nextSuffixByBase = new Map<string, number>()
  const used = new Set<string>()

  for (const block of blocks) {
    const base = normalizeBlockSlugValue(block.title || "")
    let suffix = nextSuffixByBase.get(base) ?? 0
    let candidate = suffix === 0 ? base : `${base}-${suffix}`

    while (used.has(candidate)) {
      suffix += 1
      candidate = `${base}-${suffix}`
    }

    used.add(candidate)
    nextSuffixByBase.set(base, suffix + 1)
    byBlockId[block.id] = candidate
    bySlug[candidate] = block.id
  }

  return { byBlockId, bySlug }
}
