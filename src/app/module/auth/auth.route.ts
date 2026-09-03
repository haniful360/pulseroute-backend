import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { authLimiter } from "../../middleware/rateLimiter";
import { AuthController } from "./auth.controller";

const router = Router();

// Public registration & OTP verification routes (protected by authLimiter)
router.post("/register", authLimiter, AuthController.registerUser);
router.post("/register-driver", authLimiter, AuthController.registerDriver);
router.post("/verify-otp", authLimiter, AuthController.verifyOtp);
router.post("/verify-user-otp", authLimiter, AuthController.verifyOtp);
router.post("/resend-otp", authLimiter, AuthController.resendOtp);

// Password recovery routes
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", authLimiter, AuthController.resetPassword);

// Google Sign-In / Login
router.post("/google-login", AuthController.googleLogin);

// Universal dynamic login
router.post("/login", authLimiter, AuthController.loginUser);

// Refresh token & logout
router.post("/refresh-token", AuthController.refreshToken);
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
  AuthController.changePassword,
);

export const AuthRoutes = router;
