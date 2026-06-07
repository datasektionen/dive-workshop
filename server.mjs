import "dotenv/config";
import { createServer } from "http";
import crypto from "crypto";
import next from "next";
import { WebSocketServer } from "ws";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dive",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error"] });

const SESSION_COOKIE = "dive_session";
const PREVIEW_COOKIE = "dive_preview";
const ADMIN_SESSION_TYPE = "admin";
const PARTICIPANT_SESSION_TYPE = "participant";
const PREVIEW_SESSION_TYPE = "preview";

const participantSockets = new Map();
const latestCodeByParticipant = new Map();
const latestFrameByParticipant = new Map();
const latestRunResultByParticipant = new Map();
const adminSockets = new Set();
const adminSubscriptions = new Map();

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function findSession(token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session;
}

async function authenticate(request) {
  const cookies = parseCookies(request.headers.cookie || "");

  // Mirror getParticipantFromRequest: a valid preview cookie wins so that
  // instructor "view as participant" sessions can open the live WebSocket.
  const previewSession = await findSession(cookies[PREVIEW_COOKIE]);
  if (previewSession && previewSession.type === PREVIEW_SESSION_TYPE) {
    return {
      role: "participant",
      sessionId: previewSession.id,
      participantId: previewSession.participantId,
      classId: previewSession.classId,
      name: previewSession.name,
      isPreview: true,
    };
  }

  const session = await findSession(cookies[SESSION_COOKIE]);
  if (!session) return null;

  if (session.type === ADMIN_SESSION_TYPE) {
    return {
      role: "admin",
      adminId: session.adminId,
      name: session.admin?.fullName,
    };
  }
  if (
    session.type === PARTICIPANT_SESSION_TYPE ||
    session.type === PREVIEW_SESSION_TYPE
  ) {
    return {
      role: "participant",
      sessionId: session.id,
      participantId: session.participantId,
      classId: session.classId,
      name: session.name,
      isPreview: session.type === PREVIEW_SESSION_TYPE,
    };
  }
  return null;
}

