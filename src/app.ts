import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import swaggerUi from "swagger-ui-express";
import config from "./app/config";
import { swaggerDocument } from "./app/docs/swagger";
import { getSwaggerHtml } from "./app/docs/swaggerUiHtml";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AnalyticsRoutes } from "./app/module/analytics/analytics.route";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { DriverRoutes } from "./app/module/driver/driver.route";
import { InvoiceRoutes } from "./app/module/invoice/invoice.route";
import { NotificationRoutes } from "./app/module/notification/notification.route";
import { PaymentRoutes } from "./app/module/payment/payment.route";
import { PricingRoutes } from "./app/module/pricing/pricing.route";
import { ReviewRoutes } from "./app/module/review/review.route";
import { SettingRoutes } from "./app/module/setting/setting.route";
import { TripRoutes } from "./app/module/trip/trip.route";
import helmet from "helmet";
import { globalLimiter } from "./app/middleware/rateLimiter";
import { UserRoutes } from "./app/module/user/user.route";
import { VehicleRoutes } from "./app/module/vehicle/vehicle.route";
import { WalletRoutes } from "./app/module/wallet/wallet.route";

const app: Application = express();

// 1. CORS Configuration (Handles Vercel domains, localhost ports, custom frontends & preflight OPTIONS)
const rawOrigins = [
  config.frontend_url,
  process.env.ALLOWED_ORIGINS,
  config.bak_url,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:3000",
]
  .filter(Boolean)
  .flatMap((url) => (url as string).split(","))
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Server-to-server, Postman, Curl, Mobile, Cron
  if (config.node_env !== "production") return true;

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (rawOrigins.includes(normalizedOrigin)) return true;

  // Allow all localhost and 127.0.0.1 ports
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)) {
    return true;
  }

  // Allow all Vercel deployments (frontend, backend, previews)
  if (
    normalizedOrigin.endsWith(".vercel.app") ||
    /^https:\/\/[a-zA-Z0-9-_.]+\.vercel\.app$/i.test(normalizedOrigin)
  ) {
    return true;
  }

  return true;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
    "Range",
  ],
  exposedHeaders: ["Set-Cookie", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 2. Security HTTP Headers (configured to allow Swagger UI & CDN assets)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// 3. Global Rate Limiting for all API endpoints
app.use("/api/v1", globalLimiter);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies & cookies
app.use(express.json());
app.use(cookieParser());

// Interactive Swagger API Documentation (CDN Standalone + Fallback)
app.get("/api-docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(httpStatus.OK).json(swaggerDocument);
});

app.get(["/api-docs", "/api-docs/"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(httpStatus.OK).send(getSwaggerHtml());
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      docExpansion: "list",
      filter: true,
      displayRequestDuration: true,
      persistAuthorization: true,
    },
  }),
);

// Application routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/drivers", DriverRoutes);
app.use("/api/v1/vehicles", VehicleRoutes);
app.use("/api/v1/pricing", PricingRoutes);
app.use("/api/v1/trips", TripRoutes);
app.use("/api/v1/invoices", InvoiceRoutes);
app.use("/api/v1/wallets", WalletRoutes);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/analytics", AnalyticsRoutes);
app.use("/api/v1/settings", SettingRoutes);
app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/notifications", NotificationRoutes);

// Health check route
app.get("/", async (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message:
      "Welcome to PulseRoute — Emergency Ambulance Dispatch Platform API",
    documentation: "/api-docs",
    version: "1.0.0",
  });
});

// Error handling middlewares
app.use(globalErrorHandler);
app.use(notFound);

export default app;
