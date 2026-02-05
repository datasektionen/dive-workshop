"use client"

import type { ImagiFrame, Matrix, Pixel } from "@/lib/imagicharm/types"
import { normalizeMatrix } from "@/lib/imagicharm/utils"

const SERVICE_UUID = "4ced8831-02f6-439a-b89b-36f51cbc4feb"
const WRITE_UUID = "4ced8832-02f6-439a-b89b-36f51cbc4feb"
const NOTIFY_UUID = "4ced8833-02f6-439a-b89b-36f51cbc4feb"

type BleClientOptions = {
  onDisconnect?: () => void
}

function clampByte(value: number) {
  if (Number.isNaN(value) || value == null) return 0
  if (value < 0) return 0
  if (value > 255) return 255
  return value | 0
}

function quantizeChannel(value: number, levels: number) {
  const clamped = clampByte(value)
  if (clamped === 0) return 0
  const mapped = 1 + ((levels - 1) * (clamped - 1)) / 254
  return Math.round(mapped)
}

function u16be(value: number) {
  const v = value >>> 0
  return [(v >>> 8) & 0xff, v & 0xff]
}

function u24be(value: number) {
  const v = value >>> 0
  return [(v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]
}

function normalizePixel(pixel?: Pixel): Pixel {
  if (!pixel) return [0, 0, 0]
  return [clampByte(pixel[0]), clampByte(pixel[1]), clampByte(pixel[2])]
}

function matrixToPixels(matrix: Matrix) {
  const pixels: Pixel[] = []
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      pixels.push(normalizePixel(matrix?.[y]?.[x]))
    }
  }
  return pixels
}

function buildFramePacket(
  frameIndex: number,
  matrix: Matrix,
  durationMs: number,
  outdoorMode: boolean
) {
  const levels = outdoorMode ? 15 : 9
  const pixels = matrixToPixels(matrix)

  const payload = [0x11, frameIndex & 0xff]
  for (let i = 0; i < pixels.length; i += 1) {
    const [r, g, b] = pixels[i]
    payload.push(
      quantizeChannel(r, levels),
      quantizeChannel(g, levels),
      quantizeChannel(b, levels)
    )
  }
  payload.push(...u24be(durationMs))
  return new Uint8Array(payload)
}

function buildAnimationFooter(numFrames: number, loopCount: number) {
  return new Uint8Array([0x11, numFrames & 0xff, ...u16be(loopCount)])
}

function getFrameValue(frame: any, key: string) {
  if (!frame) return undefined
  if (frame instanceof Map) {
    return frame.get(key)
  }
  return frame[key]
}

export class ImagiCharmBleClient {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private service: BluetoothRemoteGATTService | null = null
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null
  private notifyChar: BluetoothRemoteGATTCharacteristic | null = null
  private onDisconnect?: () => void

  constructor(options?: BleClientOptions) {
    this.onDisconnect = options?.onDisconnect
    this.handleDisconnect = this.handleDisconnect.bind(this)
  }

  private handleDisconnect() {
    this.cleanup()
    this.onDisconnect?.()
  }

  private cleanup() {
    if (this.device) {
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.handleDisconnect
      )
    }
    this.server = null
    this.service = null
    this.writeChar = null
    this.notifyChar = null
  }

  isConnected() {
    return Boolean(this.device?.gatt?.connected && this.writeChar)
  }

  async connect() {
    const bluetooth = navigator.bluetooth
    if (!bluetooth) {
      throw new Error("Web Bluetooth is not supported in this browser.")
    }

    if (this.isConnected() && this.device) {
      return this.device.name || "imagiCharm"
    }

    const device = await bluetooth.requestDevice({
      filters: [{ namePrefix: "imagiCharm", services: [SERVICE_UUID] }],
      optionalServices: [SERVICE_UUID],
    })

    this.cleanup()
    this.device = device
    this.device.addEventListener("gattserverdisconnected", this.handleDisconnect)

    const gatt = device.gatt
    if (!gatt) {
      throw new Error("Unable to connect to imagiCharm.")
    }
    this.server = await gatt.connect()
    if (!this.server) {
      throw new Error("Unable to connect to imagiCharm.")
    }

    this.service = await this.server.getPrimaryService(SERVICE_UUID)
    this.writeChar = await this.service.getCharacteristic(WRITE_UUID)
    this.notifyChar = await this.service.getCharacteristic(NOTIFY_UUID)
    await this.notifyChar.startNotifications()

    return device.name || "imagiCharm"
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.cleanup()
  }

  async sendAnimation(
    frames: ImagiFrame[],
    loopCount: number,
    outdoorMode = false
  ) {
    if (!this.writeChar) {
      throw new Error("Not connected to imagiCharm.")
    }

    if (!frames || frames.length === 0) {
      return
    }

    for (let i = 0; i < frames.length; i += 1) {
      const frame = frames[i]
      const snapshot = getFrameValue(frame, "snapshot")
      const durationValue = getFrameValue(frame, "duration")
      const packet = buildFramePacket(
        i,
        normalizeMatrix(snapshot),
        Math.max(0, Math.floor(Number(durationValue) || 0)),
        outdoorMode
      )
      await this.writeChar.writeValue(packet)
    }

    const footer = buildAnimationFooter(frames.length, loopCount || 0)
    await this.writeChar.writeValue(footer)
  }
}
