import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

// Executive dashboard metrics
router.get(
  "/overview",
  auth(Role.SUPER_ADMIN),
  AnalyticsController.getOverviewAnalytics,
);

// Recent activity feed
router.get(
  "/recent-activities",
  auth(Role.SUPER_ADMIN),
  AnalyticsController.getRecentActivities,
);

export const AnalyticsRoutes = router;
