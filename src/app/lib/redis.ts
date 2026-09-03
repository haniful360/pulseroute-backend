import { createClient } from "redis";
import config from "../config";

export const redisClient = createClient({
  username: config.redis_username,
  password: config.redis_password,
  socket: {
    host: config.redis_host,
    port: config.redis_port,
  },
});





