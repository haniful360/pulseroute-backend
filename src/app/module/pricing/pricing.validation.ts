import { z } from "zod";
import {
  AmbulanceType,
  EmergencySeverity,
} from "../../../generated/prisma/enums";

const createPricingConfigSchema = z.object({
  ambulanceType: z.enum([
    AmbulanceType.BASIC,
    AmbulanceType.AC,
    AmbulanceType.ICU,
    AmbulanceType.CCU,
    AmbulanceType.FREEZER,
    AmbulanceType.NEONATAL,
  ]),
  baseFare: z
    .number({ message: "Base fare is required" })
    .min(0, "Base fare must be >= 0"),
  perKmRate: z
    .number({ message: "Per km rate is required" })
    .min(0, "Per km rate must be >= 0"),
  perMinuteRate: z.number().min(0).optional().default(0),
  platformCommissionRate: z
    .number()
    .min(0, "Commission rate must be >= 0")
    .max(0.5, "Commission rate cannot exceed 50% (0.50)")
    .optional()
    .default(0.12),
  nightSurgeMultiplier: z
    .number()
    .min(1.0, "Night surge multiplier must be >= 1.0")
    .max(3.0, "Night surge multiplier cannot exceed 3.0")
    .optional()
    .default(1.0),
  emergencySurgeMultiplier: z
    .number()
    .min(1.0, "Emergency surge multiplier must be >= 1.0")
    .max(3.0, "Emergency surge multiplier cannot exceed 3.0")
    .optional()
    .default(1.0),
  minFare: z
    .number({ message: "Minimum fare is required" })
    .min(0, "Minimum fare must be >= 0"),
  cancellationFee: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updatePricingConfigSchema = z.object({
  baseFare: z.number().min(0).optional(),
  perKmRate: z.number().min(0).optional(),
  perMinuteRate: z.number().min(0).optional(),
  platformCommissionRate: z.number().min(0).max(0.5).optional(),
  nightSurgeMultiplier: z.number().min(1.0).max(3.0).optional(),
  emergencySurgeMultiplier: z.number().min(1.0).max(3.0).optional(),
  minFare: z.number().min(0).optional(),
  cancellationFee: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const estimateFareSchema = z.object({
  ambulanceType: z.enum([
    AmbulanceType.BASIC,
    AmbulanceType.AC,
    AmbulanceType.ICU,
    AmbulanceType.CCU,
    AmbulanceType.FREEZER,
    AmbulanceType.NEONATAL,
  ]),
  distanceKm: z
    .number({ message: "Distance in kilometers is required" })
    .positive("Distance must be greater than 0"),
  estimatedDurationMins: z.number().min(0).optional(),
  isNight: z.boolean().optional(),
  emergencySeverity: z
    .enum([
      EmergencySeverity.CRITICAL,
      EmergencySeverity.HIGH,
      EmergencySeverity.MODERATE,
      EmergencySeverity.LOW,
    ])
    .optional(),
});

export const PricingValidation = {
  createPricingConfigSchema,
  updatePricingConfigSchema,
  estimateFareSchema,
};
