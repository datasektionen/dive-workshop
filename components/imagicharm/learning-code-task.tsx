"use client"

import * as React from "react"
import { RotateCcwIcon } from "lucide-react"

import { Emulator } from "@/components/imagicharm/Emulator"
import { Editor } from "@/components/imagicharm/Editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { ImagiCharmBleClient } from "@/lib/imagicharm/ble"
import { ImagiCharmRuntime, getPythonErrorMessage } from "@/lib/imagicharm/runtime"
import type { ImagiFrame, Matrix } from "@/lib/imagicharm/types"
import { cn } from "@/lib/utils"

const DEFAULT_CODE = `# Fill the display with a color so you can see output immediately
for y in range(8):
    for x in range(8):
        m[y][x] = (20, 160, 255)
`

const EMPTY_MATRIX: Matrix = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
)

type LearningCodeTaskProps = {
  className?: string
  blockId?: string
  moduleId?: string
  code: string
  defaultCode?: string
  onCodeChange: (nextCode: string) => void
}

const FRAME_STREAM_INTERVAL_MS = 150

export function LearningCodeTask({
  className,
  blockId,
  moduleId,
  code,
  defaultCode,
  onCodeChange,
}: LearningCodeTaskProps) {
  const resolvedDefaultCode =
    typeof defaultCode === "string" && defaultCode.trim()
      ? defaultCode
      : DEFAULT_CODE
  const [matrix, setMatrix] = React.useState<Matrix>(EMPTY_MATRIX)
  const [error, setError] = React.useState("")
  const [bleError, setBleError] = React.useState("")
  const [isRunning, setIsRunning] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isConnected, setIsConnected] = React.useState(false)
  const [deviceName, setDeviceName] = React.useState("")
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [liveStatus, setLiveStatus] = React.useState<
    "connecting" | "online" | "reconnecting"
  >("connecting")
  const runtimeRef = React.useRef<ImagiCharmRuntime | null>(null)
  const bleRef = React.useRef<ImagiCharmBleClient | null>(null)
  const wsRef = React.useRef<WebSocket | null>(null)
  const wsRetryRef = React.useRef(0)
  const wsClosedRef = React.useRef(false)
  const wsReconnectTimerRef = React.useRef<number | null>(null)
  const latestCodeRef = React.useRef(code)
  const latestBlockRef = React.useRef(blockId)
  latestBlockRef.current = blockId
  const frameThrottleRef = React.useRef<{
    last: number
    timer: number | null
    pending: Matrix | null
  }>({ last: 0, timer: null, pending: null })

  // Stream the participant's current display (an 8x8 RGB matrix) to watching
  // admins, throttled so animations don't flood the socket. Always sends a
  // trailing frame so the last state is never lost.
  const streamFrame = React.useCallback((nextMatrix: Matrix) => {
    const targetBlockId = latestBlockRef.current
    const socket = wsRef.current
    if (!targetBlockId || !socket || socket.readyState !== WebSocket.OPEN) {
      return
    }
    const send = (m: Matrix) =>
      socket.send(
        JSON.stringify({ type: "frame_update", blockId: targetBlockId, matrix: m })
      )
    const state = frameThrottleRef.current
    const now = Date.now()
    if (now - state.last >= FRAME_STREAM_INTERVAL_MS) {
      state.last = now
      send(nextMatrix)
      return
    }
    state.pending = nextMatrix
    if (state.timer === null) {
      state.timer = window.setTimeout(
        () => {
          state.timer = null
          state.last = Date.now()
          if (state.pending) {
            send(state.pending)
            state.pending = null
          }
        },
        FRAME_STREAM_INTERVAL_MS - (now - state.last)
      )
    }
  }, [])

  const handleRenderFrame = React.useCallback(
    (nextMatrix: Matrix) => {
      setMatrix(nextMatrix)
      streamFrame(nextMatrix)
    },
    [streamFrame]
  )

  const handleCodeChange = React.useCallback(
    (nextCode: string) => {
      latestCodeRef.current = nextCode
      onCodeChange(nextCode)
    },
    [onCodeChange]
  )

  React.useEffect(() => {
    latestCodeRef.current = code
  }, [code])

  React.useEffect(() => {
    bleRef.current = new ImagiCharmBleClient({
      onDisconnect: () => {
        setIsConnected(false)
        setDeviceName("")
      },
    })

    runtimeRef.current = new ImagiCharmRuntime(handleRenderFrame, {
      onAnimation: (frames: ImagiFrame[], loopCount: number) => {
        if (!bleRef.current?.isConnected()) return
        void bleRef.current.sendAnimation(frames, loopCount).catch((err) => {
          console.error("[imagi] ble send error", err)
          setBleError(
            "Unable to send to imagiCharm. Check connection and try again."
          )
        })
      },
    })

    const frameThrottle = frameThrottleRef.current
    return () => {
      runtimeRef.current?.dispose()
      runtimeRef.current = null
      bleRef.current?.disconnect()
      bleRef.current = null
      if (frameThrottle.timer !== null) {
        window.clearTimeout(frameThrottle.timer)
        frameThrottle.timer = null
      }
    }
  }, [handleRenderFrame])

  React.useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const response = await fetch("/api/session")
        if (!response.ok) return
        const data = (await response.json()) as { sessionId?: string }
        if (active && data.sessionId) {
          setSessionId(data.sessionId)
        }
      } catch {
        // Ignore session errors.
      }
    }

    loadSession()

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    if (!sessionId || typeof window === "undefined") return
    wsClosedRef.current = false
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"

    setLiveStatus("connecting")
    const connect = () => {
      if (wsClosedRef.current) return
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
      wsRef.current = socket

      socket.addEventListener("open", () => {
        wsRetryRef.current = 0
        setLiveStatus("online")
        if (!latestBlockRef.current) return
        socket.send(
          JSON.stringify({
            type: "code_update",
            blockId: latestBlockRef.current,
            code: latestCodeRef.current,
          })
        )
      })

      socket.addEventListener("close", () => {
        if (wsClosedRef.current) return
        setLiveStatus("reconnecting")
        // Keep retrying with capped exponential backoff instead of silently
        // giving up after a few attempts, so live sync recovers on its own.
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
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [sessionId])

  React.useEffect(() => {
    if (!blockId) return

    // Always schedule the debounced send. We check readiness inside the
    // timeout rather than bailing up front, so edits made while the socket
    // is still connecting are not silently dropped — if the socket has
    // opened by the time the timer fires, the update is sent.
    const handle = window.setTimeout(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return
      wsRef.current.send(
        JSON.stringify({
          type: "code_update",
          blockId,
          code: latestCodeRef.current,
        })
      )
    }, 350)

    return () => window.clearTimeout(handle)
  }, [code, blockId])

  async function handleConnect() {
    setBleError("")
    setIsConnecting(true)

    try {
      if (!bleRef.current) {
        bleRef.current = new ImagiCharmBleClient({
          onDisconnect: () => {
            setIsConnected(false)
            setDeviceName("")
          },
        })
      }
      const name = await bleRef.current.connect()
      setIsConnected(true)
      setDeviceName(name)
    } catch (err) {
      console.error("[imagi] ble connect error", err)
      setBleError(
        err instanceof Error ? err.message : "Unable to connect to imagiCharm."
      )
    } finally {
      setIsConnecting(false)
    }
  }

  function handleDisconnect() {
    bleRef.current?.disconnect()
    setIsConnected(false)
    setDeviceName("")
    setBleError("")
  }

  async function handleRun() {
    setError("")
    setBleError("")
    setIsRunning(true)
    const runCode = latestCodeRef.current
    let runError: string | null = null

    try {
      if (!runtimeRef.current) {
        runtimeRef.current = new ImagiCharmRuntime(handleRenderFrame)
      }
      await runtimeRef.current.run(runCode)
    } catch (err) {
      runError = getPythonErrorMessage(err, runCode)
      setError(runError)
    } finally {
      setIsRunning(false)
    }

    if (blockId) {
      const success = runError === null
      // Persist the run: a successful run counts toward progress (code_run);
      // a failure is logged separately so it does not inflate run counts but
      // is still available for error analytics.
      void fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: success ? "code_run" : "code_error",
          blockId,
          moduleId,
          metadata: { success, error: runError },
        }),
      })
      // Live error/success signal for watching admins.
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "run_result",
            blockId,
            success,
            error: runError,
          })
        )
      }
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Run with Cmd/Ctrl+Enter from anywhere in the task (incl. the editor).
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      if (!isRunning) void handleRun()
    }
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className={cn(
        "learning-code-layout grid h-full min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]",
        className
      )}
    >
      <div className="learning-code-editor flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Editor
            value={code}
            onChange={handleCodeChange}
            height="100%"
            className="h-full"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {bleError ? <p className="text-sm text-destructive">{bleError}</p> : null}
      </div>
      <div className="learning-code-side flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-4 pt-2">
        <div className="flex items-start justify-center">
          <Emulator matrix={matrix} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button
              onClick={handleRun}
              size="sm"
              className="w-full"
              disabled={isRunning}
              title="Run (⌘/Ctrl+Enter)"
            >
              {isRunning ? "Running..." : "Run"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Reset code to default"
                  disabled={code === resolvedDefaultCode}
                >
                  <RotateCcwIcon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset code?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace your current code with the block default
                    code.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCodeChange(resolvedDefaultCode)}
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleConnect}
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={isConnecting || isConnected}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
            <Button
              onClick={handleDisconnect}
              size="sm"
              variant="outline"
              className="w-full"
              disabled={!isConnected}
            >
              Disconnect
            </Button>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-1 pb-3 text-xs text-muted-foreground">
          {liveStatus === "reconnecting" ? (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Live sync reconnecting…</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            <span>
              {isConnected
                ? (deviceName || "ImagiCharm connected")
                : "ImagiCharm not connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
