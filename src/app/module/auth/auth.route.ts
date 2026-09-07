import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { authLimiter } from "../../middleware/rateLimiter";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

// Public registration & OTP verification routes (protected by authLimiter & supporting multipart file uploads)
router.post(
  "/register",
  authLimiter,
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  validateRequest(AuthValidation.registerUserSchema),
  AuthController.registerUser,
);

router.post(
  "/register-driver",
  authLimiter,
  upload.fields([
    { name: "licensePhoto", maxCount: 5 },
    { name: "licensePhotos", maxCount: 5 },
    { name: "vehiclePhoto", maxCount: 10 },
    { name: "vehiclePhotos", maxCount: 10 },
    { name: "nidPhoto", maxCount: 5 },
    { name: "nidPhotos", maxCount: 5 },
    { name: "avatar", maxCount: 1 },
  ]),
  validateRequest(AuthValidation.registerDriverSchema),
  AuthController.registerDriver,
);
router.post("/verify-otp", authLimiter, AuthController.verifyOtp);
router.post("/verify-user-otp", authLimiter, AuthController.verifyOtp);
router.post("/resend-otp", authLimiter, AuthController.resendOtp);

router.post(
  "/verify-otp",
  authLimiter,
  validateRequest(AuthValidation.verifyOtpSchema),
  AuthController.verifyOtp,
);

router.post(
  "/verify-user-otp",
  authLimiter,
  validateRequest(AuthValidation.verifyOtpSchema),
  AuthController.verifyOtp,
);

router.post(
  "/resend-otp",
  authLimiter,
  validateRequest(AuthValidation.resendOtpSchema),
  AuthController.resendOtp,
);

// Password recovery routes
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", authLimiter, AuthController.resetPassword);
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  authLimiter,
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword,
);

// Google Sign-In / Login
router.post("/google-login", AuthController.googleLogin);
router.post(
  "/google-login",
  validateRequest(AuthValidation.googleLoginSchema),
  AuthController.googleLogin,
);

// Universal dynamic login
router.post("/login", authLimiter, AuthController.loginUser);
router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginUserSchema),
  AuthController.loginUser,
);

// Refresh token & logout
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenSchema),
  AuthController.refreshToken,
);

router.post("/logout", AuthController.logoutUser);

// Protected routes (available to authenticated users)
router.get(
  "/me",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  AuthController.getMe,
);

router.post(
  "/change-password",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  validateRequest(AuthValidation.changePasswordSchema),
  AuthController.changePassword,
);

export const AuthRoutes = router;

