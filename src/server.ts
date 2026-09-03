import http from "http";
import app from "./app";
import config from "./app/config";
import { initCronJobs } from "./app/cron/cron.service";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { initSocket } from "./app/lib/socket";

const PORT = config.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    await redisClient.connect();
    console.log("Connected to Redis successfully.");

    // Create HTTP server wrapping Express app
    const httpServer = http.createServer(app);

    // Initialize Real-Time WebSockets engine
    initSocket(httpServer);
    console.log("Real-time WebSockets (Socket.io) engine initialized.");

    // Initialize Automated Background Cron Engine
    initCronJobs();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
