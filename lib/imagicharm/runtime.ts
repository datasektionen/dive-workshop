"use client"

import { loadPyodideRuntime } from "@/lib/pyodide/loader"
import { IMAGI_PY } from "@/lib/imagicharm/python"
import type { ImagiFrame, Matrix } from "@/lib/imagicharm/types"
import { normalizeMatrix } from "@/lib/imagicharm/utils"

type RenderHandler = (matrix: Matrix) => void

function getFrameValue(frame: any, key: string) {
  if (!frame) return undefined
  if (frame instanceof Map) {
    return frame.get(key)
  }
  return frame[key]
}

function toJsValue(value: any) {
  if (value && typeof value.toJs === "function") {
    return value.toJs({ create_proxies: false })
  }
  return value
}

export class ImagiCharmRuntime {
  private pyodide: any | null = null
  private timers: number[] = []
  private initialized = false
  private renderHandler: RenderHandler

  constructor(renderHandler: RenderHandler) {
    this.renderHandler = renderHandler
  }

  async init() {
    if (this.initialized) return
    this.pyodide = await loadPyodideRuntime()

    if (!this.pyodide.__imagiBridge) {
      this.pyodide.registerJsModule("imagi_js", {
        render: (frames: ImagiFrame[] | any, loopCount: number) => {
          console.log("[imagi] render called", { frames, loopCount })
          const jsFrames = toJsValue(frames) as ImagiFrame[]
          console.log("[imagi] render frames converted", jsFrames)
          this.playFrames(jsFrames, loopCount || 0)
        },
      })
      this.pyodide.__imagiBridge = true
    }

    this.initialized = true
  }

  dispose() {
    this.clearTimers()
  }

  private clearTimers() {
    this.timers.forEach((timer) => window.clearTimeout(timer))
    this.timers = []
  }

  private playFrames(frames: ImagiFrame[] = [], loopCount: number) {
    this.clearTimers()

    console.log("[imagi] playFrames", { frames, loopCount })

    if (!frames || frames.length === 0) {
      console.warn("[imagi] No frames to render.")
      return
    }

    let loops = 0
    const schedule = () => {
      let delay = 0
      frames.forEach((frame) => {
        const snapshot = getFrameValue(frame, "snapshot")
        const durationValue = getFrameValue(frame, "duration")
        const frameMatrix = normalizeMatrix(snapshot)
        console.log("[imagi] frame", frame, frameMatrix)
        const duration = Math.max(25, Number(durationValue) || 500)
        this.timers.push(
          window.setTimeout(() => {
            this.renderHandler(frameMatrix)
          }, delay)
        )
        delay += duration
      })
      this.timers.push(
        window.setTimeout(() => {
          loops += 1
          if (loopCount === 0 || loops < loopCount) {
            schedule()
          }
        }, delay)
      )
    }

    schedule()
  }

  async run(code: string) {
    await this.init()
    this.clearTimers()

    if (!this.pyodide) {
      throw new Error("Pyodide failed to load.")
    }

    await this.pyodide.runPythonAsync(IMAGI_PY)
    await this.pyodide.runPythonAsync(code)
  }
}
