import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getOverviewAnalytics = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AnalyticsService.getOverviewAnalytics();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Platform overview analytics retrieved successfully",
      data: result,
    });
  },
);

const getRecentActivities = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsService.getRecentActivities();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recent platform activities retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getOverviewAnalytics,
  getRecentActivities,
};
