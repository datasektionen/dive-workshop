import type { LearningBlockWithContext, LearningModule } from "@/lib/learning/types"

export type LearningNavigation = {
  allBlocks: LearningBlockWithContext[]
  currentIndex: number
  currentBlock: LearningBlockWithContext | null
  prevBlock: LearningBlockWithContext | null
  nextBlock: LearningBlockWithContext | null
}

export function flattenLearningBlocks(modules: LearningModule[]) {
  return modules.flatMap((moduleItem) =>
    moduleItem.blocks.map((block) => ({
      ...block,
      moduleId: moduleItem.id,
      moduleTitle: moduleItem.title,
    }))
  )
}

export function getLearningNavigation(
  modules: LearningModule[],
  selectedBlockId: string | null
): LearningNavigation {
  const allBlocks = flattenLearningBlocks(modules)
  const currentIndex = allBlocks.findIndex((block) => block.id === selectedBlockId)
  const currentBlock = currentIndex >= 0 ? allBlocks[currentIndex] : null
  const prevBlock = currentIndex > 0 ? allBlocks[currentIndex - 1] : null
  const nextBlock =
    currentIndex >= 0 && currentIndex < allBlocks.length - 1
      ? allBlocks[currentIndex + 1]
      : null

  return {
    allBlocks,
    currentIndex,
    currentBlock,
    prevBlock,
    nextBlock,
  }
}
