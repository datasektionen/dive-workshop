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

type ParticipantRow = {
  id: string
  name: string
  joinedAt: string
  progressPercent: number
  completedBlocks: number
  totalBlocks: number
  runCount: number
  lastActive: string | null
  lastRunBlock: string | null
  participantCode: string | null
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
  const [liveCode, setLiveCode] = React.useState("")
  const [liveBlockId, setLiveBlockId] = React.useState<string | null>(null)
  const [liveUpdatedAt, setLiveUpdatedAt] = React.useState<string | null>(null)
  const [isCodeExpanded, setIsCodeExpanded] = React.useState(false)
  const codeTheme = useCodeMirrorTheme()
  const socketRef = React.useRef<WebSocket | null>(null)
  const selectedRef = React.useRef<ParticipantRow | null>(null)
  const wsRetryRef = React.useRef(0)
  const wsClosedRef = React.useRef(false)
  const [isPreviewing, setIsPreviewing] = React.useState(false)
  const [deleteTarget, setDeleteTarget] =
    React.useState<ParticipantRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    selectedRef.current = selectedParticipant
  }, [selectedParticipant])

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
    } catch (err) {
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

  React.useEffect(() => {
    if (typeof window === "undefined") return
    wsClosedRef.current = false
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"

    const connect = () => {
      if (wsClosedRef.current) return
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
      socketRef.current = socket

      socket.addEventListener("open", () => {
        wsRetryRef.current = 0
        if (!selectedRef.current) return
        socket.send(
          JSON.stringify({
            type: "subscribe",
            participantId: selectedRef.current.id,
          })
        )
      })

      socket.addEventListener("message", (event) => {
        let payload: any
        try {
          payload = JSON.parse(event.data)
        } catch (err) {
          return
        }
        if (payload?.type === "code_update") {
          if (payload.participantId !== selectedParticipant?.id) return
          setLiveCode(payload.code ?? "")
          setLiveBlockId(payload.blockId ?? null)
          setLiveUpdatedAt(payload.updatedAt ?? null)
        }
      })

      socket.addEventListener("close", () => {
        if (wsClosedRef.current) return
        const nextRetry = wsRetryRef.current + 1
        wsRetryRef.current = nextRetry
        if (nextRetry > 3) return
        const timeout = 500 * nextRetry
        window.setTimeout(connect, timeout)
      })
    }

    connect()

    return () => {
      wsClosedRef.current = true
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [selectedParticipant?.id])

  React.useEffect(() => {
    if (!selectedParticipant || !classId) return
    const participantId = selectedParticipant.id
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
          setLiveCode(payload.code ?? "")
          setLiveBlockId(payload.blockId ?? null)
          setLiveUpdatedAt(payload.updatedAt ?? null)
        }
      } catch (err) {
        if (active) {
          setLiveCode("")
          setLiveBlockId(null)
          setLiveUpdatedAt(null)
        }
      }
    }
    loadStoredCode()
    return () => {
      active = false
    }
  }, [selectedParticipant?.id, classId])

  React.useEffect(() => {
    if (!selectedParticipant || !socketRef.current) return
    if (socketRef.current.readyState !== WebSocket.OPEN) return
    socketRef.current.send(
      JSON.stringify({ type: "subscribe", participantId: selectedParticipant.id })
    )
  }, [selectedParticipant])

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
                } catch (err) {
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
              <p className="text-xs text-muted-foreground">Most progress</p>
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

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_40%]">
            <div className="rounded-xl border">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Participants</h3>
              </div>
              <div className="divide-y">
                {data.participants.map((participant) => {
                  const isActive = participant.id === selectedParticipant?.id
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
                      <div className="flex-1">
                        <p className="text-sm font-medium">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {participant.completedBlocks}/{participant.totalBlocks}{" "}
                          blocks • {participant.runCount} runs
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
                })}
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
                } catch (err) {
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
