import rateLimit from "express-rate-limit";

// 1. General application rate limiter (protects API from generic flooding & scraping)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
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
  max: 10, // Max 10 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
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
  max: 5, // Max 5 emergency trip requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message:
      "Emergency trip booking limit reached. If this is a life-threatening emergency, please dial 999 directly.",
  },
});

