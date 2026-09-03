import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";

const router = Router();

// Public registration & OTP verification routes
router.post("/register", AuthController.registerUser);
router.post("/register-driver", AuthController.registerDriver);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/resend-otp", AuthController.resendOtp);

// Universal dynamic login
router.post("/login", AuthController.loginUser);

// Refresh token & logout
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logoutUser);

// Protected routes (available to authenticated users)
router.get(
  "/me",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  AuthController.getMe
);

router.post(
  "/change-password",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  AuthController.changePassword
);

export const AuthRoutes = router;
