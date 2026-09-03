import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PricingController } from "./pricing.controller";
import { PricingValidation } from "./pricing.validation";

const router = Router();

// Public fare estimation endpoint
router.post(
  "/estimate-fare",
  validateRequest(PricingValidation.estimateFareSchema),
  PricingController.calculateFareEstimate,
);

// Public pricing rate list
router.get("/", PricingController.getAllPricingConfigs);

// Admin-only pricing management
router.post(
  "/",
  auth(Role.SUPER_ADMIN),
  validateRequest(PricingValidation.createPricingConfigSchema),
  PricingController.upsertPricingConfig,
);

// Specific ambulance type pricing
router.get("/:ambulanceType", PricingController.getPricingConfigByType);

router.patch(
  "/:ambulanceType",
  auth(Role.SUPER_ADMIN),
  validateRequest(PricingValidation.updatePricingConfigSchema),
  PricingController.updatePricingConfig,
);

export const PricingRoutes = router;
