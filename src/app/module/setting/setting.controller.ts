import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SettingService } from "./setting.service";

const getPublicSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await SettingService.getPublicSettings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Public system settings retrieved successfully",
    data: result,
  });
});

const getAllSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await SettingService.getAllSettings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All system settings retrieved successfully",
    data: result,
  });
});

const getSettingByKey = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const result = await SettingService.getSettingByKey(key as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System setting retrieved successfully",
    data: result,
  });
});

const upsertSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingService.upsertSetting(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System setting saved successfully",
    data: result,
  });
});

const updateSetting = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const result = await SettingService.updateSetting(key as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System setting updated successfully",
    data: result,
  });
});

const deleteSetting = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const result = await SettingService.deleteSetting(key as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const SettingController = {
  getPublicSettings,
  getAllSettings,
  getSettingByKey,
  upsertSetting,
  updateSetting,
  deleteSetting,
};
