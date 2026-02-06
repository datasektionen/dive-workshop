export type ColumnAlign = "top" | "middle" | "bottom"

export type MarkdownColumnsDirective = {
  type: "columns"
  align: ColumnAlign
  gap: number
  columns: Array<{
    content: string
    align?: ColumnAlign
  }>
}

export type MarkdownLayoutSegment =
  | { type: "markdown"; content: string }
  | MarkdownColumnsDirective

function parseOptions(raw: string) {
  const options: Record<string, string> = {}
  const matches = raw.matchAll(
    /([a-zA-Z][a-zA-Z0-9_-]*)=("([^"]*)"|'([^']*)'|[^\s]+)/g
  )

  for (const match of matches) {
    const key = match[1]?.trim().toLowerCase()
    const value = (match[3] ?? match[4] ?? match[2] ?? "")
      .replace(/^['"]|['"]$/g, "")
      .trim()
    if (key && value) {
      options[key] = value
    }
  }

  return options
}

function parseAlign(value: string | undefined): ColumnAlign | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "top") return "top"
  if (normalized === "middle" || normalized === "center") return "middle"
  if (normalized === "bottom") return "bottom"
  return undefined
}

function parseGap(value: string | undefined): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 4
  return Math.max(1, Math.min(12, Math.round(parsed)))
}

function consumeColumnsBlock(lines: string[], startIndex: number) {
  const header = lines[startIndex]?.trim()
  const headerMatch = /^:::columns(?:\s+(.*))?$/.exec(header ?? "")

  if (!headerMatch) {
    return null
  }

  const options = parseOptions(headerMatch[1] ?? "")
  const defaultAlign = parseAlign(options.align) ?? "top"
  const gap = parseGap(options.gap)
  const columns: Array<{ content: string; align?: ColumnAlign }> = []

  let cursor = startIndex + 1
  while (cursor < lines.length) {
    const line = lines[cursor]?.trim() ?? ""

    if (line === ":::") {
      if (columns.length === 0) {
        return null
      }
      return {
        block: {
          type: "columns" as const,
          align: defaultAlign,
          gap,
          columns,
        },
        nextIndex: cursor + 1,
      }
    }

    const columnHeaderMatch = /^:::col(?:\s+(.*))?$/.exec(line)
    if (!columnHeaderMatch) {
      if (line.length === 0) {
        cursor += 1
        continue
      }
      return null
    }

    const columnOptions = parseOptions(columnHeaderMatch[1] ?? "")
    const columnAlign = parseAlign(columnOptions.align)
    cursor += 1
    const columnLines: string[] = []
    let inCodeFence = false

    while (cursor < lines.length) {
      const currentLine = lines[cursor]
      const trimmedLine = currentLine.trim()

      if (inCodeFence && trimmedLine === ":::") {
        const nextTrimmed = lines[cursor + 1]?.trim() ?? ""
        const looksLikeDirectiveBoundary =
          nextTrimmed === ":::" ||
          nextTrimmed.startsWith(":::col") ||
          nextTrimmed.startsWith(":::columns") ||
          nextTrimmed === ""

        // Recover from a missing closing ``` right before directive boundaries.
        if (looksLikeDirectiveBoundary) {
          columnLines.push("```")
          inCodeFence = false
        }
      }

      if (trimmedLine.startsWith("```")) {
        inCodeFence = !inCodeFence
      }
      if (!inCodeFence && trimmedLine === ":::") {
        break
      }

      columnLines.push(lines[cursor])
      cursor += 1
    }

    if (cursor >= lines.length) {
      return null
    }

    columns.push({
      content: columnLines.join("\n").trim(),
      align: columnAlign,
    })
    cursor += 1
  }

  return null
}

function flushMarkdownSegment(
  segments: MarkdownLayoutSegment[],
  markdownLines: string[]
) {
  if (markdownLines.length === 0) return
  const markdown = markdownLines.join("\n").trim()
  if (!markdown) {
    markdownLines.length = 0
    return
  }
  segments.push({ type: "markdown", content: markdown })
  markdownLines.length = 0
}

export function parseMarkdownLayout(content: string): MarkdownLayoutSegment[] {
  const lines = content.split(/\r?\n/)
  const segments: MarkdownLayoutSegment[] = []
  const markdownLines: string[] = []
  let inCodeFence = false

  let index = 0
  while (index < lines.length) {
    const line = lines[index]?.trim() ?? ""

    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence
      markdownLines.push(lines[index])
      index += 1
      continue
    }

    if (!inCodeFence && line.startsWith(":::columns")) {
      const consumed = consumeColumnsBlock(lines, index)
      if (consumed) {
        flushMarkdownSegment(segments, markdownLines)
        segments.push(consumed.block)
        index = consumed.nextIndex
        continue
      }
    }

    markdownLines.push(lines[index])
    index += 1
  }

  flushMarkdownSegment(segments, markdownLines)

  if (segments.length === 0) {
    return [{ type: "markdown", content }]
  }

  return segments
}
