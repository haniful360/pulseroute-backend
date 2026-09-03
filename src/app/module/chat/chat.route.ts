import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ChatController } from "./chat.controller";
import { ChatValidation } from "./chat.validation";

const router = Router();

// Send message in an emergency trip
router.post(
  "/:tripId/messages",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  validateRequest(ChatValidation.sendMessageSchema),
  ChatController.sendMessage,
);

// Get message history for a trip
router.get(
  "/:tripId/messages",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  ChatController.getTripMessages,
);

// Mark messages as read
router.patch(
  "/:tripId/read",
  auth(Role.USER, Role.DRIVER, Role.SUPER_ADMIN),
  ChatController.markMessagesAsRead,
);

export const ChatRoutes = router;
