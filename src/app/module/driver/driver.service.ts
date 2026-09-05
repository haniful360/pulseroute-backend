import httpStatus from "http-status";
import {
  DriverVerificationStatus,
  DutyStatus,
  OfferStatus,
  TransactionType,
  TripStatus,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import {
  IDriverFilterRequest,
  IUpdateDutyStatusPayload,
  IUpdateLocationPayload,
  IVerifyDriverPayload,
} from "./driver.interface";

const getMyDriverProfile = async (authUser: IRequestUser) => {
  const driver = await prisma.driver.findUnique({
    where: {
      userId: authUser.userId,
    },
    include: {
      currentVehicle: true,
      vehicles: true,
      wallet: true,
    },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  return driver;
};

const updateDutyStatus = async (
  authUser: IRequestUser,
  payload: IUpdateDutyStatusPayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: {
      userId: authUser.userId,
    },
    include: {
      currentVehicle: true,
    },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  // Safety check before going ONLINE
  if (payload.dutyStatus === DutyStatus.ONLINE) {
    if (driver.verificationStatus !== DriverVerificationStatus.APPROVED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Cannot go ONLINE. Your driver application status is ${driver.verificationStatus}. It must be APPROVED by admin.`,
      );
    }

    if (!driver.currentVehicleId || !driver.currentVehicle) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot go ONLINE without an assigned ambulance. Please select or add an active vehicle.",
      );
    }

    if (
      driver.currentVehicle.verificationStatus !==
      VehicleVerificationStatus.APPROVED
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Cannot go ONLINE. Your selected ambulance is ${driver.currentVehicle.verificationStatus}. It must be APPROVED by admin.`,
      );
    }
  }

  const updatedDriver = await prisma.driver.update({
    where: {
      id: driver.id,
    },
    data: {
      dutyStatus: payload.dutyStatus,
    },
    include: {
      currentVehicle: true,
    },
  });

  return updatedDriver;
};

const updateLocation = async (
  authUser: IRequestUser,
  payload: IUpdateLocationPayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: {
      userId: authUser.userId,
    },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  let targetVehicleId = driver.currentVehicleId;
  if (payload.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: payload.vehicleId,
        driverId: driver.id,
        isDeleted: false,
      },
    });

    if (!vehicle) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Vehicle not found or does not belong to your account",
      );
    }
    targetVehicleId = vehicle.id;
  }

  const [updatedDriver] = await prisma.$transaction([
    prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: payload.latitude,
        currentLongitude: payload.longitude,
        currentHeading: payload.heading ?? driver.currentHeading,
        currentVehicleId: targetVehicleId,
        lastLocationUpdate: new Date(),
      },
    }),
    prisma.driverLocationLog.create({
      data: {
        driverId: driver.id,
        latitude: payload.latitude,
        longitude: payload.longitude,
        heading: payload.heading,
        speed: payload.speed,
      },
    }),
  ]);

  return {
    driverId: updatedDriver.id,
    currentLatitude: updatedDriver.currentLatitude,
    currentLongitude: updatedDriver.currentLongitude,
    currentHeading: updatedDriver.currentHeading,
    currentVehicleId: updatedDriver.currentVehicleId,
    lastLocationUpdate: updatedDriver.lastLocationUpdate,
  };
};


const getAllDrivers = async (filters: IDriverFilterRequest) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: any[] = [{ isDeleted: false }];

  if (filters.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { email: { contains: filters.searchTerm, mode: "insensitive" } },
        {
          contactNumber: { contains: filters.searchTerm, mode: "insensitive" },
        },
        {
          licenseNumber: { contains: filters.searchTerm, mode: "insensitive" },
        },
      ],
    });
  }

  if (filters.verificationStatus) {
    andConditions.push({ verificationStatus: filters.verificationStatus });
  }

  if (filters.dutyStatus) {
    andConditions.push({ dutyStatus: filters.dutyStatus });
  }

  const whereCondition = { AND: andConditions };

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        currentVehicle: true,
        wallet: true,
      },
    }),
    prisma.driver.count({
      where: whereCondition,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: drivers,
  };
};

