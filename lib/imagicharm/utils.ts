"use client"

import type { Matrix } from "@/lib/imagicharm/types"

export function normalizeMatrix(input: any): Matrix {
  if (input && typeof input.toJs === "function") {
    input = input.toJs({ create_proxies: false })
  }
  const matrix: Matrix = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => [0, 0, 0] as [number, number, number])
  )

  if (!Array.isArray(input)) {
    return matrix
  }

  for (let y = 0; y < 8; y += 1) {
    let row = input[y]
    if (row && typeof row.toJs === "function") {
      row = row.toJs({ create_proxies: false })
    }
    if (!Array.isArray(row)) continue
    for (let x = 0; x < 8; x += 1) {
      let pixel = row[x]
      if (pixel && typeof pixel.toJs === "function") {
        pixel = pixel.toJs({ create_proxies: false })
      }
      if (Array.isArray(pixel) && pixel.length >= 3) {
        matrix[y][x] = [
          Number(pixel[0]) || 0,
          Number(pixel[1]) || 0,
          Number(pixel[2]) || 0,
        ]
      }
    }
  }

  return matrix
}
