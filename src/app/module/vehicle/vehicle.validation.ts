import { z } from "zod";
import {
  AmbulanceType,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";

const createVehicleSchema = z.object({
  ambulanceType: z.enum([
    AmbulanceType.BASIC,
    AmbulanceType.AC,
    AmbulanceType.ICU,
    AmbulanceType.CCU,
    AmbulanceType.FREEZER,
    AmbulanceType.NEONATAL,
  ]),
  vehicleNumber: z
    .string({ message: "Vehicle registration number is required" })
    .min(3, "Vehicle number must be at least 3 characters"),
  photoUrl: z.string().optional(),
  photos: z.union([z.string(), z.array(z.string())]).optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z
    .preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z
        .number()
        .int()
        .min(1990, "Vehicle manufacture year must be after 1990")
        .max(new Date().getFullYear() + 1)
        .optional(),
    ),
  hasOxygen: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional().default(true),
    ),
  hasVentilator: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional().default(false),
    ),
  hasDefibrillator: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional().default(false),
    ),
  hasSuctionMachine: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional().default(false),
    ),
  equipmentDetails: z.string().optional(),
});

const updateVehicleSchema = z.object({
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  photoUrl: z.string().optional(),
  photos: z.union([z.string(), z.array(z.string())]).optional(),
  year: z
    .preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z
        .number()
        .int()
        .min(1990)
        .max(new Date().getFullYear() + 1)
        .optional(),
    ),
  hasOxygen: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional(),
    ),
  hasVentilator: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional(),
    ),
  hasDefibrillator: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional(),
    ),
  hasSuctionMachine: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional(),
    ),
  equipmentDetails: z.string().optional(),
  isActive: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val.toLowerCase() === "true"
          : typeof val === "boolean"
            ? val
            : undefined,
      z.boolean().optional(),
    ),
});

const verifyVehicleSchema = z.object({
  status: z.enum([
    VehicleVerificationStatus.APPROVED,
    VehicleVerificationStatus.REJECTED,
    VehicleVerificationStatus.PENDING,
  ]),
  reason: z.string().optional(),
});

export const VehicleValidation = {
  createVehicleSchema,
  updateVehicleSchema,
  verifyVehicleSchema,
};
