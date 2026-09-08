import { createClient } from "redis";
import config from "../config";

export const redisClient = config.redis_url
  ? createClient({ url: config.redis_url })
  : createClient({
      username: config.redis_username,
      password: config.redis_password,
      socket: {
        host: config.redis_host || "127.0.0.1",
        port: config.redis_port || 6379,
      },
    });

redisClient.on("error", (err) => {
  console.warn("Redis Client Notification:", err?.message || err);
});
