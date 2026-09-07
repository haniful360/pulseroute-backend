import { z } from "zod";
import {
  AmbulanceType,
  DriverVerificationStatus,
  DutyStatus,
} from "../../../generated/prisma/enums";

const updateDriverProfileSchema = z.object({
  // Basic User Details
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .optional(),
  phone: z.string().optional(),
  contactNumber: z.string().optional(),
  avatarUrl: z.string().optional(),

  // Driver Credentials & Documents
  licenseNumber: z.string().min(3).optional(),
  licenseExpiry: z.string().optional(),
  licensePhotoUrl: z.string().optional(),
  licensePhotos: z.union([z.string(), z.array(z.string())]).optional(),
  nidNumber: z.string().optional(),
  nidPhotoUrl: z.string().optional(),
  nidPhotos: z.union([z.string(), z.array(z.string())]).optional(),
  experienceYears: z.preprocess(
    (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
    z.number().int().nonnegative().optional(),
  ),

  // Vehicle Details
  vehicleNumber: z.string().optional(),
  ambulanceType: z
    .enum([
      AmbulanceType.BASIC,
      AmbulanceType.AC,
      AmbulanceType.ICU,
      AmbulanceType.CCU,
      AmbulanceType.FREEZER,
      AmbulanceType.NEONATAL,
    ])
    .optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z.preprocess(
    (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
    z.number().int().optional(),
  ),
  vehiclePhotoUrl: z.string().optional(),
  vehiclePhotos: z.union([z.string(), z.array(z.string())]).optional(),
  hasOxygen: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val.toLowerCase() === "true"
        : typeof val === "boolean"
          ? val
          : undefined,
    z.boolean().optional(),
  ),
  hasVentilator: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val.toLowerCase() === "true"
        : typeof val === "boolean"
          ? val
          : undefined,
    z.boolean().optional(),
  ),
  hasDefibrillator: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val.toLowerCase() === "true"
        : typeof val === "boolean"
          ? val
          : undefined,
    z.boolean().optional(),
  ),
  hasSuctionMachine: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val.toLowerCase() === "true"
        : typeof val === "boolean"
          ? val
          : undefined,
    z.boolean().optional(),
  ),
  equipmentDetails: z.string().optional(),
});

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
  updateDriverProfileSchema,
  updateDutyStatusSchema,
  updateLocationSchema,
  verifyDriverSchema,
};
