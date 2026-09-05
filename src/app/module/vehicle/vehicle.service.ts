import httpStatus from "http-status";
import { VehicleVerificationStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import {
  ICreateVehiclePayload,
  IUpdateVehiclePayload,
  IVehicleFilterRequest,
  IVerifyVehiclePayload,
} from "./vehicle.interface";

const createVehicle = async (
  authUser: IRequestUser,
  payload: ICreateVehiclePayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  // Check if vehicleNumber is unique
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { vehicleNumber: payload.vehicleNumber },
  });

  if (existingVehicle) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Vehicle with registration number '${payload.vehicleNumber}' already exists.`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.create({
      data: {
        driverId: driver.id,
        ambulanceType: payload.ambulanceType,
        vehicleNumber: payload.vehicleNumber,
        model: payload.model,
        manufacturer: payload.manufacturer,
        year: payload.year,
        hasOxygen: payload.hasOxygen ?? true,
        hasVentilator: payload.hasVentilator ?? false,
        hasDefibrillator: payload.hasDefibrillator ?? false,
        hasSuctionMachine: payload.hasSuctionMachine ?? false,
        equipmentDetails: payload.equipmentDetails,
        verificationStatus: VehicleVerificationStatus.PENDING,
      },
    });

    // If driver doesn't have an active vehicle set yet, set this one
    if (!driver.currentVehicleId) {
      await tx.driver.update({
        where: { id: driver.id },
        data: { currentVehicleId: vehicle.id },
      });
    }

    return vehicle;
  });

  return result;
};

const getMyVehicles = async (authUser: IRequestUser) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      driverId: driver.id,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return vehicles;
};

const updateVehicle = async (
  authUser: IRequestUser,
  vehicleId: string,
  payload: IUpdateVehiclePayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
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

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      model: payload.model,
      manufacturer: payload.manufacturer,
      year: payload.year,
      hasOxygen: payload.hasOxygen,
      hasVentilator: payload.hasVentilator,
      hasDefibrillator: payload.hasDefibrillator,
      hasSuctionMachine: payload.hasSuctionMachine,
      equipmentDetails: payload.equipmentDetails,
      isActive: payload.isActive,
    },
  });

  return updatedVehicle;
};

const getAllVehicles = async (filters: IVehicleFilterRequest) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: any[] = [{ isDeleted: false }];

  if (filters.searchTerm) {
    andConditions.push({
      OR: [
        {
          vehicleNumber: { contains: filters.searchTerm, mode: "insensitive" },
        },
        { model: { contains: filters.searchTerm, mode: "insensitive" } },
        { manufacturer: { contains: filters.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (filters.ambulanceType) {
    andConditions.push({ ambulanceType: filters.ambulanceType });
  }

  if (filters.verificationStatus) {
    andConditions.push({ verificationStatus: filters.verificationStatus });
  }

  const whereCondition = { AND: andConditions };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true,
          },
        },
      },
    }),
    prisma.vehicle.count({
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
    data: vehicles,
  };
};

const getVehicleById = async (id: string) => {
  const normalizedId = id.trim();

  let vehicle = await prisma.vehicle.findUnique({
    where: { id: normalizedId },
    include: {
      driver: true,
      verifiedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!vehicle) {
    vehicle = await prisma.vehicle.findUnique({
      where: { vehicleNumber: normalizedId },
      include: {
        driver: true,
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  if (!vehicle || vehicle.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Vehicle not found");
  }

  return vehicle;
};

const verifyVehicle = async (
  adminUser: IRequestUser,
  id: string,
  payload: IVerifyVehiclePayload,
) => {
  const normalizedId = id.trim();

  let vehicle = await prisma.vehicle.findUnique({
    where: { id: normalizedId },
  });

  if (!vehicle) {
    vehicle = await prisma.vehicle.findUnique({
      where: { vehicleNumber: normalizedId },
    });
  }

  if (!vehicle || vehicle.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Vehicle not found");
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicle.id },
    data: {
      verificationStatus: payload.status,
      verifiedById: adminUser.userId,
      verifiedAt: new Date(),
      rejectionReason:
        payload.status === VehicleVerificationStatus.REJECTED
          ? payload.reason || "Vehicle failed inspection standards"
          : null,
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
        },
      },
    },
  });

  return updatedVehicle;
};

export const VehicleService = {
  createVehicle,
  getMyVehicles,
  updateVehicle,
  getAllVehicles,
  getVehicleById,
  verifyVehicle,
};
