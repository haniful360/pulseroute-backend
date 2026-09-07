import { Request, Response } from "express";
import httpStatus from "http-status";
import { uploadToCloudinary } from "../../lib/cloudinary";
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

const updateMyDriverProfile = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    let payload = req.body;

    if (typeof req.body.data === "string") {
      try {
        payload = JSON.parse(req.body.data);
      } catch {
        // Use req.body as is
      }
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    // 1. License photos
    const licenseFiles = [
      ...(files?.licensePhotos || []),
      ...(files?.licensePhoto || []),
    ];
    if (licenseFiles.length > 0) {
      const uploadedLicenseUrls = await Promise.all(
        licenseFiles.map((file) =>
          uploadToCloudinary(file.buffer, "pulseroute/drivers/licenses"),
        ),
      );
      payload.licensePhotos = [
        ...(Array.isArray(payload.licensePhotos) ? payload.licensePhotos : []),
        ...uploadedLicenseUrls,
      ];
      payload.licensePhotoUrl = payload.licensePhotos[0];
    }

    // 2. Vehicle photos
    const vehicleFiles = [
      ...(files?.vehiclePhotos || []),
      ...(files?.vehiclePhoto || []),
    ];
    if (vehicleFiles.length > 0) {
      const uploadedVehicleUrls = await Promise.all(
        vehicleFiles.map((file) =>
          uploadToCloudinary(file.buffer, "pulseroute/vehicles"),
        ),
      );
      payload.vehiclePhotos = [
        ...(Array.isArray(payload.vehiclePhotos) ? payload.vehiclePhotos : []),
        ...uploadedVehicleUrls,
      ];
      payload.vehiclePhotoUrl = payload.vehiclePhotos[0];
    }

    // 3. NID photos
    const nidFiles = [
      ...(files?.nidPhotos || []),
      ...(files?.nidPhoto || []),
    ];
    if (nidFiles.length > 0) {
      const uploadedNidUrls = await Promise.all(
        nidFiles.map((file) =>
          uploadToCloudinary(file.buffer, "pulseroute/drivers/nid"),
        ),
      );
      payload.nidPhotos = [
        ...(Array.isArray(payload.nidPhotos) ? payload.nidPhotos : []),
        ...uploadedNidUrls,
      ];
      payload.nidPhotoUrl = payload.nidPhotos[0];
    }

    // 4. Avatar
    if (files?.avatar?.[0]) {
      payload.avatarUrl = await uploadToCloudinary(
        files.avatar[0].buffer,
        "pulseroute/avatars",
      );
    }

    const result = await DriverService.updateMyDriverProfile(user, payload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver profile and details updated successfully",
      data: result,
    });
  },
);

const getDriverDashboardOverview = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await DriverService.getDriverDashboardOverview(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver dashboard overview retrieved successfully",
      data: result,
    });
  },
);

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
  updateMyDriverProfile,
  getDriverDashboardOverview,
  updateDutyStatus,
  updateLocation,
  getAllDrivers,
  getDriverById,
  verifyDriver,
};
