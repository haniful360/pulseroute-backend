import { Request, Response } from "express";
import httpStatus from "http-status";
import { AmbulanceType } from "../../../generated/prisma/enums";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PricingService } from "./pricing.service";

const upsertPricingConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await PricingService.upsertPricingConfig(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `Pricing configuration for '${result.ambulanceType}' saved successfully`,
    data: result,
  });
});

const updatePricingConfig = catchAsync(async (req: Request, res: Response) => {
  const { ambulanceType } = req.params;
  const result = await PricingService.updatePricingConfig(
    ambulanceType as AmbulanceType,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Pricing configuration for '${result.ambulanceType}' updated successfully`,
    data: result,
  });
});

const getAllPricingConfigs = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await PricingService.getAllPricingConfigs();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Pricing configurations retrieved successfully",
      data: result,
    });
  },
);

const getPricingConfigByType = catchAsync(
  async (req: Request, res: Response) => {
    const { ambulanceType } = req.params;
    const result = await PricingService.getPricingConfigByType(
      ambulanceType as AmbulanceType,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Pricing configuration for '${result.ambulanceType}' retrieved successfully`,
      data: result,
    });
  },
);

const calculateFareEstimate = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PricingService.calculateFareEstimate(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Estimated fare calculated successfully",
      data: result,
    });
  },
);

export const PricingController = {
  upsertPricingConfig,
  updatePricingConfig,
  getAllPricingConfigs,
  getPricingConfigByType,
  calculateFareEstimate,
};
