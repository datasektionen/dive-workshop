// Minimal Web Bluetooth typings for client-only usage.

declare interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}

declare interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>
}

declare interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>
}

declare interface BluetoothDevice extends EventTarget {
  name?: string
  gatt?: BluetoothRemoteGATTServer
  addEventListener(
    type: "gattserverdisconnected",
    listener: EventListenerOrEventListenerObject
  ): void
  removeEventListener(
    type: "gattserverdisconnected",
    listener: EventListenerOrEventListenerObject
  ): void
}

declare interface Bluetooth {
  requestDevice(options: {
    filters: Array<{ namePrefix?: string; services?: string[] }>
    optionalServices?: string[]
  }): Promise<BluetoothDevice>
}

declare interface Navigator {
  bluetooth?: Bluetooth
}
