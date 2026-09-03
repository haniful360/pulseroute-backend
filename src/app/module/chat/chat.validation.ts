import { z } from "zod";

const sendMessageSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty")
    .max(1000, "Message cannot exceed 1000 characters"),
});

export const ChatValidation = {
  sendMessageSchema,
};
