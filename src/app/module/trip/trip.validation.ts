import { z } from "zod";
import {
  AmbulanceType,
  EmergencySeverity,
  TripStatus,
} from "../../../generated/prisma/enums";

const createTripSchema = z.object({
  ambulanceType: z.enum([
    AmbulanceType.BASIC,
    AmbulanceType.AC,
    AmbulanceType.ICU,
    AmbulanceType.CCU,
    AmbulanceType.FREEZER,
    AmbulanceType.NEONATAL,
  ]),
  emergencySeverity: z
    .enum([
      EmergencySeverity.CRITICAL,
      EmergencySeverity.HIGH,
      EmergencySeverity.MODERATE,
      EmergencySeverity.LOW,
    ])
    .optional()
    .default(EmergencySeverity.HIGH),
  pickupAddress: z
    .string({ message: "Pickup address is required" })
    .min(3, "Pickup address must be at least 3 characters"),
  pickupLatitude: z
    .number({ message: "Pickup latitude is required" })
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),
  pickupLongitude: z
    .number({ message: "Pickup longitude is required" })
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  destinationAddress: z.string().optional(),
  destinationLatitude: z.number().min(-90).max(90).optional(),
  destinationLongitude: z.number().min(-180).max(180).optional(),
  patientNotes: z.string().optional(),
});

const updateTripStatusSchema = z.object({
  status: z.enum([
    TripStatus.EN_ROUTE,
    TripStatus.ARRIVED,
    TripStatus.IN_TRANSIT,
    TripStatus.COMPLETED,
  ]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
});

const cancelTripSchema = z.object({
  cancellationReason: z
    .string({ message: "Cancellation reason is required" })
    .min(3, "Please provide a reason of at least 3 characters"),
});

export const TripValidation = {
  createTripSchema,
  updateTripStatusSchema,
  cancelTripSchema,
};
