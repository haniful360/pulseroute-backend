import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { HospitalController } from "./hospital.controller";
import { HospitalValidation } from "./hospital.validation";

const router = Router();

// Hospital Directory Management
router.post(
  "/",
  auth(Role.SUPER_ADMIN),
  validateRequest(HospitalValidation.createHospitalSchema),
  HospitalController.createHospital,
);

router.get("/", HospitalController.getAllHospitals);

// Dispatch Pre-Alert to Destination Hospital (Moving Ambulance -> Hospital)
router.post(
  "/pre-alerts",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  validateRequest(HospitalValidation.createPreAlertSchema),
  HospitalController.sendPreAlert,
);

// Zero-Auth Public Live Tracking for On-Duty ER Doctors (via SMS/WhatsApp link)
router.get(
  "/pre-alerts/track/:token",
  HospitalController.getPublicAlertByToken,
);

// Doctor Acknowledges and Prepares Trauma Bay (Bed 1, ICU 2, etc.)
router.patch(
  "/pre-alerts/:id/acknowledge",
  validateRequest(HospitalValidation.acknowledgeAlertSchema),
  HospitalController.acknowledgeAlert,
);

// Active ER Alerts Queue for Hospital Wall Monitors & Triage Desks
router.get("/:id/active-alerts", HospitalController.getHospitalActiveAlerts);

router.get("/:id", HospitalController.getHospitalById);

export const HospitalRoutes = router;
