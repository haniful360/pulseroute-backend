import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SettingController } from "./setting.controller";
import { SettingValidation } from "./setting.validation";

const router = Router();

// Public platform settings (Hotline, maintenance, app version, support)
router.get("/public", SettingController.getPublicSettings);

// Super Admin platform configuration endpoints
router.get("/", auth(Role.SUPER_ADMIN), SettingController.getAllSettings);

router.post(
  "/",
  auth(Role.SUPER_ADMIN),
  validateRequest(SettingValidation.upsertSettingSchema),
  SettingController.upsertSetting,
);

router.get("/:key", auth(Role.SUPER_ADMIN), SettingController.getSettingByKey);

router.patch(
  "/:key",
  auth(Role.SUPER_ADMIN),
  validateRequest(SettingValidation.updateSettingSchema),
  SettingController.updateSetting,
);

router.delete("/:key", auth(Role.SUPER_ADMIN), SettingController.deleteSetting);

export const SettingRoutes = router;
