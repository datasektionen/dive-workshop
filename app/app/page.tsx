"use client"

import * as React from "react"

import Image from "next/image"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ParticipantSidebarAccount } from "@/components/participant-sidebar-account"
import { LearningCodeTask } from "@/components/imagicharm/learning-code-task"
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer"
import { getLearningNavigation } from "@/lib/learning/navigation"
import { buildBlockSlugMaps } from "@/lib/learning/slug"
import type { LearningData } from "@/lib/learning/types"

export default function AppPage() {
  const [data, setData] = React.useState<LearningData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showContent, setShowContent] = React.useState(false)
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null
  )
  const [error, setError] = React.useState("")
  const [splitRatio, setSplitRatio] = React.useState(50)
  const splitRef = React.useRef<HTMLDivElement | null>(null)
  const [isExitingPreview, setIsExitingPreview] = React.useState(false)
  const [codeByBlockId, setCodeByBlockId] = React.useState<
    Record<string, string>
  >({})
  const sendEvent = React.useCallback(
    async (payload: { type: string; blockId?: string; moduleId?: string; metadata?: Record<string, unknown> }) => {
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch {
        // Ignore event failures.
      }
    },
    []
  )

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
        }
      } catch {
        if (active) {
          setError("Unable to load learning data.")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadLearning()

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    if (isLoading) return

    const frame = window.requestAnimationFrame(() => {
      setShowContent(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isLoading])

  const modules = React.useMemo(() => data?.course.modules ?? [], [data])
  const { allBlocks, currentBlock, prevBlock, nextBlock } = React.useMemo(
    () => getLearningNavigation(modules, selectedBlockId),
    [modules, selectedBlockId]
  )
  const blockSlugMaps = React.useMemo(
    () => buildBlockSlugMaps(allBlocks),
    [allBlocks]
  )

  React.useEffect(() => {
    if (!data || selectedBlockId) return

    const params = new URLSearchParams(window.location.search)
    const slug = params.get("b")
    if (slug) {
      const matchedBlockId = blockSlugMaps.bySlug[slug]
      if (matchedBlockId) {
        setSelectedBlockId(matchedBlockId)
        return
      }
    }

    const firstBlockId = allBlocks[0]?.id ?? null
    setSelectedBlockId(firstBlockId)
  }, [data, selectedBlockId, blockSlugMaps.bySlug, allBlocks])

  React.useEffect(() => {
    if (!selectedBlockId) return
    const slug = blockSlugMaps.byBlockId[selectedBlockId]
    if (!slug) return

    const url = new URL(window.location.href)
    if (url.searchParams.get("b") === slug) return
    url.searchParams.set("b", slug)
    const nextQuery = url.searchParams.toString()
    const nextUrl = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`
    window.history.replaceState(window.history.state, "", nextUrl)
  }, [selectedBlockId, blockSlugMaps.byBlockId])

  React.useEffect(() => {
    if (!currentBlock?.id) return
    void sendEvent({
      type: "block_view",
      blockId: currentBlock.id,
      moduleId: currentBlock.moduleId,
    })
  }, [currentBlock?.id, currentBlock?.moduleId, sendEvent])

  React.useEffect(() => {
    if (!currentBlock?.id) return
    const blockId = currentBlock.id
    const fallbackDefaultCode = currentBlock.defaultCode.trim()
      ? currentBlock.defaultCode
      : undefined
    let active = true

    if (Object.prototype.hasOwnProperty.call(codeByBlockId, blockId)) {
      return () => {
        active = false
      }
    }

    async function loadCode() {
      try {
        const response = await fetch(`/api/code?blockId=${blockId}`)
        if (!response.ok) return
        const payload = (await response.json()) as { code?: string | null }
        if (active) {
          setCodeByBlockId((prev) => {
            if (Object.prototype.hasOwnProperty.call(prev, blockId)) {
              return prev
            }
            if (typeof payload.code === "string") {
              return { ...prev, [blockId]: payload.code }
            }
            if (fallbackDefaultCode) {
              return { ...prev, [blockId]: fallbackDefaultCode }
            }
            return prev
          })
        }
      } catch {
        // Ignore code loading errors and rely on local default.
      }
    }
    loadCode()
    return () => {
      active = false
    }
  }, [currentBlock?.id, currentBlock?.defaultCode, codeByBlockId])

  function handleSplitPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!splitRef.current) return
    event.preventDefault()
    const container = splitRef.current

    function handlePointerMove(e: PointerEvent) {
      const rect = container.getBoundingClientRect()
      const offset = e.clientY - rect.top
      const ratio = Math.min(85, Math.max(15, (offset / rect.height) * 100))
      setSplitRatio(ratio)
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      {data ? (
        <main
          className={`app-root flex h-[100dvh] w-full transition-opacity duration-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <aside className="hidden w-72 shrink-0 border-r bg-muted/10 md:block">
        <div className="sticky top-0 flex h-[100dvh] flex-col gap-4 px-4 py-6">
          <div className="flex items-center gap-3">
            <Image src="/dive.png" alt="Dive" width={30} height={30} />
            <p className="text-base font-semibold text-foreground">
              {data?.class.title ?? "Dive Workshop"}
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules assigned yet.
              </p>
            ) : (
              modules.map((moduleItem) => (
                <div key={moduleItem.id} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
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
          </div>
          <div className="pt-2">
            <ParticipantSidebarAccount
              name={data?.name ?? "Participant"}
              accessCode={data?.participantCode}
            />
          </div>
        </div>
          </aside>

          <section className="flex h-[100dvh] flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b px-6 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">
              {currentBlock?.moduleTitle ?? "Learning"}
            </p>
            <h1 className="truncate text-xl font-semibold">
              {currentBlock?.title ?? "Select a block"}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {data?.isPreview ? (
              <Button
                size="sm"
                variant="default"
                disabled={isExitingPreview}
                onClick={async () => {
                  setIsExitingPreview(true)
                  try {
                    await fetch("/api/preview-exit", { method: "POST" })
                  } finally {
                    const classId = data?.class.id
                    window.location.href = classId
                      ? `/admin/classes/${classId}/overview`
                      : "/admin"
                  }
                }}
              >
                {isExitingPreview ? "Returning..." : "Return to admin view"}
              </Button>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
                onClick={() => {
                      if (!prevBlock) return
                      void sendEvent({
                        type: "block_prev",
                        blockId: prevBlock.id,
                        moduleId: prevBlock.moduleId,
                        metadata: { fromBlockId: currentBlock?.id ?? null },
                      })
                      setSelectedBlockId(prevBlock.id)
                    }}
                    disabled={!prevBlock}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
                    onClick={() => {
                      if (!nextBlock) return
                      void sendEvent({
                        type: "block_next",
                        blockId: nextBlock.id,
                        moduleId: nextBlock.moduleId,
                        metadata: { fromBlockId: currentBlock?.id ?? null },
                      })
                      setSelectedBlockId(nextBlock.id)
                    }}
                disabled={!nextBlock}
              >
                Next
              </button>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {error ? (
          <p className="px-6 pt-4 text-sm text-destructive">{error}</p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          {currentBlock ? (
            currentBlock.type === "code" ? (
              <div
                ref={splitRef}
                className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] gap-0"
                style={{
                  gridTemplateRows: `calc(${splitRatio}% - 5px) 10px calc(${100 - splitRatio}% - 5px)`,
                }}
              >
                <div className="min-h-0 overflow-y-auto px-6 pt-4 pb-2">
                  <div className="mx-auto w-full">
                    {currentBlock.body.trim() ? (
                      <MarkdownRenderer content={currentBlock.body} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This block has no text content.
                      </p>
                    )}
                  </div>
                </div>
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  onPointerDown={handleSplitPointerDown}
                  className="group relative cursor-row-resize bg-muted/40"
                >
                  <div className="absolute left-1/2 top-1/2 h-1 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/40 transition group-hover:bg-muted-foreground/70" />
                </div>
                <div className="min-h-0 overflow-hidden">
                  <LearningCodeTask
                    key={currentBlock.id}
                    className="h-full"
                    blockId={currentBlock.id}
                    moduleId={currentBlock.moduleId}
                    initialCode={
                      codeByBlockId[currentBlock.id] ??
                      (currentBlock.defaultCode.trim()
                        ? currentBlock.defaultCode
                        : undefined)
                    }
                    defaultCode={
                      currentBlock.defaultCode.trim()
                        ? currentBlock.defaultCode
                        : undefined
                    }
                    onCodeChange={(nextCode) => {
                      setCodeByBlockId((prev) => {
                        if (prev[currentBlock.id] === nextCode) return prev
                        return { ...prev, [currentBlock.id]: nextCode }
                      })
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-2 mb-4">
                {currentBlock.body.trim() ? (
                  <div className="mx-auto w-full">
                    <MarkdownRenderer content={currentBlock.body} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This block has no text content.
                  </p>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a block to get started.
            </p>
          )}
        </div>
          </section>
        </main>
      ) : !isLoading ? (
        <div
          className={`flex h-[100dvh] w-full items-center justify-center transition-opacity duration-500 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-sm text-destructive">
            {error || "Unable to load learning data."}
          </p>
        </div>
      ) : null}

      <div
        className={`absolute inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
          isLoading ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2Icon className="h-14 w-14 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">Loading</p>
            <p className="text-sm text-muted-foreground">
              Preparing your learning workspace...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
