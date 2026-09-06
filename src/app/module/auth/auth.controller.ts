import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.registerUser(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Verification OTP sent to your email. Please verify within 5 minutes to complete registration.",
    data: result,
  });
});

const registerDriver = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.registerDriver(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Verification OTP sent to your email. Please verify within 5 minutes to complete driver registration.",
    data: result,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.verifyOtp(payload);

  const { accessToken, refreshToken, user } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  const message =
    result.type === "DRIVER"
      ? "Email verified and driver application submitted successfully. Account is pending admin approval."
      : "Email verified and patient account created successfully!";

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message,
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.resendOtp(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.forgotPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.resetPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.googleLogin(payload);
  const { accessToken, refreshToken, user, welcomeMessage } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: welcomeMessage || "Logged in successfully via Google",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.loginUser(payload);
  const { accessToken, refreshToken, user, welcomeMessage } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: welcomeMessage || "Logged in successfully",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await AuthService.getMe(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = req.body;

  const result = await AuthService.changePassword(user, payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Refresh token is missing",
    });
    return;
  }

  const result = await AuthService.refreshToken(token);
  const { accessToken, refreshToken: newRefreshToken } = result;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

const logoutUser = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

export const AuthController = {
  registerUser,
  registerDriver,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  googleLogin,
  loginUser,
  getMe,
  changePassword,
  refreshToken,
  logoutUser,
};
