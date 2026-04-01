import crypto from "node:crypto";

const SESSION_COOKIE_NAME = "handwriter_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

const sessions = new Map();

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex));
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function buildCookieValue(sessionId, isSecure) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  ];

  if (isSecure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function isSecureRequest(req) {
  return Boolean(req.secure || req.headers["x-forwarded-proto"] === "https");
}

function pruneExpiredSessions(now = Date.now()) {
  for (const [sessionId, session] of sessions.entries()) {
    if ((now - session.updatedAt) > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

export function getSession(req, res) {
  pruneExpiredSessions();

  const cookies = parseCookies(req.headers.cookie);
  const currentId = cookies[SESSION_COOKIE_NAME];
  const now = Date.now();
  let sessionId = currentId;
  let session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    sessionId = crypto.randomUUID();
    session = {
      openAiApiKey: "",
      updatedAt: now
    };
    sessions.set(sessionId, session);
    res.setHeader("Set-Cookie", buildCookieValue(sessionId, isSecureRequest(req)));
  } else {
    session.updatedAt = now;
  }

  return session;
}
