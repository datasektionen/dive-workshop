"use client"

import * as React from "react"

import type { Matrix } from "@/lib/imagicharm/types"
import { cn } from "@/lib/utils"

const EMPTY_MATRIX: Matrix = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
)

type EmulatorProps = {
  matrix?: Matrix
  className?: string
}

export function Emulator({ matrix = EMPTY_MATRIX, className }: EmulatorProps) {
  return (
    <div className="flex justify-start">
      <div className={cn("rounded inline-block border bg-background pt-2 pl-3 pb-4 pr-4 shadow-sm", className)}>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div />
          <div className="grid grid-cols-8 gap-1 text-[10px] text-muted-foreground">
            {Array.from({ length: 8 }, (_, x) => (
              <div key={`x-${x}`} className="text-center">
                {x}
              </div>
            ))}
          </div>

          <div className="grid grid-rows-8 gap-1 text-[10px] text-muted-foreground">
            {Array.from({ length: 8 }, (_, y) => (
              <div key={`y-${y}`} className="flex h-6 items-center justify-center">
                {y}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-1">
            {matrix.flatMap((row, y) =>
              row.map((pixel, x) => {
                const [r, g, b] = pixel
                return (
                  <div
                    key={`${y}-${x}`}
                    className="h-6 w-6 rounded-xs border border-muted"
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
