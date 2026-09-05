import { z } from "zod";
import {
  DriverVerificationStatus,
  DutyStatus,
} from "../../../generated/prisma/enums";

const updateDutyStatusSchema = z.object({
  dutyStatus: z.enum([DutyStatus.ONLINE, DutyStatus.OFFLINE, DutyStatus.BUSY]),
});

const updateLocationSchema = z.object({
  latitude: z
    .number({ message: "Latitude is required" })
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),
  longitude: z
    .number({ message: "Longitude is required" })
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  heading: z
    .number()
    .min(0, "Heading must be >= 0")
    .max(360, "Heading must be <= 360")
    .optional(),
  speed: z.number().min(0, "Speed cannot be negative").optional(),
  vehicleId: z.string().uuid("Invalid Vehicle ID format").optional(),
});

const setActiveVehicleSchema = z.object({
  vehicleId: z
    .string({ message: "Vehicle ID is required" })
    .uuid("Invalid Vehicle ID format"),
});

const verifyDriverSchema = z.object({
  status: z.enum([
    DriverVerificationStatus.APPROVED,
    DriverVerificationStatus.REJECTED,
    DriverVerificationStatus.SUSPENDED,
    DriverVerificationStatus.PENDING,
  ]),
  reason: z.string().optional(),
});

export const DriverValidation = {
  updateDutyStatusSchema,
  updateLocationSchema,
  setActiveVehicleSchema,
  verifyDriverSchema,
};
