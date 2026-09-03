import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await NotificationService.getMyNotifications(user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const id = req.params.id as string;
    const result = await NotificationService.markNotificationAsRead(user, id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  },
);

const markAllNotificationsAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const result = await NotificationService.markAllNotificationsAsRead(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result,
    });
  },
);

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const id = req.params.id as string;
  const result = await NotificationService.deleteNotification(user, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const NotificationController = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
