import httpStatus from "http-status";
import {
  AmbulanceType,
  EmergencySeverity,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  ICreatePricingConfigPayload,
  IEstimateFarePayload,
  IFareEstimateBreakdown,
  IUpdatePricingConfigPayload,
} from "./pricing.interface";

const upsertPricingConfig = async (payload: ICreatePricingConfigPayload) => {
  const result = await prisma.pricingConfig.upsert({
    where: {
      ambulanceType: payload.ambulanceType,
    },
    update: {
      baseFare: payload.baseFare,
      perKmRate: payload.perKmRate,
      perMinuteRate: payload.perMinuteRate ?? 0.0,
      platformCommissionRate: payload.platformCommissionRate ?? 0.12,
      nightSurgeMultiplier: payload.nightSurgeMultiplier ?? 1.0,
      emergencySurgeMultiplier: payload.emergencySurgeMultiplier ?? 1.0,
      minFare: payload.minFare,
      cancellationFee: payload.cancellationFee ?? 0.0,
      isActive: payload.isActive ?? true,
    },
    create: {
      ambulanceType: payload.ambulanceType,
      baseFare: payload.baseFare,
      perKmRate: payload.perKmRate,
      perMinuteRate: payload.perMinuteRate ?? 0.0,
      platformCommissionRate: payload.platformCommissionRate ?? 0.12,
      nightSurgeMultiplier: payload.nightSurgeMultiplier ?? 1.0,
      emergencySurgeMultiplier: payload.emergencySurgeMultiplier ?? 1.0,
      minFare: payload.minFare,
      cancellationFee: payload.cancellationFee ?? 0.0,
      isActive: payload.isActive ?? true,
    },
  });

  return result;
};

const updatePricingConfig = async (
  ambulanceType: AmbulanceType,
  payload: IUpdatePricingConfigPayload,
) => {
  const existingConfig = await prisma.pricingConfig.findUnique({
    where: { ambulanceType },
  });

  if (!existingConfig) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Pricing configuration for '${ambulanceType}' not found`,
    );
  }

  const result = await prisma.pricingConfig.update({
    where: { ambulanceType },
    data: {
      baseFare: payload.baseFare,
      perKmRate: payload.perKmRate,
      perMinuteRate: payload.perMinuteRate,
      platformCommissionRate: payload.platformCommissionRate,
      nightSurgeMultiplier: payload.nightSurgeMultiplier,
      emergencySurgeMultiplier: payload.emergencySurgeMultiplier,
      minFare: payload.minFare,
      cancellationFee: payload.cancellationFee,
      isActive: payload.isActive,
    },
  });

  return result;
};

const getAllPricingConfigs = async () => {
  const configs = await prisma.pricingConfig.findMany({
    orderBy: {
      baseFare: "asc",
    },
  });

  return configs;
};

const getPricingConfigByType = async (ambulanceType: AmbulanceType) => {
  const config = await prisma.pricingConfig.findUnique({
    where: { ambulanceType },
  });

  if (!config) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Pricing configuration for '${ambulanceType}' not found`,
    );
  }

  return config;
};

const calculateFareEstimate = async (
  payload: IEstimateFarePayload,
): Promise<IFareEstimateBreakdown> => {
  const config = await prisma.pricingConfig.findUnique({
    where: { ambulanceType: payload.ambulanceType },
  });

  if (!config || !config.isActive) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      `Active pricing configuration for '${payload.ambulanceType}' ambulance not found. Please contact administration.`,
    );
  }

  // Automatic night surge detection if not explicitly specified (Between 11 PM and 6 AM)
  const currentHour = new Date().getHours();
  const isNight =
    payload.isNight !== undefined
      ? payload.isNight
      : currentHour >= 23 || currentHour < 6;

  const baseFare = Number(config.baseFare);
  const distanceFare = Number(
    (payload.distanceKm * Number(config.perKmRate)).toFixed(2),
  );
  const durationMins = payload.estimatedDurationMins || 0;
  const durationFare = Number(
    (durationMins * Number(config.perMinuteRate)).toFixed(2),
  );

  const subtotal = Number((baseFare + distanceFare + durationFare).toFixed(2));

  // Multipliers
  const nightMultiplier = isNight ? config.nightSurgeMultiplier : 1.0;
  const emergencyMultiplier =
    payload.emergencySeverity === EmergencySeverity.CRITICAL
      ? config.emergencySurgeMultiplier
      : 1.0;

  const totalSurgeMultiplier = Number(
    (nightMultiplier * emergencyMultiplier).toFixed(2),
  );
  const calculatedFare = Number((subtotal * totalSurgeMultiplier).toFixed(2));
  const minFare = Number(config.minFare);

  // Final fare cannot be lower than minFare
  const finalEstimatedFare = Number(
    Math.max(calculatedFare, minFare).toFixed(2),
  );

  // Platform commission and driver net estimation
  const commissionRate = config.platformCommissionRate;
  const estimatedCommission = Number(
    (finalEstimatedFare * commissionRate).toFixed(2),
  );
  const estimatedDriverNet = Number(
    (finalEstimatedFare - estimatedCommission).toFixed(2),
  );

  return {
    ambulanceType: payload.ambulanceType,
    distanceKm: payload.distanceKm,
    estimatedDurationMins: durationMins,
    baseFare,
    distanceFare,
    durationFare,
    subtotal,
    nightSurgeMultiplier: nightMultiplier,
    emergencySurgeMultiplier: emergencyMultiplier,
    totalSurgeMultiplier,
    calculatedFare,
    minFare,
    finalEstimatedFare,
    currency: "BDT",
    platformCommissionRate: commissionRate,
    estimatedCommission,
    estimatedDriverNet,
  };
};

export const PricingService = {
  upsertPricingConfig,
  updatePricingConfig,
  getAllPricingConfigs,
  getPricingConfigByType,
  calculateFareEstimate,
};
