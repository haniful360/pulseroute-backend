import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { NotificationController } from "./notification.controller";

const router = Router();

// Get authenticated user's notifications (with unreadCount and pagination)
router.get(
  "/",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  NotificationController.getMyNotifications,
);

// Mark all unread notifications as read
router.patch(
  "/read-all",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  NotificationController.markAllNotificationsAsRead,
);

// Mark a specific notification as read
router.patch(
  "/:id/read",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  NotificationController.markNotificationAsRead,
);

// Delete a notification
router.delete(
  "/:id",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  NotificationController.deleteNotification,
);

export const NotificationRoutes = router;
