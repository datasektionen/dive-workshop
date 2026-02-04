"use client"

import { loadPyodideRuntime } from "@/lib/pyodide/loader"
import { IMAGI_PY } from "@/lib/imagicharm/python"
import type { ImagiFrame, Matrix } from "@/lib/imagicharm/types"
import { normalizeMatrix } from "@/lib/imagicharm/utils"

type RenderHandler = (matrix: Matrix) => void
type AnimationHandler = (frames: ImagiFrame[], loopCount: number) => void

type ImagiCharmRuntimeOptions = {
  onAnimation?: AnimationHandler
}

const IMAGI_IMPORT_LINE = "from open_imagilib.emulator import *"
const IMAGI_RENDER_CALL = "render()"
const SYNTAX_ERROR_NAMES = ["SyntaxError", "IndentationError", "TabError"]

function withImagiPreludeAndRender(code: string) {
  let result = code.trimEnd()
  if (!result.includes(IMAGI_IMPORT_LINE)) {
    result = `${IMAGI_IMPORT_LINE}\n\n${result}`
  }
  const renderRegex = /(^|\n)\s*render\(\)\s*(#.*)?$/m
  if (!renderRegex.test(result)) {
    result = `${result}\n\n${IMAGI_RENDER_CALL}\n`
  } else {
    result = `${result}\n`
  }
  return result
}

function coerceErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function adjustExecLineNumbers(message: string, offset: number) {
  if (offset <= 0) return message
  return message.replace(/(File "<exec>", line )(\d+)/g, (_, prefix, value) => {
    const nextValue = Math.max(1, Number(value) - offset)
    return `${prefix}${nextValue}`
  })
}

function getInjectedLineOffset(code: string) {
  return code.includes(IMAGI_IMPORT_LINE) ? 0 : 2
}

export function getPythonErrorMessage(error: unknown, code: string) {
  const rawMessage = coerceErrorMessage(error)
  const adjustedMessage = adjustExecLineNumbers(
    rawMessage,
    getInjectedLineOffset(code)
  )
  const lines = adjustedMessage.split("\n")
  const errorLine = [...lines]
    .reverse()
    .find((line) =>
      SYNTAX_ERROR_NAMES.some((name) => line.includes(name))
    )
  if (errorLine) {
    const execLine = adjustedMessage.match(/File "<exec>", line (\d+)/)
    if (execLine?.[1]) {
      return `${errorLine} (line ${execLine[1]})`
    }
    return errorLine
  }

  const lastMeaningful = [...lines]
    .reverse()
    .find((line) => line.trim().length > 0)
  return lastMeaningful ?? "Unable to run Python code."
}

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
  private animationHandler?: AnimationHandler

  constructor(renderHandler: RenderHandler, options?: ImagiCharmRuntimeOptions) {
    this.renderHandler = renderHandler
    this.animationHandler = options?.onAnimation
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
          this.animationHandler?.(jsFrames, loopCount || 0)
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
    await this.pyodide.runPythonAsync(withImagiPreludeAndRender(code))
  }
}
