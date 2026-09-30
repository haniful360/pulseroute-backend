import httpStatus from "http-status";
import { NotificationType, Role } from "../../../generated/prisma/enums";
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

const broadcastAnnouncement = async (
  authUser: IRequestUser,
  payload: {
    title: string;
    message: string;
    targetAudience?: "ALL" | "DRIVERS" | "USERS";
    priority?: "NORMAL" | "URGENT" | "CRITICAL";
  },
) => {
  const {
    title,
    message,
    targetAudience = "DRIVERS",
    priority = "NORMAL",
  } = payload;

  const userWhere: Record<string, any> = { isDeleted: false };
  if (targetAudience === "DRIVERS") {
    userWhere.role = Role.DRIVER;
  } else if (targetAudience === "USERS") {
    userWhere.role = Role.USER;
  }

  const targetUsers = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });

  if (targetUsers.length > 0) {
    const notificationsData = targetUsers.map((u) => ({
      userId: u.id,
      title,
      message,
      type:
        priority === "CRITICAL" || priority === "URGENT"
          ? NotificationType.EMERGENCY
          : NotificationType.SYSTEM,
      metadata: {
        isBroadcast: true,
        priority,
        audience: targetAudience,
        senderId: authUser.userId,
      },
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    try {
      targetUsers.forEach((u) => {
        emitNotificationToUser(u.id, {
          title,
          message,
          type:
            priority === "CRITICAL" || priority === "URGENT"
              ? NotificationType.EMERGENCY
              : NotificationType.SYSTEM,
          metadata: { isBroadcast: true, priority, audience: targetAudience },
          createdAt: new Date(),
        });
      });
    } catch {
      // non-blocking socket broadcast
    }
  }

  return {
    recipientsCount: targetUsers.length,
    title,
    message,
    targetAudience,
    priority,
    sentAt: new Date(),
    messageText: `Emergency broadcast successfully dispatched to ${targetUsers.length} recipients.`,
  };
};

const getBroadcastAnnouncements = async () => {
  const notifications = await prisma.notification.findMany({
    where: {
      type: { in: [NotificationType.SYSTEM, NotificationType.EMERGENCY] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const seen = new Set();
  const distinctBroadcasts = [];

  for (const n of notifications) {
    const meta = n.metadata as any;
    if (meta?.isBroadcast && !seen.has(n.title)) {
      seen.add(n.title);
      distinctBroadcasts.push({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        priority: meta.priority || "Normal",
        audience: meta.audience || "All Online Drivers",
      });
    }
  }

  return distinctBroadcasts;
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  broadcastAnnouncement,
  getBroadcastAnnouncements,
};
