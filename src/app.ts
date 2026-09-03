import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import swaggerUi from "swagger-ui-express";
import config from "./app/config";
import { swaggerDocument } from "./app/docs/swagger";
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
import { UserRoutes } from "./app/module/user/user.route";
import { VehicleRoutes } from "./app/module/vehicle/vehicle.route";
import { WalletRoutes } from "./app/module/wallet/wallet.route";

const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url || "http://localhost:3000",
    credentials: true,
  }),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies & cookies
app.use(express.json());
app.use(cookieParser());

// Interactive Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
