import httpStatus from "http-status";
import { NotificationType, Role } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { getIO } from "../../lib/socket";
import { IRequestUser } from "../auth/auth.interface";
import { NotificationService } from "../notification/notification.service";
import { IChatMessageFilter } from "./chat.interface";

const sendMessage = async (
  authUser: IRequestUser,
  tripId: string,
  messageText: string,
) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      patient: { select: { id: true, userId: true, name: true } },
      driver: { select: { id: true, userId: true, name: true } },
    },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  // Verify participant access
  const isPatient = trip.patient.userId === authUser.userId;
  const isDriver = trip.driver?.userId === authUser.userId;
  const isAdmin = authUser.role === Role.SUPER_ADMIN;

  if (!isPatient && !isDriver && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to participate in this trip's chat",
    );
  }

  // 1. Persist message in database
  const chatMessage = await prisma.chatMessage.create({
    data: {
      tripId,
      senderId: authUser.userId,
      message: messageText.trim(),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

  // 2. Real-time instant push via Socket.io to the trip room
  try {
    getIO()?.to(`trip:${tripId}`).emit("chat:new-message", chatMessage);
  } catch {
    // Non-blocking socket emission
  }

  // 3. Send In-App notification to the recipient
  try {
    let recipientUserId: string | null = null;
    let senderName = authUser.name || "Trip Participant";

    if (isPatient && trip.driver) {
      recipientUserId = trip.driver.userId;
      senderName = `Patient (${trip.patient.name})`;
    } else if (isDriver) {
      recipientUserId = trip.patient.userId;
      senderName = `Driver (${trip.driver?.name})`;
    }

    if (recipientUserId) {
      const preview =
        messageText.length > 60
          ? `${messageText.substring(0, 60)}...`
          : messageText;

      await NotificationService.createNotification({
        userId: recipientUserId,
        title: `💬 New message from ${senderName}`,
        message: preview,
        type: NotificationType.TRIP,
        link: `/trips/${tripId}`,
        metadata: { tripId, messageId: chatMessage.id },
      });
    }
  } catch {
    // Non-blocking notification
  }

  return chatMessage;
};

const getTripMessages = async (
  authUser: IRequestUser,
  tripId: string,
  query: IChatMessageFilter,
) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      patient: { select: { userId: true } },
      driver: { select: { userId: true } },
    },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  const isPatient = trip.patient.userId === authUser.userId;
  const isDriver = trip.driver?.userId === authUser.userId;
  const isAdmin = authUser.role === Role.SUPER_ADMIN;

  if (!isPatient && !isDriver && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view messages for this trip",
    );
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { tripId },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    }),
    prisma.chatMessage.count({ where: { tripId } }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: messages,
  };
};

const markMessagesAsRead = async (authUser: IRequestUser, tripId: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      patient: { select: { userId: true } },
      driver: { select: { userId: true } },
    },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  const isPatient = trip.patient.userId === authUser.userId;
  const isDriver = trip.driver?.userId === authUser.userId;
  const isAdmin = authUser.role === Role.SUPER_ADMIN;

  if (!isPatient && !isDriver && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to access this trip's messages",
    );
  }

  const result = await prisma.chatMessage.updateMany({
    where: {
      tripId,
      senderId: { not: authUser.userId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  // Emit read receipt via socket
  try {
    getIO()?.to(`trip:${tripId}`).emit("chat:messages-read", {
      tripId,
      readBy: authUser.userId,
    });
  } catch {
    // Non-blocking
  }

  return {
    updatedCount: result.count,
    message: "Messages marked as read",
  };
};

export const ChatService = {
  sendMessage,
  getTripMessages,
  markMessagesAsRead,
};
