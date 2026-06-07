"use client"

import * as React from "react"
import Link from "next/link"
import { python } from "@codemirror/lang-python"
import CodeMirror from "@uiw/react-codemirror"
import { useCodeMirrorTheme } from "@/lib/imagicharm/editor-theme"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVerticalIcon, Trash2Icon } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { TableSearch } from "@/components/admin/table-search"
import { matchesSearchQuery } from "@/lib/admin/search"
import { cn } from "@/lib/utils"
import type { Matrix } from "@/lib/imagicharm/types"

type ParticipantRow = {
  id: string
  name: string
  joinedAt: string
  progressPercent: number
  viewedBlocks: number
  attemptedBlocks: number
  totalBlocks: number
  runCount: number
  lastActive: string | null
  lastRunBlock: string | null
  participantCode: string | null
}

type ProgressCell = {
  participantId: string
  blockId: string
  runCount: number
}

type OverviewPayload = {
  class: {
    id: string
    title: string
    name: string
    startDate: string | null
    endDate: string | null
    course: { id: string; name: string }
  }
  stats: {
    participants: number
    activeParticipants: number
    totalBlocks: number
    totalEvents: number
    totalRuns: number
  }
  participants: ParticipantRow[]
  blocks: { id: string; blockTitle: string; moduleTitle: string }[]
  progressCells: ProgressCell[]
}

type LiveCode = { code: string; blockId: string | null; updatedAt: string | null }
type LiveRunResult = {
  success: boolean
  error: string | null
  blockId: string | null
  updatedAt: string | null
}

// Compact 8x8 preview of a participant's display for the classroom wall.
function MiniMatrix({ matrix }: { matrix?: Matrix }) {
  return (
    <div className="grid aspect-square w-full grid-cols-8 gap-px rounded bg-black/80 p-1">
      {Array.from({ length: 64 }, (_, i) => {
        const y = Math.floor(i / 8)
        const x = i % 8
        const pixel = matrix?.[y]?.[x]
        const [r, g, b] = pixel ?? [12, 12, 12]
        return (
          <div
            key={i}
            className="rounded-[1px]"
            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
          />
        )
      })}
    </div>
  )
}

function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      title={online ? "Online" : "Offline"}
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        online ? "bg-emerald-500" : "bg-muted-foreground/30"
      )}
    />
  )
}

