import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

// User dashboard overview
router.get(
  "/dashboard",
  auth(Role.USER),
  UserController.getUserDashboardOverview,
);

// Current user profile endpoints (accessible by any authenticated role)
router.get(
  "/profile",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  UserController.getMyProfile,
);

router.patch(
  "/profile",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  upload.single("avatar"),
  validateRequest(UserValidation.updateProfileSchema),
  UserController.updateMyProfile,
);

// Admin-only user management endpoints
router.get("/", auth(Role.SUPER_ADMIN), UserController.getAllUsers);

router.get("/:id", auth(Role.SUPER_ADMIN), UserController.getUserById);

router.patch(
  "/:id/status",
  auth(Role.SUPER_ADMIN),
  validateRequest(UserValidation.updateUserStatusSchema),
  UserController.updateUserStatus,
);

router.delete("/:id", auth(Role.SUPER_ADMIN), UserController.deleteUser);

export const UserRoutes = router;
