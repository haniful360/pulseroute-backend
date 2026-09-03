import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { WalletService } from "./wallet.service";

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await WalletService.getMyWallet(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Driver wallet retrieved successfully",
    data: result,
  });
});

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await WalletService.getMyTransactions(user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wallet transactions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const createPayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await WalletService.createPayoutRequest(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "Payout request submitted successfully. Awaiting administrative processing.",
    data: result,
  });
});

const getAllPayoutRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await WalletService.getAllPayoutRequests(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payout requests retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const processPayoutRequest = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as IRequestUser;
    const { id } = req.params;
    const result = await WalletService.processPayoutRequest(
      user,
      id as string,
      req.body
    );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Payout request marked as ${result.status} successfully`,
    data: result,
  });
});

export const WalletController = {
  getMyWallet,
  getMyTransactions,
  createPayoutRequest,
  getAllPayoutRequests,
  processPayoutRequest,
};

