import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DriverController } from "./driver.controller";
import { DriverValidation } from "./driver.validation";

const router = Router();

// Driver self-service endpoints
router.get(
  "/my-profile",
  auth(Role.DRIVER),
  DriverController.getMyDriverProfile,
);

router.patch(
  "/duty-status",
  auth(Role.DRIVER),
  validateRequest(DriverValidation.updateDutyStatusSchema),
  DriverController.updateDutyStatus,
);

router.patch(
  "/location",
  auth(Role.DRIVER),
  validateRequest(DriverValidation.updateLocationSchema),
  DriverController.updateLocation,
);

router.patch(
  "/active-vehicle",
  auth(Role.DRIVER),
  validateRequest(DriverValidation.setActiveVehicleSchema),
  DriverController.setActiveVehicle,
);

// Admin-only driver verification & management endpoints
router.get("/", auth(Role.SUPER_ADMIN), DriverController.getAllDrivers);

router.get("/:id", auth(Role.SUPER_ADMIN), DriverController.getDriverById);

router.patch(
  "/:id/verify",
  auth(Role.SUPER_ADMIN),
  validateRequest(DriverValidation.verifyDriverSchema),
  DriverController.verifyDriver,
);

export const DriverRoutes = router;
