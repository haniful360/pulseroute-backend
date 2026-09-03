import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { InvoiceService } from "./invoice.service";

const generateInvoiceForTrip = catchAsync(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const result = await InvoiceService.generateInvoiceForTrip(tripId as string);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice generated successfully",
    data: result,
  });
});

const payInvoice = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const result = await InvoiceService.payInvoice(user, id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice payment recorded successfully. Driver wallet updated.",
    data: result,
  });
});

const getInvoiceById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const result = await InvoiceService.getInvoiceById(user, id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await InvoiceService.getMyInvoices(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices retrieved successfully",
    data: result,
  });
});

const getAllInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await InvoiceService.getAllInvoices(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All invoices retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const InvoiceController = {
  generateInvoiceForTrip,
  payInvoice,
  getInvoiceById,
  getMyInvoices,
  getAllInvoices,
};