export default function ClassOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [classId, setClassId] = React.useState<string | null>(null)
  const [data, setData] = React.useState<OverviewPayload | null>(null)
  const [error, setError] = React.useState("")
  const [selectedParticipant, setSelectedParticipant] =
    React.useState<ParticipantRow | null>(null)
  const [storedCode, setStoredCode] = React.useState("")
  const [storedBlockId, setStoredBlockId] = React.useState<string | null>(null)
  const [storedUpdatedAt, setStoredUpdatedAt] = React.useState<string | null>(
    null
  )
  const [isCodeExpanded, setIsCodeExpanded] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"focus" | "wall">("focus")
  // Live, per-participant state streamed over the WebSocket.
  const [codeByParticipant, setCodeByParticipant] = React.useState<
    Record<string, LiveCode>
  >({})
  const [frameByParticipant, setFrameByParticipant] = React.useState<
    Record<string, Matrix>
  >({})
  const [runResultByParticipant, setRunResultByParticipant] = React.useState<
    Record<string, LiveRunResult>
  >({})
  const [onlineIds, setOnlineIds] = React.useState<Set<string>>(new Set())
  const [liveStatus, setLiveStatus] = React.useState<
    "connecting" | "online" | "reconnecting"
  >("connecting")
  const codeTheme = useCodeMirrorTheme()
  const socketRef = React.useRef<WebSocket | null>(null)
  const selectedRef = React.useRef<ParticipantRow | null>(null)
  const participantIdsRef = React.useRef<string[]>([])
  const wsRetryRef = React.useRef(0)
  const wsClosedRef = React.useRef(false)
  const wsReconnectTimerRef = React.useRef<number | null>(null)
  const [isPreviewing, setIsPreviewing] = React.useState(false)
  const [deleteTarget, setDeleteTarget] =
    React.useState<ParticipantRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [participantQuery, setParticipantQuery] = React.useState("")
  const selectedParticipantId = selectedParticipant?.id ?? null

  React.useEffect(() => {
    selectedRef.current = selectedParticipant
  }, [selectedParticipant])

  // Live focus values fall back to the DB-stored code until a live update lands.
  const focusLive = selectedParticipantId
    ? codeByParticipant[selectedParticipantId]
    : undefined
  const liveCode = focusLive?.code ?? storedCode
  const liveBlockId = focusLive?.blockId ?? storedBlockId
  const liveUpdatedAt = focusLive?.updatedAt ?? storedUpdatedAt
  const selectedRunResult = selectedParticipantId
    ? runResultByParticipant[selectedParticipantId]
    : undefined
  const selectedFrame = selectedParticipantId
    ? frameByParticipant[selectedParticipantId]
    : undefined

  React.useEffect(() => {
    let active = true
    async function resolveParams() {
      const { id } = await params
      if (active) {
        setClassId(id)
      }
    }
    resolveParams()
    return () => {
      active = false
    }
  }, [params])

  const loadOverview = React.useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/classes/${id}/overview`)
      if (!response.ok) {
        throw new Error("Unable to load class overview.")
      }
      const payload = (await response.json()) as OverviewPayload
      setData(payload)
      if (payload.participants.length > 0 && !selectedRef.current) {
        setSelectedParticipant(payload.participants[0])
      }
    } catch {
      setError("Unable to load class overview.")
    }
  }, [])

  React.useEffect(() => {
    if (!classId) return
    void loadOverview(classId)
    const handle = window.setInterval(() => {
      void loadOverview(classId)
    }, 15000)
    return () => window.clearInterval(handle)
  }, [classId, loadOverview])

  // One stable WebSocket for the whole class. It subscribes to every
  // participant so presence, live code, display frames, and run results all
  // stream in at once (focus view + classroom wall). Switching the selected
  // participant no longer tears down the socket.
  React.useEffect(() => {
    if (!classId || typeof window === "undefined") return
    wsClosedRef.current = false
    setLiveStatus("connecting")
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"

    const connect = () => {
      if (wsClosedRef.current) return
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
      socketRef.current = socket

      socket.addEventListener("open", () => {
        wsRetryRef.current = 0
        setLiveStatus("online")
        socket.send(
          JSON.stringify({
            type: "subscribe",
            participantIds: participantIdsRef.current,
          })
        )
      })

      socket.addEventListener("message", (event) => {
        let payload: Record<string, unknown>
        try {
          payload = JSON.parse(event.data)
        } catch {
          return
        }
        const pid =
          typeof payload.participantId === "string"
            ? payload.participantId
            : null
        switch (payload.type) {
          case "presence_snapshot":
            if (Array.isArray(payload.online)) {
              setOnlineIds(
                new Set(
                  (payload.online as unknown[]).filter(
                    (x): x is string => typeof x === "string"
                  )
                )
              )
            }
            break
          case "presence":
            if (pid) {
              setOnlineIds((prev) => {
                const next = new Set(prev)
                if (payload.online) next.add(pid)
                else next.delete(pid)
                return next
              })
            }
            break
          case "code_update":
            if (pid) {
              setCodeByParticipant((prev) => ({
                ...prev,
                [pid]: {
                  code: typeof payload.code === "string" ? payload.code : "",
                  blockId:
                    typeof payload.blockId === "string" ? payload.blockId : null,
                  updatedAt:
                    typeof payload.updatedAt === "string"
                      ? payload.updatedAt
                      : null,
                },
              }))
            }
            break
          case "frame_update":
            if (pid && Array.isArray(payload.matrix)) {
              setFrameByParticipant((prev) => ({
                ...prev,
                [pid]: payload.matrix as Matrix,
              }))
            }
            break
          case "run_result":
            if (pid) {
              setRunResultByParticipant((prev) => ({
                ...prev,
                [pid]: {
                  success: payload.success === true,
                  error:
                    typeof payload.error === "string" ? payload.error : null,
                  blockId:
                    typeof payload.blockId === "string" ? payload.blockId : null,
                  updatedAt:
                    typeof payload.updatedAt === "string"
                      ? payload.updatedAt
                      : null,
                },
              }))
            }
            break
        }
      })

      socket.addEventListener("close", () => {
        if (wsClosedRef.current) return
        setLiveStatus("reconnecting")
        // Keep retrying with capped backoff so a dropped socket recovers on
        // its own instead of silently leaving the wall frozen.
        const nextRetry = wsRetryRef.current + 1
        wsRetryRef.current = nextRetry
        const timeout = Math.min(500 * nextRetry, 5000)
        wsReconnectTimerRef.current = window.setTimeout(connect, timeout)
      })
    }

    connect()

    return () => {
      wsClosedRef.current = true
      if (wsReconnectTimerRef.current !== null) {
        window.clearTimeout(wsReconnectTimerRef.current)
        wsReconnectTimerRef.current = null
      }
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [classId])

  React.useEffect(() => {
    if (!selectedParticipantId || !classId) return
    const participantId = selectedParticipantId
    let active = true
    async function loadStoredCode() {
      try {
        const response = await fetch(
          `/api/admin/classes/${classId}/participants/${participantId}/code`
        )
        if (!response.ok) return
        const payload = (await response.json()) as {
          code?: string
          updatedAt?: string | null
          blockId?: string | null
        }
        if (active) {
          setStoredCode(payload.code ?? "")
          setStoredBlockId(payload.blockId ?? null)
          setStoredUpdatedAt(payload.updatedAt ?? null)
        }
      } catch {
        if (active) {
          setStoredCode("")
          setStoredBlockId(null)
          setStoredUpdatedAt(null)
        }
      }
    }
    loadStoredCode()
    return () => {
      active = false
    }
  }, [selectedParticipantId, classId])

  const participantIds = React.useMemo(
    () => (data?.participants ?? []).map((participant) => participant.id),
    [data?.participants]
  )
  const participantIdKey = participantIds.join(",")

  // Keep the subscription in sync as participants join/leave the class.
  React.useEffect(() => {
    participantIdsRef.current = participantIds
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "subscribe", participantIds }))
    }
    // participantIds is derived from participantIdKey; key drives the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantIdKey])

  const filteredParticipants = React.useMemo(() => {
    const participants = data?.participants ?? []
    return participants.filter((participant) =>
      matchesSearchQuery(participantQuery, [
        participant.name,
        participant.participantCode,
        participant.lastRunBlock,
      ])
    )
  }, [data?.participants, participantQuery])

  // "participantId|blockId" -> runCount, for the progress heatmap.
  const progressLookup = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of data?.progressCells ?? []) {
      map.set(`${cell.participantId}|${cell.blockId}`, cell.runCount)
    }
    return map
  }, [data?.progressCells])

  if (!classId) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.class.title ?? "Class overview"}
        description={
          data
            ? `${data.class.course.name} • ${data.stats.participants} participants • ${
                data.class.startDate
                  ? new Date(data.class.startDate).toLocaleString()
                  : "No start"
              } → ${
                data.class.endDate
                  ? new Date(data.class.endDate).toLocaleString()
                  : "No end"
              }`
            : "Loading class insights."
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={isPreviewing}
              onClick={async () => {
                setIsPreviewing(true)
                try {
                  const response = await fetch(
                    `/api/admin/classes/${classId}/preview`,
                    { method: "POST" }
                  )
                  if (!response.ok) {
                    throw new Error("Preview failed.")
                  }
                  window.location.href = "/app"
              } catch {
                setError("Unable to start preview.")
              } finally {
                setIsPreviewing(false)
                }
              }}
            >
              {isPreviewing ? "Starting..." : "View as participant"}
            </Button>
            <Button size="sm" asChild>
              <Link href={`/admin/classes/${classId}`}>Edit class</Link>
            </Button>
          </div>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {liveStatus !== "online" ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          {liveStatus === "connecting"
            ? "Connecting live updates…"
            : "Live updates paused — reconnecting…"}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="text-2xl font-semibold">{data.stats.participants}</p>
              <p className="text-xs text-muted-foreground">
                {data.stats.activeParticipants} active (15m)
              </p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Total blocks</p>
              <p className="text-2xl font-semibold">{data.stats.totalBlocks}</p>
              <p className="text-xs text-muted-foreground">
                Curriculum size
              </p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="text-2xl font-semibold">{data.stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">All activity</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Runs</p>
              <p className="text-2xl font-semibold">{data.stats.totalRuns}</p>
              <p className="text-xs text-muted-foreground">
                Code executions
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Top runners</p>
              <div className="mt-3 space-y-2">
                {data.participants
                  .slice()
                  .sort((a, b) => b.runCount - a.runCount)
                  .slice(0, 3)
                  .map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <span className="text-sm">{participant.name}</span>
                      <span className="text-sm font-semibold">
                        {participant.runCount} runs
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">
                Most blocks viewed
              </p>
              <div className="mt-3 space-y-2">
                {data.participants
                  .slice()
                  .sort((a, b) => b.progressPercent - a.progressPercent)
                  .slice(0, 3)
                  .map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <span className="text-sm">{participant.name}</span>
                      <span className="text-sm font-semibold">
                        {participant.progressPercent}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {onlineIds.size} online now
            </p>
            <div className="inline-flex rounded-md border p-0.5 text-xs">
              {(["focus", "wall"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded px-3 py-1 capitalize transition",
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "wall" ? "Wall" : "Focus"}
                </button>
              ))}
            </div>
          </div>

          {viewMode === "wall" ? (
            <div className="rounded-xl border p-4">
              {filteredParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No participants found.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredParticipants.map((participant) => {
                    const isOnline = onlineIds.has(participant.id)
                    const runResult = runResultByParticipant[participant.id]
                    const hasError = runResult ? !runResult.success : false
                    const isActive = participant.id === selectedParticipant?.id
                    return (
                      <button
                        key={participant.id}
                        type="button"
                        onClick={() => {
                          setSelectedParticipant(participant)
                          setViewMode("focus")
                        }}
                        className={cn(
                          "flex flex-col gap-2 rounded-lg border p-2 text-left transition hover:border-primary/50",
                          isActive ? "border-primary" : "border-border"
                        )}
                      >
                        <MiniMatrix
                          matrix={frameByParticipant[participant.id]}
                        />
                        <div className="flex items-center gap-1.5">
                          <PresenceDot online={isOnline} />
                          <span className="truncate text-xs font-medium">
                            {participant.name}
                          </span>
                          {hasError ? (
                            <span
                              title={runResult?.error ?? "Last run errored"}
                              className="ml-auto rounded-full bg-destructive/15 px-1.5 text-[10px] font-medium text-destructive"
                            >
                              !
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {participant.attemptedBlocks}/{participant.totalBlocks}{" "}
                          attempted
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_40%]">
            <div className="rounded-xl border">
              <div className="space-y-3 border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Participants</h3>
                <TableSearch
                  value={participantQuery}
                  onChange={setParticipantQuery}
                  placeholder="Search participants"
                  className="max-w-none"
                />
              </div>
              <div className="divide-y">
                {filteredParticipants.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted-foreground">
                    No participants found.
                  </p>
                ) : (
                  filteredParticipants.map((participant) => {
                  const isActive = participant.id === selectedParticipant?.id
                  const isOnline = onlineIds.has(participant.id)
                  const runResult = runResultByParticipant[participant.id]
                  const hasError = runResult ? !runResult.success : false
                  return (
                    <div
                      key={participant.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedParticipant(participant)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedParticipant(participant)
                        }
                      }}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition ${
                        isActive ? "bg-muted/40" : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <PresenceDot online={isOnline} />
                          <span className="truncate">{participant.name}</span>
                          {hasError ? (
                            <span
                              title={runResult?.error ?? "Last run errored"}
                              className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive"
                            >
                              error
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {participant.viewedBlocks}/{participant.totalBlocks}{" "}
                          viewed • {participant.attemptedBlocks} attempted •{" "}
                          {participant.runCount} runs
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Access code:{" "}
                          {participant.participantCode ?? "--------"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {participant.progressPercent}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {participant.lastActive
                            ? `Active ${new Date(
                                participant.lastActive
                              ).toLocaleTimeString()}`
                            : "No activity"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(event) => event.stopPropagation()}
                            className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-muted/60 text-muted-foreground transition hover:border-muted hover:text-foreground"
                          >
                            <MoreVerticalIcon className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(event) => {
                              event.preventDefault()
                              setDeleteTarget(participant)
                            }}
                          >
                            <Trash2Icon />
                            Delete participant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })
                )}
              </div>
            </div>

            <div className="rounded-xl border">
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Live code</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedParticipant
                        ? selectedParticipant.name
                        : "Select a participant"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCodeExpanded(true)}
                  >
                    Expand
                  </Button>
                </div>
              </div>
              <div className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    {liveBlockId
                      ? (() => {
                          const blockInfo = data?.blocks?.find(
                            (block) => block.id === liveBlockId
                          )
                          return blockInfo
                            ? `${blockInfo.moduleTitle} • ${blockInfo.blockTitle}`
                            : "Block in progress"
                        })()
                      : "No block yet"}
                  </div>
                  {selectedFrame ? (
                    <div className="w-20 shrink-0">
                      <MiniMatrix matrix={selectedFrame} />
                    </div>
                  ) : null}
                </div>
                {selectedRunResult &&
                !selectedRunResult.success &&
                selectedRunResult.error ? (
                  <p className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    {selectedRunResult.error}
                  </p>
                ) : null}
                <div className="overflow-hidden rounded-md border">
                  <CodeMirror
                    value={liveCode}
                    height="320px"
                    theme={codeTheme}
                    extensions={[python()]}
                    editable={false}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {liveUpdatedAt
                    ? `Updated ${new Date(liveUpdatedAt).toLocaleTimeString()}`
                    : "Waiting for updates..."}
                </div>
              </div>
            </div>
          </div>
          )}

          {data.blocks.length > 0 && data.participants.length > 0 ? (
            <div className="rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Progress heatmap</h3>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-muted-foreground/15" />
                    Not viewed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-amber-400/70" />
                    Viewed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                    Attempted
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto px-4 py-3">
                <div className="min-w-max space-y-1">
                  {filteredParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2"
                    >
                      <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                        {participant.name}
                      </span>
                      <div className="flex gap-1">
                        {data.blocks.map((block) => {
                          const runCount = progressLookup.get(
                            `${participant.id}|${block.id}`
                          )
                          const viewed = runCount !== undefined
                          const attempted = (runCount ?? 0) > 0
                          return (
                            <span
                              key={block.id}
                              title={`${block.moduleTitle} • ${block.blockTitle}${
                                attempted
                                  ? ` — ${runCount} run${runCount === 1 ? "" : "s"}`
                                  : viewed
                                    ? " — viewed"
                                    : " — not viewed"
                              }`}
                              className={cn(
                                "h-3.5 w-3.5 rounded-sm",
                                attempted
                                  ? "bg-emerald-500"
                                  : viewed
                                    ? "bg-amber-400/70"
                                    : "bg-muted-foreground/15"
                              )}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading class data...</p>
      )}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete participant?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the participant from the class and deletes their
              progress + events. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (!deleteTarget || !classId) return
                setIsDeleting(true)
                try {
                  const response = await fetch(
                    `/api/admin/classes/${classId}/participants/${deleteTarget.id}`,
                    { method: "DELETE" }
                  )
                  if (!response.ok) {
                    throw new Error("Delete failed.")
                  }
                  setDeleteTarget(null)
                  if (selectedParticipant?.id === deleteTarget.id) {
                    setSelectedParticipant(null)
                  }
                  await loadOverview(classId)
                      } catch {
                        setError("Unable to delete participant.")
                      } finally {
                        setIsDeleting(false)
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isCodeExpanded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="flex h-full w-full max-w-5xl flex-col rounded-2xl border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Live code</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedParticipant
                    ? selectedParticipant.name
                    : "Select a participant"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCodeExpanded(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <CodeMirror
                value={liveCode}
                height="100%"
                className="h-full"
                theme={codeTheme}
                extensions={[python()]}
                editable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
