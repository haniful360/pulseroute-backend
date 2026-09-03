import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { VehicleService } from "./vehicle.service";

const createVehicle = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await VehicleService.createVehicle(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Ambulance registered successfully. Awaiting admin verification.",
    data: result,
  });
});

const getMyVehicles = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await VehicleService.getMyVehicles(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicles retrieved successfully",
    data: result,
  });
});

const updateVehicle = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const result = await VehicleService.updateVehicle(
    user,
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle updated successfully",
    data: result,
  });
});

const getAllVehicles = catchAsync(async (req: Request, res: Response) => {
  const result = await VehicleService.getAllVehicles(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicles retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getVehicleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VehicleService.getVehicleById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle details retrieved successfully",
    data: result,
  });
});

const verifyVehicle = catchAsync(async (req: Request, res: Response) => {
  const adminUser = req.user as IRequestUser;
  const { id } = req.params;
  const result = await VehicleService.verifyVehicle(
    adminUser,
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Vehicle verification status updated to ${result.verificationStatus}`,
    data: result,
  });
});

export const VehicleController = {
  createVehicle,
  getMyVehicles,
  updateVehicle,
  getAllVehicles,
  getVehicleById,
  verifyVehicle,
};
