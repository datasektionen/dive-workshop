"use client"

import * as React from "react"

import { LearningCodeTask } from "@/components/imagicharm/learning-code-task"

type LearningBlock = {
  id: string
  type: "text" | "code"
  title: string
  description: string
  body: string
}

type LearningModule = {
  id: string
  name: string
  title: string
  description: string
  blocks: LearningBlock[]
}

type LearningData = {
  name: string
  class: { id: string; title: string; name: string }
  course: {
    id: string
    name: string
    description: string
    modules: LearningModule[]
  }
}

export default function AppPage() {
  const [data, setData] = React.useState<LearningData | null>(null)
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null
  )
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let active = true

    async function loadLearning() {
      try {
        const response = await fetch("/api/learning")
        if (!response.ok) {
          throw new Error("Unable to load learning data.")
        }
        const payload = (await response.json()) as LearningData
        if (active) {
          setData(payload)
          const firstBlock = payload.course.modules[0]?.blocks[0] ?? null
          setSelectedBlockId(firstBlock?.id ?? null)
        }
      } catch (err) {
        if (active) {
          setError("Unable to load learning data.")
        }
      }
    }

    loadLearning()

    return () => {
      active = false
    }
  }, [])

  const modules = data?.course.modules ?? []
  const allBlocks = modules.flatMap((moduleItem) =>
    moduleItem.blocks.map((block) => ({
      ...block,
      moduleId: moduleItem.id,
      moduleTitle: moduleItem.title,
    }))
  )
  const currentIndex = allBlocks.findIndex(
    (block) => block.id === selectedBlockId
  )
  const currentBlock = currentIndex >= 0 ? allBlocks[currentIndex] : null
  const prevBlock = currentIndex > 0 ? allBlocks[currentIndex - 1] : null
  const nextBlock =
    currentIndex >= 0 && currentIndex < allBlocks.length - 1
      ? allBlocks[currentIndex + 1]
      : null

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {data?.class.title ?? "Dive Workshop"}
            </h1>
          </div>
          {data ? (
            <div className="text-sm text-muted-foreground">
              Welcome, {data.name}
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-4 rounded-lg border bg-muted/10 p-4">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules assigned yet.
              </p>
            ) : (
              modules.map((moduleItem) => (
                <div key={moduleItem.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {moduleItem.title}
                  </p>
                  <div className="space-y-1">
                    {moduleItem.blocks.map((block) => {
                      const isActive = block.id === selectedBlockId
                      return (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => setSelectedBlockId(block.id)}
                          className={`w-full rounded-md px-2 py-1 text-left text-sm transition ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {block.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </aside>

          <section className="space-y-6">
            {currentBlock ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {currentBlock.moduleTitle}
                  </p>
                  <h2 className="text-2xl font-semibold">
                    {currentBlock.title}
                  </h2>
                  {null}
                </div>

                {currentBlock.body ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentBlock.body }}
                  />
                ) : null}

                {currentBlock.type === "code" ? (
                  <div className="mt-8 rounded-lg border bg-muted/20 p-4">
                    <LearningCodeTask />
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
                    onClick={() => prevBlock && setSelectedBlockId(prevBlock.id)}
                    disabled={!prevBlock}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
                    onClick={() => nextBlock && setSelectedBlockId(nextBlock.id)}
                    disabled={!nextBlock}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a block to get started.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
