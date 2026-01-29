"use client"

import * as React from "react"

import { Emulator } from "@/components/imagicharm/Emulator"
import { Editor } from "@/components/imagicharm/Editor"
import { Button } from "@/components/ui/button"
import { ImagiCharmRuntime } from "@/lib/imagicharm/runtime"
import type { Matrix } from "@/lib/imagicharm/types"

const DEFAULT_CODE = `# Fill the display with a color so you can see output immediately
for y in range(8):
    for x in range(8):
        m[y][x] = (20, 160, 255)
`

const EMPTY_MATRIX: Matrix = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
)

export function LearningCodeTask() {
  const [code, setCode] = React.useState(DEFAULT_CODE)
  const [matrix, setMatrix] = React.useState<Matrix>(EMPTY_MATRIX)
  const [error, setError] = React.useState("")
  const [isRunning, setIsRunning] = React.useState(false)
  const runtimeRef = React.useRef<ImagiCharmRuntime | null>(null)

  React.useEffect(() => {
    runtimeRef.current = new ImagiCharmRuntime((nextMatrix) => {
      setMatrix(nextMatrix)
    })

    return () => {
      runtimeRef.current?.dispose()
      runtimeRef.current = null
    }
  }, [])

  async function handleRun() {
    setError("")
    setIsRunning(true)

    try {
      if (!runtimeRef.current) {
        runtimeRef.current = new ImagiCharmRuntime((nextMatrix) => {
          setMatrix(nextMatrix)
        })
      }
      await runtimeRef.current.run(code)
    } catch (err) {
      setError("Unable to run Python code. Check syntax and try again.")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Code workspace</p>
          <Button onClick={handleRun} size="sm" disabled={isRunning}>
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
        <Editor value={code} onChange={setCode} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Emulator</p>
        <Emulator matrix={matrix} />
      </div>
    </div>
  )
}
