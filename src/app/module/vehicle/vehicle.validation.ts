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
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1990, "Vehicle manufacture year must be after 1990")
    .max(new Date().getFullYear() + 1)
    .optional(),
  hasOxygen: z.boolean().optional().default(true),
  hasVentilator: z.boolean().optional().default(false),
  hasDefibrillator: z.boolean().optional().default(false),
  hasSuctionMachine: z.boolean().optional().default(false),
  equipmentDetails: z.string().optional(),
});

const updateVehicleSchema = z.object({
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),
  hasOxygen: z.boolean().optional(),
  hasVentilator: z.boolean().optional(),
  hasDefibrillator: z.boolean().optional(),
  hasSuctionMachine: z.boolean().optional(),
  equipmentDetails: z.string().optional(),
  isActive: z.boolean().optional(),
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
