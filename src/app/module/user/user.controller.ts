import { Request, Response } from "express";
import httpStatus from "http-status";
import {
  uploadToCloudinary,
  uploadBase64OrUrlToCloudinary,
} from "../../lib/cloudinary";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { UserService } from "./user.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await UserService.getMyProfile(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const getUserDashboardOverview = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await UserService.getUserDashboardOverview(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Patient dashboard overview retrieved successfully",
      data: result,
    });
  },
);

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  let payload = req.body;

  if (typeof req.body.data === "string") {
    try {
      payload = JSON.parse(req.body.data);
    } catch {
      // Use req.body as is
    }
  }

  // Handle avatar or profilePhoto upload if present
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const file = req.file || files?.avatar?.[0] || files?.profilePhoto?.[0];
  if (file) {
    const uploadedUrl = await uploadToCloudinary(
      file.buffer,
      "pulseroute/avatars",
    );
    payload.avatarUrl = uploadedUrl;
    payload.profilePhoto = uploadedUrl;
  } else if (payload.avatarUrl && typeof payload.avatarUrl === "string" && payload.avatarUrl.startsWith("data:")) {
    const uploadedUrl = await uploadBase64OrUrlToCloudinary(
      payload.avatarUrl,
      "pulseroute/avatars",
    );
    payload.avatarUrl = uploadedUrl;
    payload.profilePhoto = uploadedUrl;
  } else if (payload.profilePhoto && typeof payload.profilePhoto === "string" && payload.profilePhoto.startsWith("data:")) {
    const uploadedUrl = await uploadBase64OrUrlToCloudinary(
      payload.profilePhoto,
      "pulseroute/avatars",
    );
    payload.avatarUrl = uploadedUrl;
    payload.profilePhoto = uploadedUrl;
  }

  const result = await UserService.updateMyProfile(user, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User details retrieved successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.updateUserStatus(id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteUser(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getMyProfile,
  getUserDashboardOverview,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};
