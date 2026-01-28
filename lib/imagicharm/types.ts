export type Pixel = [number, number, number]
export type Matrix = Pixel[][]

export type ImagiFrame = {
  snapshot: Matrix
  duration: number
}
