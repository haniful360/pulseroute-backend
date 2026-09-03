import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { VehicleController } from "./vehicle.controller";
import { VehicleValidation } from "./vehicle.validation";

const router = Router();

// Driver vehicle endpoints
router.post(
  "/",
  auth(Role.DRIVER),
  validateRequest(VehicleValidation.createVehicleSchema),
  VehicleController.createVehicle,
);

router.get("/my-vehicles", auth(Role.DRIVER), VehicleController.getMyVehicles);

router.patch(
  "/:id",
  auth(Role.DRIVER),
  validateRequest(VehicleValidation.updateVehicleSchema),
  VehicleController.updateVehicle,
);

// Admin-only fleet inspection & verification endpoints
router.get("/", auth(Role.SUPER_ADMIN), VehicleController.getAllVehicles);

router.get(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.DRIVER),
  VehicleController.getVehicleById,
);

router.patch(
  "/:id/verify",
  auth(Role.SUPER_ADMIN),
  validateRequest(VehicleValidation.verifyVehicleSchema),
  VehicleController.verifyVehicle,
);

export const VehicleRoutes = router;
