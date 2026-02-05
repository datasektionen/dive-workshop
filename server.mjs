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
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error"] });

const SESSION_COOKIE = "dive_session";
const ADMIN_SESSION_TYPE = "admin";
const PARTICIPANT_SESSION_TYPE = "participant";

const participantSockets = new Map();
const latestCodeByParticipant = new Map();
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

async function authenticate(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const token = cookies[SESSION_COOKIE];
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
  if (session.type === ADMIN_SESSION_TYPE) {
    return { role: "admin", adminId: session.adminId, name: session.admin?.fullName };
  }
  if (session.type === PARTICIPANT_SESSION_TYPE) {
    return {
      role: "participant",
      sessionId: session.id,
      participantId: session.participantId,
      classId: session.classId,
      name: session.name,
    };
  }
  return null;
}

function sendJson(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(payload));
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
      if (auth.participantId) {
        participantSockets.set(auth.participantId, ws);
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
        if (payload?.type === "subscribe" && typeof payload.participantId === "string") {
          adminSubscriptions.set(ws, new Set([payload.participantId]));
          sendJson(ws, { type: "subscribed", participantId: payload.participantId });
          const latest = latestCodeByParticipant.get(payload.participantId);
          if (latest) {
            sendJson(ws, { type: "code_update", ...latest });
          }
        }
        return;
      }

      if (auth.role === "participant") {
        if (payload?.type === "code_update" && auth.participantId) {
          const snapshot = {
            participantId: auth.participantId,
            name: auth.name ?? "Participant",
            blockId: payload.blockId ?? null,
            code: payload.code ?? "",
            updatedAt: new Date().toISOString(),
          };
          latestCodeByParticipant.set(auth.participantId, snapshot);
          const adminTargets = Array.from(adminSockets).filter((adminSocket) =>
            adminSubscriptions.get(adminSocket)?.has(auth.participantId)
          );
          for (const adminSocket of adminTargets) {
            sendJson(adminSocket, { type: "code_update", ...snapshot });
          }
        }
      }
    });

    ws.on("close", () => {
      if (auth.role === "participant") {
        if (auth.participantId) {
          participantSockets.delete(auth.participantId);
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
