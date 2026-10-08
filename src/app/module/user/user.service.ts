import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import {
  DriverVerificationStatus,
  PaymentStatus,
  Role,
  TripStatus,
  UserStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import {
  IUpdateProfilePayload,
  IUpdateUserStatusPayload,
  IUserFilterRequest,
} from "./user.interface";

const formatUserResponse = (user: any) => {
  if (!user) return null;
  const { password: _, patient, driver, admin, ...userData } = user;

  if (userData.role === Role.SUPER_ADMIN) {
    return {
      ...userData,
      admin: admin || null,
    };
  }

  if (userData.role === Role.DRIVER) {
    return {
      ...userData,
      driver: driver || null,
    };
  }

  // Default: Role.USER (Patient)
  return {
    ...userData,
    patient: patient || null,
  };
};

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

  return formatUserResponse(user);
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

  // Flatten nested patient data if provided
  if (payload.patient && typeof payload.patient === "object") {
    payload = {
      ...payload.patient,
      ...payload,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update basic User fields if present
    const userUpdateData: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
    } = {};
    if (payload.name !== undefined && payload.name !== null) userUpdateData.name = payload.name;
    if (payload.phone !== undefined && payload.phone !== null) {
      userUpdateData.phone = payload.phone;
    } else if (payload.contactNumber !== undefined && payload.contactNumber !== null) {
      userUpdateData.phone = payload.contactNumber;
    }
    if (payload.avatarUrl !== undefined && payload.avatarUrl !== null) {
      userUpdateData.avatarUrl = payload.avatarUrl;
    } else if (payload.profilePhoto !== undefined && payload.profilePhoto !== null) {
      userUpdateData.avatarUrl = payload.profilePhoto;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await tx.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    // 2. Update role-specific profile
    if (user.role === Role.USER) {
      // Parse dateOfBirth cleanly
      let parsedDob: Date | null | undefined = undefined;
      if (payload.dateOfBirth !== undefined) {
        if (!payload.dateOfBirth) {
          parsedDob = null;
        } else {
          const d = new Date(payload.dateOfBirth);
          if (!isNaN(d.getTime())) {
            parsedDob = d;
          }
        }
      }

      // Format medical history
      let medicalHistoryStr: string | null | undefined = undefined;
      if (payload.medicalHistory !== undefined) {
        if (payload.medicalHistory === null) {
          medicalHistoryStr = null;
        } else if (typeof payload.medicalHistory === "object") {
          medicalHistoryStr = JSON.stringify(payload.medicalHistory);
        } else {
          medicalHistoryStr = String(payload.medicalHistory);
        }
      }

      const patientUpdateData: Record<string, any> = {};
      if (payload.name !== undefined) patientUpdateData.name = payload.name;
      if (payload.phone !== undefined || payload.contactNumber !== undefined) {
        patientUpdateData.contactNumber = payload.phone ?? payload.contactNumber;
      }
      if (payload.address !== undefined) patientUpdateData.address = payload.address;
      if (payload.emergencyContactNumber !== undefined) {
        patientUpdateData.emergencyContactNumber = payload.emergencyContactNumber;
      }
      if (payload.bloodGroup !== undefined) patientUpdateData.bloodGroup = payload.bloodGroup;
      if (payload.gender !== undefined) patientUpdateData.gender = payload.gender;
      if (parsedDob !== undefined) patientUpdateData.dateOfBirth = parsedDob;
      if (medicalHistoryStr !== undefined) patientUpdateData.medicalHistory = medicalHistoryStr;
      if (payload.avatarUrl !== undefined || payload.profilePhoto !== undefined) {
        patientUpdateData.profilePhoto = payload.avatarUrl ?? payload.profilePhoto;
      }

      await tx.patient.upsert({
        where: { userId: user.id },
        update: patientUpdateData,
        create: {
          userId: user.id,
          name: payload.name ?? user.name,
          email: user.email,
          contactNumber: payload.phone ?? payload.contactNumber ?? user.phone,
          address: payload.address ?? null,
          emergencyContactNumber: payload.emergencyContactNumber ?? null,
          bloodGroup: payload.bloodGroup ?? null,
          gender: payload.gender ?? null,
          dateOfBirth: parsedDob ?? null,
          medicalHistory: medicalHistoryStr ?? null,
          profilePhoto: payload.avatarUrl ?? payload.profilePhoto ?? user.avatarUrl,
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
            licenseExpiry: payload.licenseExpiry
              ? new Date(payload.licenseExpiry)
              : undefined,
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

  return formatUserResponse(result);
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

  const sanitizedUsers = users.map((u) => formatUserResponse(u));

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

  return formatUserResponse(user);
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
    include: {
      patient: true,
      driver: true,
      admin: true,
    },
  });

  return formatUserResponse(updatedUser);
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

const getUserDashboardOverview = async (authUser: IRequestUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      patient: true,
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found or deleted");
  }

  if (user.role !== Role.USER) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only patients / standard users can access patient dashboard overview",
    );
  }

  // Ensure patient profile exists
  let patient = user.patient;
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        contactNumber: user.phone,
      },
    });
  }

  const [
    activeTrip,
    totalTripsCount,
    completedTripsCount,
    spentAgg,
    unpaidInvoices,
    recentTrips,
  ] = await Promise.all([
    // Active emergency trip
    prisma.trip.findFirst({
      where: {
        patientId: patient.id,
        status: {
          in: [
            TripStatus.REQUESTED,
            TripStatus.ACCEPTED,
            TripStatus.EN_ROUTE,
            TripStatus.ARRIVED,
            TripStatus.IN_TRANSIT,
          ],
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            contactNumber: true,
            rating: true,
            currentLatitude: true,
            currentLongitude: true,
          },
        },
        vehicle: {
          select: {
            ambulanceType: true,
            vehicleNumber: true,
            model: true,
            hasOxygen: true,
            hasVentilator: true,
            hasDefibrillator: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Total trips booked
    prisma.trip.count({
      where: { patientId: patient.id },
    }),

    // Completed trips
    prisma.trip.count({
      where: { patientId: patient.id, status: TripStatus.COMPLETED },
    }),

    // Total spent
    prisma.invoice.aggregate({
      where: { patientId: patient.id, paymentStatus: PaymentStatus.PAID },
      _sum: { paidAmount: true, totalAmount: true },
    }),

    // Unpaid invoices
    prisma.invoice.findMany({
      where: { patientId: patient.id, paymentStatus: PaymentStatus.UNPAID },
      include: {
        trip: {
          select: {
            tripCode: true,
            pickupAddress: true,
            destinationAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Recent 5 trips
    prisma.trip.findMany({
      where: { patientId: patient.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true, contactNumber: true, rating: true } },
        vehicle: { select: { ambulanceType: true, vehicleNumber: true } },
        invoice: {
          select: { id: true, totalAmount: true, paymentStatus: true, paidAmount: true },
        },
      },
    }),
  ]);

  // Total spent calculation (handles both paidAmount and totalAmount)
  const paidSum = Number(spentAgg._sum.paidAmount || 0);
  const totalAmountSum = Number(spentAgg._sum.totalAmount || 0);
  const totalSpent = paidSum > 0 ? paidSum : totalAmountSum;

  // Format recent trips with explicit numerical fare
  const formattedRecentTrips = recentTrips.map((trip) => {
    const tripFare = Number(
      trip.invoice?.totalAmount ?? trip.invoice?.paidAmount ?? trip.estimatedFare ?? 0
    );
    return {
      ...trip,
      fare: tripFare,
    };
  });

  // Health profile completeness calculation
  let completenessScore = 0;
  if (patient.bloodGroup) completenessScore += 20;
  if (patient.contactNumber) completenessScore += 20;
  if (patient.address) completenessScore += 20;
  if (patient.emergencyContactNumber) completenessScore += 20;
  if (patient.medicalHistory) completenessScore += 20;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
    emergencyProfile: {
      bloodGroup: patient.bloodGroup,
      contactNumber: patient.contactNumber,
      address: patient.address,
      gender: patient.gender,
      emergencyContactNumber: patient.emergencyContactNumber,
      medicalHistory: patient.medicalHistory,
      profileCompleteness: `${completenessScore}%`,
    },
    live: {
      activeTrip,
      nationalHotline: "999",
    },
    stats: {
      totalTripsBooked: totalTripsCount,
      completedTrips: completedTripsCount,
      totalSpent,
      unpaidInvoicesCount: unpaidInvoices.length,
    },
    // Top-level aliases for direct frontend access
    activeTrip,
    totalTripsCount,
    completedTripsCount,
    totalSpent,
    totalSettled: totalSpent,
    spentAgg: {
      _sum: {
        paidAmount: totalSpent,
        totalAmount: totalAmountSum,
      },
    },
    completenessScore,
    unpaidInvoices,
    recentTrips: formattedRecentTrips,
  };
};

const createUser = async (payload: {
  name: string;
  email: string;
  password?: string;
  role: Role;
  contactNumber?: string;
  status?: UserStatus;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(
    payload.password || "PulseRoute@2025",
    12,
  );

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        password: hashedPassword,
        role: payload.role,
        contactNumber: payload.contactNumber,
        status: payload.status || UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });

    if (payload.role === Role.USER) {
      await tx.patient.create({
        data: {
          userId: user.id,
          name: payload.name,
          email: payload.email.toLowerCase(),
          contactNumber: payload.contactNumber,
        },
      });
    } else if (payload.role === Role.DRIVER) {
      await tx.driver.create({
        data: {
          userId: user.id,
          name: payload.name,
          email: payload.email.toLowerCase(),
          contactNumber: payload.contactNumber || "",
          licenseNumber:
            (payload as any).licenseNumber ||
            `DL-${user.id.slice(0, 8).toUpperCase()}`,
          verificationStatus: DriverVerificationStatus.APPROVED,
        },
      });
    } else if (payload.role === Role.SUPER_ADMIN) {
      await tx.admin.create({
        data: {
          userId: user.id,
          name: payload.name,
          email: payload.email.toLowerCase(),
          contactNumber: payload.contactNumber,
        },
      });
    }

    return user;
  });

  return formatUserResponse(newUser);
};

export const UserService = {
  createUser,
  getMyProfile,
  getUserDashboardOverview,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};
