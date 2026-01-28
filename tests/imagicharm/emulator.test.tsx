import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { Emulator } from "@/components/imagicharm/Emulator"
import type { Matrix } from "@/lib/imagicharm/types"
import { normalizeMatrix } from "@/lib/imagicharm/utils"

const matrix: Matrix = Array.from({ length: 8 }, () =>
  Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
)

matrix[0][0] = [255, 0, 0]

describe("Emulator", () => {
  it("renders 64 pixels and applies color", () => {
    const { container } = render(<Emulator matrix={matrix} />)
    const pixels = container.querySelectorAll("div.grid > div")
    expect(pixels.length).toBe(64)
    expect(pixels[0]).toHaveStyle({ backgroundColor: "rgb(255, 0, 0)" })
  })
})

describe("normalizeMatrix", () => {
  it("converts Map-based frames into RGB matrix", () => {
    const snapshot = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
    )
    snapshot[2][3] = [10, 20, 30]

    const frame = new Map<string, unknown>([
      ["snapshot", snapshot],
      ["duration", 500],
    ])

    const matrix = normalizeMatrix(frame.get("snapshot"))

    expect(matrix[2][3]).toEqual([10, 20, 30])
  })
})
