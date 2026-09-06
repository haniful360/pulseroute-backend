import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  bak_url: process.env.APP_URL,
  frontend_url: process.env.FRONTEND_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 10,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  redis_username: process.env.REDIS_USERNAME,
  redis_password: process.env.REDIS_PASSWORD,
  redis_host: process.env.REDIS_HOST,
  redis_port: Number(process.env.REDIS_PORT) || 6379,
  smtp_host: process.env.SMTP_HOST || "smtp.gmail.com",
  smtp_port: Number(process.env.SMTP_PORT) || 587,
  smtp_user: process.env.SMTP_USER,
  smtp_password: process.env.SMTP_PASSWORD,
  smtp_sender:
    process.env.SMTP_SENDER || `PulseRoute Support <${process.env.SMTP_USER}>`,
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY || "",
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || "",
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || "",
};
