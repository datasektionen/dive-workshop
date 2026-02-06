import type {
  ImagiSnippetMode,
  MarkdownImagiFrame,
} from "@/lib/markdown/imagi-types"

export type LearningBlockMarkdownImagiCache = {
  snippetKey: string
  language: string
  mode: ImagiSnippetMode
  code: string
  codeHash: string
  frames: MarkdownImagiFrame[]
  loopCount: number
  error: string | null
}

export type LearningBlock = {
  id: string
  type: "text" | "code"
  title: string
  description: string
  body: string
  defaultCode: string
  markdownImagiCaches: LearningBlockMarkdownImagiCache[]
}

export type LearningModule = {
  id: string
  name: string
  title: string
  description: string
  blocks: LearningBlock[]
}

export type LearningData = {
  name: string
  isPreview?: boolean
  participantCode?: string | null
  class: { id: string; title: string; name: string }
  course: {
    id: string
    name: string
    description: string
    modules: LearningModule[]
  }
}

export type LearningBlockWithContext = LearningBlock & {
  moduleId: string
  moduleTitle: string
}
