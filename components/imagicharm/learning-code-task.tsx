"use client"

import * as React from "react"

import { Emulator } from "@/components/imagicharm/Emulator"
import { Editor } from "@/components/imagicharm/Editor"
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
  initialCode?: string
}

export function LearningCodeTask({
  className,
  blockId,
  moduleId,
  initialCode,
}: LearningCodeTaskProps) {
  const [code, setCode] = React.useState(initialCode ?? DEFAULT_CODE)
  const [matrix, setMatrix] = React.useState<Matrix>(EMPTY_MATRIX)
  const [error, setError] = React.useState("")
  const [bleError, setBleError] = React.useState("")
  const [isRunning, setIsRunning] = React.useState(false)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isConnected, setIsConnected] = React.useState(false)
  const [deviceName, setDeviceName] = React.useState("")
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const runtimeRef = React.useRef<ImagiCharmRuntime | null>(null)
  const bleRef = React.useRef<ImagiCharmBleClient | null>(null)
  const wsRef = React.useRef<WebSocket | null>(null)
  const wsRetryRef = React.useRef(0)
  const wsClosedRef = React.useRef(false)
  const latestCodeRef = React.useRef(code)
  const latestBlockRef = React.useRef(blockId)

  React.useEffect(() => {
    latestCodeRef.current = code
    latestBlockRef.current = blockId
  }, [code, blockId])

  React.useEffect(() => {
    if (!blockId) return
    if (initialCode == null) return
    setCode(initialCode || DEFAULT_CODE)
  }, [initialCode, blockId])

  React.useEffect(() => {
    bleRef.current = new ImagiCharmBleClient({
      onDisconnect: () => {
        setIsConnected(false)
        setDeviceName("")
      },
    })

    runtimeRef.current = new ImagiCharmRuntime(
      (nextMatrix) => {
        setMatrix(nextMatrix)
      },
      {
        onAnimation: (frames: ImagiFrame[], loopCount: number) => {
          if (!bleRef.current?.isConnected()) return
          void bleRef.current
            .sendAnimation(frames, loopCount)
            .catch((err) => {
              console.error("[imagi] ble send error", err)
              setBleError(
                "Unable to send to imagiCharm. Check connection and try again."
              )
            })
        },
      }
    )

    return () => {
      runtimeRef.current?.dispose()
      runtimeRef.current = null
      bleRef.current?.disconnect()
      bleRef.current = null
    }
  }, [])

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
      } catch (err) {
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

    const connect = () => {
      if (wsClosedRef.current) return
      const socket = new WebSocket(`${protocol}://${window.location.host}/ws`)
      wsRef.current = socket

      socket.addEventListener("open", () => {
        wsRetryRef.current = 0
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
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [sessionId])

  React.useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!blockId) return

    const handle = window.setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          type: "code_update",
          blockId,
          code,
        })
      )
    }, 350)

    return () => window.clearTimeout(handle)
  }, [code, blockId])

  React.useEffect(() => {
    if (!blockId) return
    const handle = window.setTimeout(() => {
      void fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockId,
          code,
        }),
      })
    }, 600)
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

    try {
      if (!runtimeRef.current) {
        runtimeRef.current = new ImagiCharmRuntime((nextMatrix) => {
          setMatrix(nextMatrix)
        })
      }
      await runtimeRef.current.run(code)
      if (blockId) {
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "code_run",
            blockId,
            moduleId,
          }),
        })
      }
    } catch (err) {
      setError(getPythonErrorMessage(err, code))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div
      className={cn(
        "learning-code-layout grid h-full min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]",
        className
      )}
    >
      <div className="learning-code-editor flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <Editor
            value={code}
            onChange={setCode}
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
          <Button
            onClick={handleRun}
            size="sm"
            className="w-full"
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </Button>
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
        <div className="mt-auto flex items-center gap-2 pb-3 text-xs text-muted-foreground">
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
  )
}
