import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import { TripService } from "./trip.service";

const createTripRequest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await TripService.createTripRequest(user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "Emergency trip requested successfully. Searching and dispatching nearby ambulances.",
    data: result,
  });
});

const getMyOffers = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await TripService.getMyOffers(user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pending dispatch offers retrieved successfully",
    data: result,
  });
});

const acceptDispatchOffer = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { offerId } = req.params;
  const result = await TripService.acceptDispatchOffer(user, offerId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Emergency dispatch offer accepted. Trip is now in progress.",
    data: result,
  });
});

const rejectDispatchOffer = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { offerId } = req.params;
  const result = await TripService.rejectDispatchOffer(user, offerId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dispatch offer rejected",
    data: result,
  });
});

const updateTripStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const result = await TripService.updateTripStatus(
    user,
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Trip status updated to '${result.status}' successfully`,
    data: result,
  });
});

const cancelTrip = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const result = await TripService.cancelTrip(user, id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip cancelled successfully",
    data: result,
  });
});

const getMyTrips = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await TripService.getMyTrips(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip history retrieved successfully",
    data: result,
  });
});

const getTripById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const result = await TripService.getTripById(user, id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip details retrieved successfully",
    data: result,
  });
});

const getAllTrips = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getAllTrips(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trips retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const TripController = {
  createTripRequest,
  getMyOffers,
  acceptDispatchOffer,
  rejectDispatchOffer,
  updateTripStatus,
  cancelTrip,
  getMyTrips,
  getTripById,
  getAllTrips,
};
