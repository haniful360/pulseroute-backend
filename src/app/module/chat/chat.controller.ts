import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { ChatService } from "./chat.service";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const tripId = req.params.tripId as string;
  const { message } = req.body;

  const result = await ChatService.sendMessage(user, tripId, message);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

const getTripMessages = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const tripId = req.params.tripId as string;

  const result = await ChatService.getTripMessages(user, tripId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip messages retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const markMessagesAsRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const tripId = req.params.tripId as string;

  const result = await ChatService.markMessagesAsRead(user, tripId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const ChatController = {
  sendMessage,
  getTripMessages,
  markMessagesAsRead,
};
