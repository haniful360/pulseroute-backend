import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DriverController } from "./driver.controller";
import { DriverValidation } from "./driver.validation";

const router = Router();

// Driver self-service endpoints
router.get(
  "/dashboard",
  auth(Role.DRIVER),
  DriverController.getDriverDashboardOverview,
);

router.get(
  "/my-profile",
  auth(Role.DRIVER),
  DriverController.getMyDriverProfile,
);

router.patch(
  "/my-profile",
  auth(Role.DRIVER),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "licensePhoto", maxCount: 5 },
    { name: "licensePhotos", maxCount: 5 },
    { name: "nidPhoto", maxCount: 5 },
    { name: "nidPhotos", maxCount: 5 },
    { name: "vehiclePhoto", maxCount: 10 },
    { name: "vehiclePhotos", maxCount: 10 },
  ]),
  validateRequest(DriverValidation.updateDriverProfileSchema),
  DriverController.updateMyDriverProfile,
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
