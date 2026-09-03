import httpStatus from "http-status";
import {
  DriverVerificationStatus,
  DutyStatus,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import {
  IDriverFilterRequest,
  ISetActiveVehiclePayload,
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

  const [updatedDriver] = await prisma.$transaction([
    prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: payload.latitude,
        currentLongitude: payload.longitude,
        currentHeading: payload.heading ?? driver.currentHeading,
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
    lastLocationUpdate: updatedDriver.lastLocationUpdate,
  };
};

const setActiveVehicle = async (
  authUser: IRequestUser,
  payload: ISetActiveVehiclePayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: {
      userId: authUser.userId,
    },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  // Ensure vehicle exists and belongs to driver
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

  const updatedDriver = await prisma.driver.update({
    where: { id: driver.id },
    data: {
      currentVehicleId: payload.vehicleId,
      // If setting unapproved vehicle while ONLINE, turn duty status OFFLINE
      dutyStatus:
        vehicle.verificationStatus !== VehicleVerificationStatus.APPROVED &&
        driver.dutyStatus === DutyStatus.ONLINE
          ? DutyStatus.OFFLINE
          : driver.dutyStatus,
    },
    include: {
      currentVehicle: true,
      vehicles: true,
    },
  });

  return updatedDriver;
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
  const driver = await prisma.driver.findUnique({
    where: { id },
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
  const driver = await prisma.driver.findUnique({
    where: { id },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  const updatedDriver = await prisma.driver.update({
    where: { id },
    data: {
      verificationStatus: payload.status,
      verifiedById: adminUser.userId,
      verifiedAt: new Date(),
      rejectionReason:
        payload.status === DriverVerificationStatus.REJECTED
          ? payload.rejectionReason ||
            "Application does not meet platform requirements"
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
    },
  });

  return updatedDriver;
};

export const DriverService = {
  getMyDriverProfile,
  updateDutyStatus,
  updateLocation,
  setActiveVehicle,
  getAllDrivers,
  getDriverById,
  verifyDriver,
};
