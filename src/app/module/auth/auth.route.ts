import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";

const router = Router();

// Public registration routes (User & Driver only)
router.post("/register", AuthController.registerUser);
router.post("/register-driver", AuthController.registerDriver);

// Universal dynamic login (for User, Driver, and Super Admin)
router.post("/login", AuthController.loginUser);

// Refresh token & logout
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logoutUser);

// Protected routes
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