const getDriverById = async (id: string) => {
  const normalizedId = id.trim();

  let driver = await prisma.driver.findUnique({
    where: { id: normalizedId },
    include: {
      vehicles: true,
      currentVehicle: true,
      wallet: true,
      verifiedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!driver) {
    driver = await prisma.driver.findUnique({
      where: { userId: normalizedId },
      include: {
        vehicles: true,
        currentVehicle: true,
        wallet: true,
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  if (!driver) {
    driver = await prisma.driver.findFirst({
      where: {
        OR: [{ email: normalizedId }, { licenseNumber: normalizedId }],
      },
      include: {
        vehicles: true,
        currentVehicle: true,
        wallet: true,
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  return driver;
};

const verifyDriver = async (
  adminUser: IRequestUser,
  id: string,
  payload: IVerifyDriverPayload,
) => {
  const normalizedId = id.trim();

  let driver = await prisma.driver.findUnique({
    where: { id: normalizedId },
  });

  if (!driver) {
    driver = await prisma.driver.findUnique({
      where: { userId: normalizedId },
    });
  }

  if (!driver) {
    driver = await prisma.driver.findFirst({
      where: {
        OR: [{ email: normalizedId }, { licenseNumber: normalizedId }],
      },
    });
  }

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: driver.id },
    data: {
      verificationStatus: payload.status,
      verifiedById: adminUser.userId,
      verifiedAt: new Date(),
      rejectionReason:
        payload.status === DriverVerificationStatus.REJECTED ||
        payload.status === DriverVerificationStatus.SUSPENDED
          ? payload.reason || "Application does not meet platform requirements"
          : null,
      // If rejected or suspended, immediately turn dutyStatus OFFLINE
      dutyStatus:
        payload.status === DriverVerificationStatus.REJECTED ||
        payload.status === DriverVerificationStatus.SUSPENDED
          ? DutyStatus.OFFLINE
          : driver.dutyStatus,
    },
    include: {
      currentVehicle: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  return updatedDriver;
};

const getDriverDashboardOverview = async (authUser: IRequestUser) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
    include: {
      currentVehicle: true,
      wallet: true,
    },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const walletId = driver.wallet?.id;

  const [
    activeTrip,
    pendingOffersCount,
    todayEarningsAgg,
    weekEarningsAgg,
    completedTripsCount,
    cancelledTripsCount,
    recentTrips,
    recentReviews,
  ] = await Promise.all([
    // Currently active trip
    prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        status: {
          in: [
            TripStatus.ACCEPTED,
            TripStatus.EN_ROUTE,
            TripStatus.ARRIVED,
            TripStatus.IN_TRANSIT,
          ],
        },
      },
      include: {
        patient: {
          select: {
            name: true,
            contactNumber: true,
            bloodGroup: true,
            emergencyContactName: true,
            emergencyContactNumber: true,
          },
        },
        vehicle: true,
      },
    }),

    // Pending incoming dispatch offers
    prisma.dispatchOffer.count({
      where: {
        driverId: driver.id,
        status: OfferStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    }),

    // Today's earnings
    walletId
      ? prisma.walletTransaction.aggregate({
          where: {
            walletId,
            type: TransactionType.TRIP_EARNING,
            createdAt: { gte: startOfToday },
          },
          _sum: { amount: true },
        })
      : { _sum: { amount: null } },

    // This week's earnings
    walletId
      ? prisma.walletTransaction.aggregate({
          where: {
            walletId,
            type: TransactionType.TRIP_EARNING,
            createdAt: { gte: startOfWeek },
          },
          _sum: { amount: true },
        })
      : { _sum: { amount: null } },

    // Trip counts
    prisma.trip.count({
      where: { driverId: driver.id, status: TripStatus.COMPLETED },
    }),
    prisma.trip.count({
      where: { driverId: driver.id, status: TripStatus.CANCELLED },
    }),

    // Recent 5 trips
    prisma.trip.findMany({
      where: { driverId: driver.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true, contactNumber: true } },
        vehicle: { select: { ambulanceType: true, vehicleNumber: true } },
        invoice: { select: { totalAmount: true, paymentStatus: true } },
      },
    }),

    // Recent 5 reviews
    prisma.review.findMany({
      where: { driverId: driver.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true } },
      },
    }),
  ]);

  const isVehicleApproved =
    driver.currentVehicle?.verificationStatus ===
    VehicleVerificationStatus.APPROVED;
  const isDriverApproved =
    driver.verificationStatus === DriverVerificationStatus.APPROVED;
  const isEligibleForDuty = isDriverApproved && isVehicleApproved;

  return {
    profile: {
      id: driver.id,
      name: driver.name,
      contactNumber: driver.contactNumber,
      verificationStatus: driver.verificationStatus,
    },
    duty: {
      dutyStatus: driver.dutyStatus,
      isEligibleForDuty,
      currentVehicle: driver.currentVehicle,
    },
    financials: {
      walletBalance: Number(driver.wallet?.balance || 0),
      todayEarnings: Number(todayEarningsAgg._sum.amount || 0),
      weeklyEarnings: Number(weekEarningsAgg._sum.amount || 0),
      totalEarnings: Number(driver.wallet?.totalEarnings || 0),
      totalCommissionPaid: Number(driver.wallet?.totalCommissionPaid || 0),
      totalWithdrawn: Number(driver.wallet?.totalWithdrawn || 0),
    },
    performance: {
      rating: driver.rating,
      completedTrips: completedTripsCount,
      cancelledTrips: cancelledTripsCount,
      totalTripsAssigned: driver.totalTrips,
    },
    live: {
      activeTrip,
      pendingOffersCount,
    },
    recentTrips,
    recentReviews,
  };
};

export const DriverService = {
  getMyDriverProfile,
  getDriverDashboardOverview,
  updateDutyStatus,
  updateLocation,
  getAllDrivers,
  getDriverById,
  verifyDriver,
};
