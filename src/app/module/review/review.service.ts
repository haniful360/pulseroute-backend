import httpStatus from "http-status";
import { Role, TripStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import { ICreateReviewPayload, IReviewFilterRequest } from "./review.interface";

const createReview = async (
  authUser: IRequestUser,
  payload: ICreateReviewPayload,
) => {
  const patient = await prisma.patient.findUnique({
    where: { userId: authUser.userId },
  });

  if (!patient) {
    throw new AppError(httpStatus.NOT_FOUND, "Patient profile not found");
  }

  const trip = await prisma.trip.findUnique({
    where: { id: payload.tripId },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  if (trip.patientId !== patient.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only submit reviews for trips you booked",
    );
  }

  if (trip.status !== TripStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot review a trip with status '${trip.status}'. Review can only be submitted for COMPLETED trips.`,
    );
  }

  if (!trip.driverId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot review a trip without an assigned driver.",
    );
  }

  const existingReview = await prisma.review.findUnique({
    where: { tripId: trip.id },
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This trip has already been reviewed.",
    );
  }

  // Atomic creation of review + recalculation of driver reputation score
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Review
    const review = await tx.review.create({
      data: {
        tripId: trip.id,
        patientId: patient.id,
        driverId: trip.driverId!,
        rating: payload.rating,
        comment: payload.comment,
      },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
    });

    // 2. Recalculate Driver Average Rating
    const agg = await tx.review.aggregate({
      where: { driverId: trip.driverId! },
      _avg: { rating: true },
    });

    const newAvg = agg._avg.rating
      ? Number(agg._avg.rating.toFixed(2))
      : payload.rating;

    await tx.driver.update({
      where: { id: trip.driverId! },
      data: { rating: newAvg },
    });

    return review;
  });

  return result;
};

const getDriverReviews = async (
  driverId: string,
  query: IReviewFilterRequest,
) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = { driverId };
  if (query.rating) {
    whereCondition.rating = Number(query.rating);
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.review.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: reviews,
  };
};

const getMyReviews = async (authUser: IRequestUser) => {
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient) return [];

    return prisma.review.findMany({
      where: { patientId: patient.id },
      include: {
        driver: {
          select: {
            name: true,
            contactNumber: true,
          },
        },
        trip: {
          select: {
            tripCode: true,
            pickupAddress: true,
            destinationAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver) return [];

    return prisma.review.findMany({
      where: { driverId: driver.id },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
        trip: {
          select: {
            tripCode: true,
            pickupAddress: true,
            destinationAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return [];
};

const getAllReviews = async (filters: IReviewFilterRequest) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (filters.rating) {
    whereCondition.rating = Number(filters.rating);
  }
  if (filters.driverId) {
    whereCondition.driverId = filters.driverId;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true, email: true } },
        driver: { select: { name: true, contactNumber: true } },
      },
    }),
    prisma.review.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: reviews,
  };
};

const deleteReview = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Delete review
    await tx.review.delete({
      where: { id: reviewId },
    });

    // 2. Recalculate Driver Average Rating
    const agg = await tx.review.aggregate({
      where: { driverId: review.driverId },
      _avg: { rating: true },
    });

    const newAvg = agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 5.0; // Default back to 5.0 if no reviews left

    await tx.driver.update({
      where: { id: review.driverId },
      data: { rating: newAvg },
    });
  });

  return { message: "Review deleted successfully and driver rating updated" };
};

export const ReviewService = {
  createReview,
  getDriverReviews,
  getMyReviews,
  getAllReviews,
  deleteReview,
};
