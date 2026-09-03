import nodemailer from "nodemailer";
import config from "../config";

export const transporter = nodemailer.createTransport({
  host: config.smtp_host,
  port: config.smtp_port,
  secure: config.smtp_port === 465, // true for 465, false for 587
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
});
