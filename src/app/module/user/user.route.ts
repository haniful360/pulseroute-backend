import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { UserController } from "./user.controller";

const router = Router();

// Current user profile endpoints (accessible by any authenticated role)
router.get(
  "/profile",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  UserController.getMyProfile,
);

router.patch(
  "/profile",
  auth(Role.SUPER_ADMIN, Role.DRIVER, Role.USER),
  UserController.updateMyProfile,
);

// Admin-only user management endpoints
router.get("/", auth(Role.SUPER_ADMIN), UserController.getAllUsers);

router.get("/:id", auth(Role.SUPER_ADMIN), UserController.getUserById);

router.patch(
  "/:id/status",
  auth(Role.SUPER_ADMIN),
  UserController.updateUserStatus,
);

router.delete("/:id", auth(Role.SUPER_ADMIN), UserController.deleteUser);

export const UserRoutes = router;
