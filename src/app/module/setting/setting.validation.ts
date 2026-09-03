import { z } from "zod";

const upsertSettingSchema = z.object({
  key: z
    .string({ message: "Setting key is required" })
    .min(2, "Key must be at least 2 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Key must contain uppercase alphanumeric characters and underscores only (e.g. EMERGENCY_HOTLINE)",
    ),
  value: z.string({ message: "Setting value is required" }),
  description: z.string().optional(),
});

const updateSettingSchema = z.object({
  value: z.string({ message: "Setting value is required" }),
  description: z.string().optional(),
});

export const SettingValidation = {
  upsertSettingSchema,
  updateSettingSchema,
};
