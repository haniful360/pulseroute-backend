import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import {
  AmbulanceType,
  DriverVerificationStatus,
  DutyStatus,
  Role,
  UserStatus,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import {
  IChangePasswordPayload,
  ILoginUserPayload,
  IRegisterDriverPayload,
  IRegisterUserPayload,
  IRequestUser,
} from "./auth.interface";

const registerUser = async (payload: IRegisterUserPayload) => {
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A user with this email already exists",
    );
  }

  const saltRounds = Number(config.bcrypt_salt_rounds);
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  const createdUser = await prisma.user.create({
    data: {
      name: payload.name,
      email,
      password: hashedPassword,
      phone: payload.contactNumber,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      patient: {
        create: {
          name: payload.name,
          email,
          contactNumber: payload.contactNumber,
          address: payload.address,
          emergencyContactName: payload.emergencyContactName,
          emergencyContactNumber: payload.emergencyContactNumber,
          bloodGroup: payload.bloodGroup,
          gender: payload.gender,
          dateOfBirth: payload.dateOfBirth
            ? new Date(payload.dateOfBirth)
            : undefined,
          medicalHistory: payload.medicalHistory,
        },
      },
    },
    omit: { password: true },
    include: { patient: true },
  });

  const { patient, ...user } = createdUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    user,
    patient,
    accessToken,
    refreshToken,
  };
};

const registerDriver = async (payload: IRegisterDriverPayload) => {
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "An account with this email already exists",
    );
  }

  const isLicenseExists = await prisma.driver.findUnique({
    where: { licenseNumber: payload.licenseNumber },
  });

  if (isLicenseExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A driver with this license number already exists",
    );
  }

  if (payload.vehicleNumber) {
    const isVehicleExists = await prisma.vehicle.findUnique({
      where: { vehicleNumber: payload.vehicleNumber },
    });
    if (isVehicleExists) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "A vehicle with this license plate / vehicle number already exists",
      );
    }
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Base User
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email,
        password: hashedPassword,
        phone: payload.contactNumber,
        role: Role.DRIVER,
        status: UserStatus.ACTIVE,
        emailVerified: false,
      },
      omit: { password: true },
    });

    // 2. Create Driver Profile
    const driver = await tx.driver.create({
      data: {
        userId: user.id,
        name: payload.name,
        email,
        contactNumber: payload.contactNumber,
        licenseNumber: payload.licenseNumber,
        licenseExpiry: payload.licenseExpiry
          ? new Date(payload.licenseExpiry)
          : undefined,
        nidNumber: payload.nidNumber,
        experienceYears: payload.experienceYears || 0,
        verificationStatus: DriverVerificationStatus.PENDING,
        dutyStatus: DutyStatus.OFFLINE,
      },
    });

    // 3. Create Driver Wallet
    const wallet = await tx.driverWallet.create({
      data: {
        driverId: driver.id,
        balance: 0.0,
        currency: "BDT",
      },
    });

    // 4. Create Vehicle (if provided)
    let vehicle = null;
    if (payload.vehicleNumber && payload.ambulanceType) {
      vehicle = await tx.vehicle.create({
        data: {
          driverId: driver.id,
          vehicleNumber: payload.vehicleNumber,
          ambulanceType: payload.ambulanceType as AmbulanceType,
          model: payload.model,
          manufacturer: payload.manufacturer,
          year: payload.year ? Number(payload.year) : undefined,
          hasOxygen: payload.hasOxygen !== undefined ? payload.hasOxygen : true,
          hasVentilator: payload.hasVentilator || false,
          hasDefibrillator: payload.hasDefibrillator || false,
          hasSuctionMachine: payload.hasSuctionMachine || false,
          equipmentDetails: payload.equipmentDetails,
          verificationStatus: VehicleVerificationStatus.PENDING,
        },
      });

      // Set as driver's active vehicle
      await tx.driver.update({
        where: { id: driver.id },
        data: { currentVehicleId: vehicle.id },
      });
    }

    return {
      user,
      driver: {
        ...driver,
        currentVehicle: vehicle,
        wallet,
      },
    };
  });

  const jwtPayload = {
    userId: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    user: result.user,
    driver: result.driver,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patient: true,
      driver: {
        include: {
          currentVehicle: true,
          wallet: true,
        },
      },
      admin: true,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found with this email",
    );
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been permanently deleted",
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been blocked. Please contact support.",
    );
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account was registered via Google Login. Please sign in with Google.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // Extract relevant profile dynamically based on user role
  let profile = null;
  if (user.role === Role.USER) {
    profile = user.patient;
  } else if (user.role === Role.DRIVER) {
    profile = user.driver;
  } else if (user.role === Role.SUPER_ADMIN) {
    profile = user.admin;
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  const {
    password: _pass,
    patient: _pat,
    driver: _drv,
    admin: _adm,
    ...sanitizedUser
  } = user;

  return {
    user: sanitizedUser,
    profile,
    accessToken,
    refreshToken,
  };
};

const getMe = async (userPayload: IRequestUser) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userPayload.userId,
    },
    omit: {
      password: true,
    },
    include: {
      patient: true,
      driver: {
        include: {
          currentVehicle: true,
          wallet: true,
          vehicles: true,
        },
      },
      admin: true,
    },
  });

  if (!user || user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.NOT_FOUND, "User profile not found");
  }

  let profile = null;
  if (user.role === Role.USER) {
    profile = user.patient;
  } else if (user.role === Role.DRIVER) {
    profile = user.driver;
  } else if (user.role === Role.SUPER_ADMIN) {
    profile = user.admin;
  }

  const { patient: _pat, driver: _drv, admin: _adm, ...sanitizedUser } = user;

  return {
    user: sanitizedUser,
    profile,
  };
};

const changePassword = async (
  userPayload: IRequestUser,
  payload: IChangePasswordPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Account registered without password. Please use set-password.",
    );
  }

  const isOldPasswordCorrect = await bcrypt.compare(
    payload.oldPassword,
    user.password,
  );

  if (!isOldPasswordCorrect) {
    throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  }

  if (payload.oldPassword === payload.newPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "New password cannot be the same as current password",
    );
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
  const hashedNewPassword = await bcrypt.hash(payload.newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedNewPassword,
      needPasswordChange: false,
    },
  });

  return {
    message: "Password updated successfully",
  };
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      verifiedRefreshToken.error || "Invalid or expired refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User account is inactive or not found",
    );
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const AuthService = {
  registerUser,
  registerDriver,
  loginUser,
  getMe,
  changePassword,
  refreshToken,
};
