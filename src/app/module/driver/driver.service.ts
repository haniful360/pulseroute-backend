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
  IUpdateDriverProfilePayload,
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          emailVerified: true,
        },
      },
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

const updateMyDriverProfile = async (
  authUser: IRequestUser,
  payload: IUpdateDriverProfilePayload,
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

  const updatedDriver = await prisma.$transaction(async (tx) => {
    // 1. Update basic User entity if user fields provided
    const userUpdateData: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
    } = {};
    if (payload.name) userUpdateData.name = payload.name;
    if (payload.phone || payload.contactNumber) {
      userUpdateData.phone = payload.phone || payload.contactNumber;
    }
    if (payload.avatarUrl) userUpdateData.avatarUrl = payload.avatarUrl;

    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: authUser.userId },
        data: userUpdateData,
      });
    }

    // 2. Update Driver entity
    const driverUpdateData: any = {};
    if (payload.name) driverUpdateData.name = payload.name;
    if (payload.phone || payload.contactNumber) {
      driverUpdateData.contactNumber = payload.phone || payload.contactNumber;
    }
    if (payload.licenseNumber)
      driverUpdateData.licenseNumber = payload.licenseNumber;
    if (payload.licenseExpiry)
      driverUpdateData.licenseExpiry = new Date(payload.licenseExpiry);
    if (payload.licensePhotoUrl)
      driverUpdateData.licensePhotoUrl = payload.licensePhotoUrl;
    if (payload.licensePhotos && payload.licensePhotos.length > 0) {
      driverUpdateData.licensePhotos = payload.licensePhotos;
      if (!driverUpdateData.licensePhotoUrl) {
        driverUpdateData.licensePhotoUrl = payload.licensePhotos[0];
      }
    }
    if (payload.nidNumber) driverUpdateData.nidNumber = payload.nidNumber;
    if (payload.nidPhotoUrl) driverUpdateData.nidPhotoUrl = payload.nidPhotoUrl;
    if (payload.nidPhotos && payload.nidPhotos.length > 0) {
      driverUpdateData.nidPhotos = payload.nidPhotos;
      if (!driverUpdateData.nidPhotoUrl) {
        driverUpdateData.nidPhotoUrl = payload.nidPhotos[0];
      }
    }
    if (payload.experienceYears !== undefined) {
      driverUpdateData.experienceYears = Number(payload.experienceYears);
    }

    if (Object.keys(driverUpdateData).length > 0) {
      await tx.driver.update({
        where: { id: driver.id },
        data: driverUpdateData,
      });
    }

    // 3. Update or Create Vehicle if vehicle fields provided
    const hasVehiclePayload =
      payload.vehicleNumber ||
      payload.ambulanceType ||
      payload.model ||
      payload.manufacturer ||
      payload.year !== undefined ||
      payload.vehiclePhotoUrl ||
      (payload.vehiclePhotos && payload.vehiclePhotos.length > 0) ||
      payload.hasOxygen !== undefined ||
      payload.hasVentilator !== undefined ||
      payload.hasDefibrillator !== undefined ||
      payload.hasSuctionMachine !== undefined ||
      payload.equipmentDetails;

    if (hasVehiclePayload) {
      if (driver.currentVehicleId) {
        // Update existing vehicle
        const vehicleUpdateData: any = {};
        if (payload.vehicleNumber)
          vehicleUpdateData.vehicleNumber = payload.vehicleNumber;
        if (payload.ambulanceType)
          vehicleUpdateData.ambulanceType = payload.ambulanceType;
        if (payload.model) vehicleUpdateData.model = payload.model;
        if (payload.manufacturer)
          vehicleUpdateData.manufacturer = payload.manufacturer;
        if (payload.year !== undefined)
          vehicleUpdateData.year = Number(payload.year);
        if (payload.vehiclePhotoUrl)
          vehicleUpdateData.photoUrl = payload.vehiclePhotoUrl;
        if (payload.vehiclePhotos && payload.vehiclePhotos.length > 0) {
          vehicleUpdateData.photos = payload.vehiclePhotos;
          if (!vehicleUpdateData.photoUrl) {
            vehicleUpdateData.photoUrl = payload.vehiclePhotos[0];
          }
        }
        if (payload.hasOxygen !== undefined)
          vehicleUpdateData.hasOxygen = payload.hasOxygen;
        if (payload.hasVentilator !== undefined)
          vehicleUpdateData.hasVentilator = payload.hasVentilator;
        if (payload.hasDefibrillator !== undefined)
          vehicleUpdateData.hasDefibrillator = payload.hasDefibrillator;
        if (payload.hasSuctionMachine !== undefined)
          vehicleUpdateData.hasSuctionMachine = payload.hasSuctionMachine;
        if (payload.equipmentDetails !== undefined)
          vehicleUpdateData.equipmentDetails = payload.equipmentDetails;

        await tx.vehicle.update({
          where: { id: driver.currentVehicleId },
          data: vehicleUpdateData,
        });
      } else if (payload.vehicleNumber && payload.ambulanceType) {
        // Create new vehicle and assign as currentVehicleId
        const newVehicle = await tx.vehicle.create({
          data: {
            driverId: driver.id,
            vehicleNumber: payload.vehicleNumber,
            ambulanceType: payload.ambulanceType,
            photoUrl:
              payload.vehiclePhotoUrl ||
              payload.vehiclePhotos?.[0] ||
              undefined,
            photos:
              payload.vehiclePhotos ||
              (payload.vehiclePhotoUrl ? [payload.vehiclePhotoUrl] : []),
            model: payload.model,
            manufacturer: payload.manufacturer,
            year: payload.year ? Number(payload.year) : undefined,
            hasOxygen:
              payload.hasOxygen !== undefined ? payload.hasOxygen : true,
            hasVentilator: payload.hasVentilator || false,
            hasDefibrillator: payload.hasDefibrillator || false,
            hasSuctionMachine: payload.hasSuctionMachine || false,
            equipmentDetails: payload.equipmentDetails,
            verificationStatus: VehicleVerificationStatus.PENDING,
          },
        });

        await tx.driver.update({
          where: { id: driver.id },
          data: { currentVehicleId: newVehicle.id },
        });
      }
    }

    return tx.driver.findUnique({
      where: { id: driver.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            role: true,
            status: true,
            emailVerified: true,
          },
        },
        currentVehicle: true,
        vehicles: true,
        wallet: true,
      },
    });
  });

  return updatedDriver;
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

  const [updatedDriver] = await prisma.$transaction([
    prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: payload.latitude,
        currentLongitude: payload.longitude,
        lastLocationUpdate: new Date(),
      },
    }),
    prisma.driverLocationLog.create({
      data: {
        driverId: driver.id,
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    }),
  ]);

  return {
    driverId: updatedDriver.id,
    currentLatitude: updatedDriver.currentLatitude,
    currentLongitude: updatedDriver.currentLongitude,
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
  updateMyDriverProfile,
  getDriverDashboardOverview,
  updateDutyStatus,
  updateLocation,
  getAllDrivers,
  getDriverById,
  verifyDriver,
};
