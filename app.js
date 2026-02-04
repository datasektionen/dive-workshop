"use strict";

const SERVICE_UUID = "4ced8831-02f6-439a-b89b-36f51cbc4feb";
const WRITE_UUID = "4ced8832-02f6-439a-b89b-36f51cbc4feb";
const NOTIFY_UUID = "4ced8833-02f6-439a-b89b-36f51cbc4feb";

let device = null;
let server = null;
let service = null;
let writeChar = null;
let notifyChar = null;

function logStatus(msg) {
  const status = document.getElementById("status");
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  status.textContent =
    status.textContent === "idle" ? line : `${status.textContent}\n${line}`;
}

function clampByte(v) {
  if (Number.isNaN(v) || v == null) return 0;
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v | 0;
}

function quantizeChannel(value, levels) {
  const a = clampByte(value);
  if (a === 0) return 0;
  const mapped = 1 + ((levels - 1) * (a - 1)) / 254;
  return Math.round(mapped);
}

function parseRgb(csv) {
  if (typeof csv !== "string") return [0, 0, 0];
  const parts = csv.split(",").map((p) => parseInt(p.trim(), 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function asciiBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    bytes.push(code <= 0x7f ? code : 0x3f);
  }
  return bytes;
}

function u16be(n) {
  const v = n >>> 0;
  return [(v >>> 8) & 0xff, v & 0xff];
}

function u24be(n) {
  const v = n >>> 0;
  return [(v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
}

function buildScrollingTextPacket({
  text,
  textColor,
  backColor,
  durationMs,
  loopCount,
  outdoorMode,
}) {
  const levels = outdoorMode ? 15 : 9;
  const [tr, tg, tb] = parseRgb(textColor);
  const [br, bg, bb] = parseRgb(backColor);

  const payload = [
    0x22,
    quantizeChannel(tr, levels),
    quantizeChannel(tg, levels),
    quantizeChannel(tb, levels),
    quantizeChannel(br, levels),
    quantizeChannel(bg, levels),
    quantizeChannel(bb, levels),
    ...u24be(durationMs),
    ...u16be(loopCount),
  ];

  const textBytes = asciiBytes(text || "");
  const capped = textBytes.slice(0, 100);
  const padLen = 100 - Math.min(textBytes.length, 100) + 88;

  for (let i = 0; i < capped.length; i += 1) payload.push(capped[i]);
  for (let i = 0; i < padLen; i += 1) payload.push(0);

  return new Uint8Array(payload);
}

function buildFramePacket(frameIndex, frame, durationMs, outdoorMode) {
  const levels = outdoorMode ? 15 : 9;
  const pixels = (frame || "").split(";").filter((p) => p.length > 0);

  const payload = [0x11, frameIndex & 0xff];
  for (let i = 0; i < pixels.length; i += 1) {
    const [r, g, b] = parseRgb(pixels[i]);
    payload.push(
      quantizeChannel(r, levels),
      quantizeChannel(g, levels),
      quantizeChannel(b, levels),
    );
  }
  payload.push(...u24be(durationMs));
  return new Uint8Array(payload);
}

function buildAnimationFooter(numFrames, loopCount) {
  return new Uint8Array([0x11, numFrames & 0xff, ...u16be(loopCount)]);
}

function solidFrame(r, g, b) {
  const pixels = [];
  for (let i = 0; i < 64; i += 1) pixels.push(`${r},${g},${b}`);
  return pixels.join(";");
}

async function connect() {
  if (!("bluetooth" in navigator)) {
    logStatus("Web Bluetooth not supported in this browser.");
    return;
  }

  device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: "imagiCharm", services: [SERVICE_UUID] }],
    optionalServices: [SERVICE_UUID],
  });

  server = await device.gatt.connect();
  service = await server.getPrimaryService(SERVICE_UUID);
  writeChar = await service.getCharacteristic(WRITE_UUID);
  notifyChar = await service.getCharacteristic(NOTIFY_UUID);

  await notifyChar.startNotifications();
  logStatus(`Connected to ${device.name || "device"}`);
}

async function disconnect() {
  if (device && device.gatt && device.gatt.connected) {
    device.gatt.disconnect();
    logStatus("Disconnected");
  }
}

async function writePacket(packet) {
  if (!writeChar) throw new Error("Not connected");
  await writeChar.writeValue(packet);
}

async function sendScrollingText() {
  const packet = buildScrollingTextPacket({
    text: document.getElementById("scrollText").value,
    textColor: document.getElementById("textColor").value,
    backColor: document.getElementById("backColor").value,
    durationMs:
      parseInt(document.getElementById("scrollDuration").value, 10) || 0,
    loopCount: parseInt(document.getElementById("scrollLoop").value, 10) || 0,
    outdoorMode: document.getElementById("scrollOutdoor").value === "true",
  });

  await writePacket(packet);
  logStatus("Sent scrolling text");
}

async function sendDemoAnimation() {
  const outdoorMode = document.getElementById("animOutdoor").value === "true";
  const loopCount =
    parseInt(document.getElementById("animLoop").value, 10) || 0;

  const frames = [
    { durationMs: 250, frame: solidFrame(0, 0, 255) },
    { durationMs: 250, frame: solidFrame(0, 255, 0) },
  ];

  for (let i = 0; i < frames.length; i += 1) {
    const f = frames[i];
    const packet = buildFramePacket(i, f.frame, f.durationMs, outdoorMode);
    await writePacket(packet);
  }

  const footer = buildAnimationFooter(frames.length, loopCount);
  await writePacket(footer);
  logStatus("Sent demo animation");
}

async function sendSolidColor(r, g, b) {
  const outdoorMode = document.getElementById("animOutdoor").value === "true";
  const loopCount = 1;
  const frames = [{ durationMs: 1000, frame: solidFrame(r, g, b) }];

  const packet = buildFramePacket(
    0,
    frames[0].frame,
    frames[0].durationMs,
    outdoorMode,
  );
  await writePacket(packet);
  await writePacket(buildAnimationFooter(frames.length, loopCount));
  logStatus(`Sent solid color ${r},${g},${b}`);
}

function bindUI() {
  document.getElementById("connectBtn").addEventListener("click", () => {
    connect().catch((err) => logStatus(`Connect error: ${err.message}`));
  });

  document.getElementById("disconnectBtn").addEventListener("click", () => {
    disconnect().catch((err) => logStatus(`Disconnect error: ${err.message}`));
  });

  document.getElementById("clearLogBtn").addEventListener("click", () => {
    document.getElementById("status").textContent = "idle";
  });

  document.getElementById("sendScrollBtn").addEventListener("click", () => {
    sendScrollingText().catch((err) => logStatus(`Send error: ${err.message}`));
  });

  document.getElementById("sendAnimBtn").addEventListener("click", () => {
    sendDemoAnimation().catch((err) => logStatus(`Send error: ${err.message}`));
  });

  document.getElementById("sendRedBtn").addEventListener("click", () => {
    sendSolidColor(255, 0, 0).catch((err) =>
      logStatus(`Send error: ${err.message}`),
    );
  });

  document.getElementById("sendGreenBtn").addEventListener("click", () => {
    sendSolidColor(0, 255, 0).catch((err) =>
      logStatus(`Send error: ${err.message}`),
    );
  });

  document.getElementById("sendBlueBtn").addEventListener("click", () => {
    sendSolidColor(0, 0, 255).catch((err) =>
      logStatus(`Send error: ${err.message}`),
    );
  });
}

bindUI();
