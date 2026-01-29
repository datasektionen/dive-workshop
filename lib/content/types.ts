export const BLOCK_TYPES = ["text", "code"] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && BLOCK_TYPES.includes(value as BlockType)
}

export type BlockSummary = {
  id: string
  type: BlockType
  title: string
  description: string
  createdAt: string
}

export type BlockDetail = BlockSummary & {
  body: string
}

export type ModuleSummary = {
  id: string
  name: string
  title: string
  description: string
  createdAt: string
  _count: {
    blocks: number
  }
}

export type ModuleDetail = {
  id: string
  name: string
  title: string
  description: string
  blocks: { blockId: string; order: number }[]
}

export type CourseSummary = {
  id: string
  name: string
  description: string
  createdAt: string
}

export type CourseDetail = CourseSummary & {
  modules: { moduleId: string; order: number }[]
}
