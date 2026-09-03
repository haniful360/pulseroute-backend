import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { DriverService } from "./driver.service";

const getMyDriverProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await DriverService.getMyDriverProfile(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver profile retrieved successfully",
    data: result,
  });
});

const updateDutyStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await DriverService.updateDutyStatus(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Duty status updated to ${result.dutyStatus} successfully`,
    data: result,
  });
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await DriverService.updateLocation(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Live location updated successfully",
    data: result,
  });
});

const setActiveVehicle = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await DriverService.setActiveVehicle(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Active vehicle updated successfully",
    data: result,
  });
});

const getAllDrivers = catchAsync(async (req: Request, res: Response) => {
  const result = await DriverService.getAllDrivers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Drivers retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getDriverById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DriverService.getDriverById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver details retrieved successfully",
    data: result,
  });
});

const verifyDriver = catchAsync(async (req: Request, res: Response) => {
  const adminUser = req.user as IRequestUser;
  const { id } = req.params;
  const result = await DriverService.verifyDriver(
    adminUser,
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Driver verification status updated to ${result.verificationStatus}`,
    data: result,
  });
});

export const DriverController = {
  getMyDriverProfile,
  updateDutyStatus,
  updateLocation,
  setActiveVehicle,
  getAllDrivers,
  getDriverById,
  verifyDriver,
};
