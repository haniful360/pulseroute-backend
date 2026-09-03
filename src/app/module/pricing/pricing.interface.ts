import {
  AmbulanceType,
  EmergencySeverity,
} from "../../../generated/prisma/enums";

export interface ICreatePricingConfigPayload {
  ambulanceType: AmbulanceType;
  baseFare: number;
  perKmRate: number;
  perMinuteRate?: number;
  platformCommissionRate?: number;
  nightSurgeMultiplier?: number;
  emergencySurgeMultiplier?: number;
  minFare: number;
  cancellationFee?: number;
  isActive?: boolean;
}

export interface IUpdatePricingConfigPayload {
  baseFare?: number;
  perKmRate?: number;
  perMinuteRate?: number;
  platformCommissionRate?: number;
  nightSurgeMultiplier?: number;
  emergencySurgeMultiplier?: number;
  minFare?: number;
  cancellationFee?: number;
  isActive?: boolean;
}

export interface IEstimateFarePayload {
  ambulanceType: AmbulanceType;
  distanceKm: number;
  estimatedDurationMins?: number;
  isNight?: boolean;
  emergencySeverity?: EmergencySeverity;
}

export interface IFareEstimateBreakdown {
  ambulanceType: AmbulanceType;
  distanceKm: number;
  estimatedDurationMins: number;
  baseFare: number;
  distanceFare: number;
  durationFare: number;
  subtotal: number;
  nightSurgeMultiplier: number;
  emergencySurgeMultiplier: number;
  totalSurgeMultiplier: number;
  calculatedFare: number;
  minFare: number;
  finalEstimatedFare: number;
  currency: string;
  platformCommissionRate: number;
  estimatedCommission: number;
  estimatedDriverNet: number;
}
