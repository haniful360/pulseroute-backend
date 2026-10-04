import rateLimit from "express-rate-limit";
import config from "../config";

const isDev = config.node_env !== "production" || process.env.NODE_ENV !== "production";

const isLocalIp = (ip?: string) => {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "localhost"
  );
};

// 1. General application rate limiter (protects API from generic flooding & scraping)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 1500, // relaxed in dev to allow hot reloading and testing
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || isLocalIp(req.ip || req.socket.remoteAddress),
  message: {
    success: false,
    statusCode: 429,
    message:
      "Too many requests from this IP address. Please try again after 15 minutes.",
  },
});

// 2. Strict authentication & OTP limiter (protects login, registration, and password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 30, // 30 attempts in prod, relaxed in dev
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || isLocalIp(req.ip || req.socket.remoteAddress),
  message: {
    success: false,
    statusCode: 429,
    message:
      "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

// 3. Emergency dispatch booking limiter (prevents bots from locking ambulances in the city)
export const emergencyBookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDev ? 500 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || isLocalIp(req.ip || req.socket.remoteAddress),
  message: {
    success: false,
    statusCode: 429,
    message:
      "Emergency trip booking limit reached. If this is a life-threatening emergency, please dial 999 directly.",
  },
});

