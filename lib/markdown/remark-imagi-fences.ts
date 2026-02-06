import { getImagiModeFromFence } from "@/lib/markdown/imagi-snippets"

type MarkdownNode = {
  type?: string
  lang?: string
  meta?: string
  children?: MarkdownNode[]
  data?: {
    hProperties?: {
      className?: string | string[]
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

function appendClassName(
  existing: string | string[] | undefined,
  nextClassName: string
) {
  const classes = Array.isArray(existing)
    ? [...existing]
    : typeof existing === "string"
      ? existing.split(/\s+/).filter(Boolean)
      : []

  if (!classes.includes(nextClassName)) {
    classes.push(nextClassName)
  }

  return classes
}

function visit(node: MarkdownNode) {
  if (node.type === "code") {
    const mode = getImagiModeFromFence(node.lang, node.meta)
    if (mode) {
      node.data ??= {}
      node.data.hProperties ??= {}
      node.data.hProperties.className = appendClassName(
        node.data.hProperties.className,
        `imagi-${mode}`
      )
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child)
    }
  }
}

export function remarkImagiFences() {
  return (tree: MarkdownNode) => {
    visit(tree)
  }
}
