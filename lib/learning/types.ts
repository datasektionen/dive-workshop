export type LearningBlock = {
  id: string
  type: "text" | "code"
  title: string
  description: string
  body: string
  defaultCode: string
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
