import httpStatus from "http-status";
import { NotificationType } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { emitNotificationToUser } from "../../lib/socket";
import { IRequestUser } from "../auth/auth.interface";
import {
  ICreateNotificationPayload,
  INotificationFilter,
} from "./notification.interface";

const createNotification = async (payload: ICreateNotificationPayload) => {
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || NotificationType.SYSTEM,
      link: payload.link || null,
      metadata: payload.metadata || undefined,
    },
  });

  // Real-time instant push to user's private socket room
  try {
    emitNotificationToUser(payload.userId, notification);
  } catch {
    // Non-blocking socket emission
  }

  return notification;
};

const getMyNotifications = async (
  authUser: IRequestUser,
  query: INotificationFilter,
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 15;
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {
    userId: authUser.userId,
  };

  if (query.isRead !== undefined) {
    where.isRead = String(query.isRead) === "true";
  }

  if (query.type) {
    where.type = query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: authUser.userId, isRead: false },
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
    data: notifications,
  };
};

const markNotificationAsRead = async (authUser: IRequestUser, id: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== authUser.userId) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

const markAllNotificationsAsRead = async (authUser: IRequestUser) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId: authUser.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return {
    updatedCount: result.count,
    message: "All notifications marked as read",
  };
};

const deleteNotification = async (authUser: IRequestUser, id: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== authUser.userId) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  await prisma.notification.delete({
    where: { id },
  });

  return { message: "Notification deleted successfully" };
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
