import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { HospitalService } from "./hospital.service";

const createHospital = catchAsync(async (req: Request, res: Response) => {
  const result = await HospitalService.createHospital(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Hospital registered successfully into directory",
    data: result,
  });
});

const getAllHospitals = catchAsync(async (req: Request, res: Response) => {
  const result = await HospitalService.getAllHospitals(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hospitals retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getHospitalById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await HospitalService.getHospitalById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hospital details retrieved successfully",
    data: result,
  });
});

const sendPreAlert = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await HospitalService.sendPreAlert(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: result.message,
    data: result,
  });
});

const getPublicAlertByToken = catchAsync(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    const result = await HospitalService.getPublicAlertByToken(token as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Live ER Pre-Alert tracking retrieved successfully",
      data: result,
    });
  },
);

const acknowledgeAlert = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await HospitalService.acknowledgeAlert(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Trauma Bay ${result.assignedBayNumber} acknowledged and confirmed!`,
    data: result,
  });
});

const getHospitalActiveAlerts = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await HospitalService.getHospitalActiveAlerts(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Active emergency pre-alerts retrieved for hospital",
      data: result,
    });
  },
);

export const HospitalController = {
  createHospital,
  getAllHospitals,
  getHospitalById,
  sendPreAlert,
  getPublicAlertByToken,
  acknowledgeAlert,
  getHospitalActiveAlerts,
};
