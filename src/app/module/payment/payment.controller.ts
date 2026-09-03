import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { PaymentService } from "./payment.service";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { invoiceId } = req.body;
  const result = await PaymentService.createPaymentIntent(user, invoiceId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stripe Payment Intent created successfully",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { invoiceId, paymentIntentId } = req.body;
  const result = await PaymentService.confirmPayment(
    user,
    invoiceId,
    paymentIntentId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Payment confirmed successfully. Invoice settled and driver wallet updated.",
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const result = await PaymentService.handleWebhook(req.body, signature);

  res.status(httpStatus.OK).json(result);
});

export const PaymentController = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
};
