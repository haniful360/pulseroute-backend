import http from "http";
import app from "./app";
import config from "./app/config";
import { initCronJobs } from "./app/cron/cron.service";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { initSocket } from "./app/lib/socket";

const PORT = config.port || 5000;

const initServices = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
  } catch (dbErr) {
    console.error("Database connection warning:", dbErr);
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("Connected to Redis successfully.");
    }
  } catch (redisErr) {
    console.warn(
      "Redis connection notice (continuing without cache):",
      redisErr,
    );
  }
};

// Initialize DB and background services
initServices();

// Only start long-running HTTP listener & Cron when NOT running on Vercel Serverless
if (!process.env.VERCEL) {
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  console.log("Real-time WebSockets (Socket.io) engine initialized.");

  initCronJobs();
  console.log("Automated Background Cron Engine initialized.");

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
