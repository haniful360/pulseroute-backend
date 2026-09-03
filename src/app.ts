import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import httpStatus from "http-status";
import swaggerUi from "swagger-ui-express";
import config from "./app/config";
import { swaggerDocument } from "./app/docs/swagger";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { DriverRoutes } from "./app/module/driver/driver.route";
import { UserRoutes } from "./app/module/user/user.route";
import { VehicleRoutes } from "./app/module/vehicle/vehicle.route";

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
