import httpStatus from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import {
  IUpdateProfilePayload,
  IUpdateUserStatusPayload,
  IUserFilterRequest,
} from "./user.interface";

const getMyProfile = async (authUser: IRequestUser) => {
  const user = await prisma.user.findUnique({
    where: {
      id: authUser.userId,
    },
    include: {
      patient: true,
      driver: {
        include: {
          currentVehicle: true,
        },
      },
      admin: true,
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or deleted");
  }

  // Remove password from response
  const { password: _, ...userData } = user;
  return userData;
};

const updateMyProfile = async (
  authUser: IRequestUser,
  payload: IUpdateProfilePayload,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: authUser.userId,
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or deleted");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update basic User fields if present
    const userUpdateData: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
    } = {};
    if (payload.name) userUpdateData.name = payload.name;
    if (payload.phone) userUpdateData.phone = payload.phone;
    if (payload.avatarUrl) userUpdateData.avatarUrl = payload.avatarUrl;

    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    // 2. Update role-specific profile
    if (user.role === Role.USER) {
      await tx.patient.upsert({
        where: { userId: user.id },
        update: {
          name: payload.name ?? undefined,
          contactNumber: payload.phone ?? payload.contactNumber ?? undefined,
          address: payload.address ?? undefined,
          emergencyContactName: payload.emergencyContactName ?? undefined,
          emergencyContactNumber: payload.emergencyContactNumber ?? undefined,
          bloodGroup: payload.bloodGroup ?? undefined,
          gender: payload.gender ?? undefined,
          dateOfBirth: payload.dateOfBirth
            ? new Date(payload.dateOfBirth)
            : undefined,
          medicalHistory: payload.medicalHistory ?? undefined,
          profilePhoto: payload.avatarUrl ?? payload.profilePhoto ?? undefined,
        },
        create: {
          userId: user.id,
          name: payload.name ?? user.name,
          email: user.email,
          contactNumber: payload.phone ?? payload.contactNumber,
          address: payload.address,
          emergencyContactName: payload.emergencyContactName,
          emergencyContactNumber: payload.emergencyContactNumber,
          bloodGroup: payload.bloodGroup,
          gender: payload.gender,
          dateOfBirth: payload.dateOfBirth
            ? new Date(payload.dateOfBirth)
            : undefined,
          medicalHistory: payload.medicalHistory,
          profilePhoto: payload.avatarUrl ?? payload.profilePhoto,
        },
      });
    } else if (user.role === Role.DRIVER) {
      const driverRecord = await tx.driver.findUnique({
        where: { userId: user.id },
      });

      if (driverRecord) {
        await tx.driver.update({
          where: { userId: user.id },
          data: {
            name: payload.name ?? undefined,
            contactNumber: payload.phone ?? payload.contactNumber ?? undefined,
            nidNumber: payload.nidNumber ?? undefined,
            experienceYears:
              payload.experienceYears !== undefined
                ? Number(payload.experienceYears)
                : undefined,
          },
        });
      }
    } else if (user.role === Role.SUPER_ADMIN) {
      await tx.admin.upsert({
        where: { userId: user.id },
        update: {
          name: payload.name ?? undefined,
          contactNumber: payload.phone ?? payload.contactNumber ?? undefined,
          orgEmail: payload.orgEmail ?? undefined,
          department: payload.department ?? undefined,
        },
        create: {
          userId: user.id,
          name: payload.name ?? user.name,
          email: user.email,
          contactNumber: payload.phone ?? payload.contactNumber,
          orgEmail: payload.orgEmail,
          department: payload.department,
        },
      });
    }

    // 3. Return refreshed user profile
    const updatedUser = await tx.user.findUnique({
      where: { id: user.id },
      include: {
        patient: true,
        driver: {
          include: {
            currentVehicle: true,
          },
        },
        admin: true,
      },
    });

    return updatedUser;
  });

  if (!result) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update profile",
    );
  }

  const { password: _, ...userData } = result;
  return userData;
};

const getAllUsers = async (filters: IUserFilterRequest) => {
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
        { phone: { contains: filters.searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (filters.role) {
    andConditions.push({ role: filters.role });
  }

  if (filters.status) {
    andConditions.push({ status: filters.status });
  }

  const whereCondition = { AND: andConditions };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        patient: true,
        driver: true,
        admin: true,
      },
    }),
    prisma.user.count({
      where: whereCondition,
    }),
  ]);

  const sanitizedUsers = users.map((u) => {
    const { password: _, ...data } = u;
    return data;
  });

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: sanitizedUsers,
  };
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      patient: true,
      driver: {
        include: {
          currentVehicle: true,
          vehicles: true,
        },
      },
      admin: true,
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const { password: _, ...userData } = user;
  return userData;
};

const updateUserStatus = async (
  id: string,
  payload: IUpdateUserStatusPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status: payload.status,
    },
  });

  const { password: _, ...userData } = updatedUser;
  return userData;
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  await prisma.$transaction(async (tx) => {
    const deletedAt = new Date();

    await tx.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt,
        status: UserStatus.DELETED,
      },
    });

    if (user.role === Role.USER) {
      await tx.patient.updateMany({
        where: { userId: id },
        data: { isDeleted: true, deletedAt },
      });
    } else if (user.role === Role.DRIVER) {
      await tx.driver.updateMany({
        where: { userId: id },
        data: { isDeleted: true, deletedAt },
      });
    } else if (user.role === Role.SUPER_ADMIN) {
      await tx.admin.updateMany({
        where: { userId: id },
        data: { isDeleted: true, deletedAt },
      });
    }
  });

  return { message: "User deleted successfully" };
};

export const UserService = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};