function sendJson(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function isParticipantOnline(participantId) {
  const sockets = participantSockets.get(participantId);
  return Boolean(sockets && sockets.size > 0);
}

// Notify every admin currently subscribed to `participantId` about a
// presence change (online/offline).
function broadcastPresence(participantId, online) {
  for (const adminSocket of adminSockets) {
    if (adminSubscriptions.get(adminSocket)?.has(participantId)) {
      sendJson(adminSocket, { type: "presence", participantId, online });
    }
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ noServer: true });

  const nextUpgradeHandler = app.getUpgradeHandler();

  server.on("upgrade", async (request, socket, head) => {
    if (request.url && request.url.startsWith("/ws")) {
      try {
        const auth = await authenticate(request);
        if (!auth) {
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          ws.__auth = auth;
          wss.emit("connection", ws, request);
        });
      } catch (err) {
        socket.destroy();
      }
      return;
    }

    nextUpgradeHandler(request, socket, head);
  });

  wss.on("connection", (ws) => {
    const auth = ws.__auth;
    if (!auth) {
      ws.close();
      return;
    }

    if (auth.role === "participant") {
      // Track all sockets per participant so a second tab does not orphan the
      // first connection's socket in the map.
      if (auth.participantId) {
        let sockets = participantSockets.get(auth.participantId);
        const wasOnline = Boolean(sockets && sockets.size > 0);
        if (!sockets) {
          sockets = new Set();
          participantSockets.set(auth.participantId, sockets);
        }
        sockets.add(ws);
        // Announce presence only on the first connection (online edge).
        if (!wasOnline) {
          broadcastPresence(auth.participantId, true);
        }
      }
    } else {
      adminSockets.add(ws);
      adminSubscriptions.set(ws, new Set());
    }

    sendJson(ws, { type: "connected", role: auth.role });

    ws.on("message", (data) => {
      let payload;
      try {
        payload = JSON.parse(data.toString());
      } catch (err) {
        return;
      }

      if (auth.role === "admin") {
        if (payload?.type === "subscribe") {
          // Accept either a single participantId or a list, so the overview
          // can watch the whole class at once (classroom wall) or a single
          // participant (focus view).
          const ids = Array.isArray(payload.participantIds)
            ? payload.participantIds.filter((id) => typeof id === "string")
            : typeof payload.participantId === "string"
              ? [payload.participantId]
              : [];
          const subscription = new Set(ids);
          adminSubscriptions.set(ws, subscription);
          sendJson(ws, { type: "subscribed", participantIds: ids });

          // Replay the latest cached state + presence for every subscribed
          // participant so a freshly connected admin is immediately current.
          const online = [];
          for (const id of subscription) {
            const code = latestCodeByParticipant.get(id);
            if (code) sendJson(ws, { type: "code_update", ...code });
            const frame = latestFrameByParticipant.get(id);
            if (frame) sendJson(ws, { type: "frame_update", ...frame });
            const runResult = latestRunResultByParticipant.get(id);
            if (runResult) sendJson(ws, { type: "run_result", ...runResult });
            if (isParticipantOnline(id)) online.push(id);
          }
          sendJson(ws, { type: "presence_snapshot", online });
        }
        return;
      }

      if (auth.role === "participant") {
        if (!auth.participantId) return;

        // Forward a message to every admin currently subscribed to this
        // participant, caching the latest value for replay on subscribe.
        const fanOut = (message, cache) => {
          if (cache) cache.set(auth.participantId, message);
          for (const adminSocket of adminSockets) {
            if (adminSubscriptions.get(adminSocket)?.has(auth.participantId)) {
              sendJson(adminSocket, message);
            }
          }
        };

        if (payload?.type === "code_update") {
          fanOut(
            {
              type: "code_update",
              participantId: auth.participantId,
              name: auth.name ?? "Participant",
              blockId: payload.blockId ?? null,
              code: payload.code ?? "",
              updatedAt: new Date().toISOString(),
            },
            latestCodeByParticipant,
          );
        } else if (payload?.type === "frame_update") {
          // The 8x8 RGB matrix the participant is currently displaying.
          if (Array.isArray(payload.matrix)) {
            fanOut(
              {
                type: "frame_update",
                participantId: auth.participantId,
                blockId: payload.blockId ?? null,
                matrix: payload.matrix,
                updatedAt: new Date().toISOString(),
              },
              latestFrameByParticipant,
            );
          }
        } else if (payload?.type === "run_result") {
          fanOut(
            {
              type: "run_result",
              participantId: auth.participantId,
              blockId: payload.blockId ?? null,
              success: payload.success === true,
              error:
                typeof payload.error === "string" ? payload.error : null,
              updatedAt: new Date().toISOString(),
            },
            latestRunResultByParticipant,
          );
        }
      }
    });

    ws.on("close", () => {
      if (auth.role === "participant") {
        if (auth.participantId) {
          const sockets = participantSockets.get(auth.participantId);
          if (sockets) {
            sockets.delete(ws);
            // Only tear down per-participant state once the last tab closes.
            if (sockets.size === 0) {
              participantSockets.delete(auth.participantId);
              // Drop the cached snapshots so the maps do not grow without
              // bound as participants come and go.
              latestCodeByParticipant.delete(auth.participantId);
              latestFrameByParticipant.delete(auth.participantId);
              latestRunResultByParticipant.delete(auth.participantId);
              // Tell watching admins this participant just went offline.
              broadcastPresence(auth.participantId, false);
            }
          }
        }
      } else {
        adminSockets.delete(ws);
        adminSubscriptions.delete(ws);
      }
    });
  });

  const port = Number(process.env.PORT) || 3000;
  const hostname = process.env.HOSTNAME || "0.0.0.0";
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
