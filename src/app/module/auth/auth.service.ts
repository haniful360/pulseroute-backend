import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import path from "path";
import {
  AmbulanceType,
  AuthProvider,
  DriverVerificationStatus,
  DutyStatus,
  Role,
  UserStatus,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import AppError from "../../errors/AppError";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { jwtUtils } from "../../utils/jwt";
import {
  IChangePasswordPayload,
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterDriverPayload,
  IRegisterUserPayload,
  IRequestUser,
  IResendOtpPayload,
  IResetPasswordPayload,
  IVerifyOtpPayload,
} from "./auth.interface";

const OTP_EXPIRATION_SECONDS = 5 * 60; // 5 minutes

const sendVerificationEmail = async (
  email: string,
  name: string,
  otp: string,
  role: "USER" | "DRIVER"
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "app",
    "templates",
    "otp-verification.ejs"
  );

  const html = await ejs.renderFile(templatePath, {
    otp,
    name,
    email,
    role,
    expirationMinutes: OTP_EXPIRATION_SECONDS / 60,
  });

  try {
    await transporter.sendMail({
      from: config.smtp_sender,
      to: email,
      subject: `PulseRoute — Verify Your Email (${role === "DRIVER" ? "Driver Application" : "Patient Account"})`,
      text: `Your PulseRoute verification code is: ${otp}. It will expire in 5 minutes.`,
      html,
    });
  } catch (error) {
    console.error("Nodemailer Error sending OTP email:", error);
    if (config.node_env === "development") {
      console.log(`\n==============================================`);
      console.log(`🔑 [DEV MODE] OTP for ${email}: ${otp}`);
      console.log(`==============================================\n`);
    }
  }
};

const sendResetPasswordEmail = async (
  email: string,
  name: string,
  otp: string
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "app",
    "templates",
    "reset-password-otp.ejs"
  );

  const html = await ejs.renderFile(templatePath, {
    otp,
    name,
    email,
    expirationMinutes: OTP_EXPIRATION_SECONDS / 60,
  });

  try {
    await transporter.sendMail({
      from: config.smtp_sender,
      to: email,
      subject: "PulseRoute — Password Reset Code",
      text: `Your PulseRoute password reset code is: ${otp}. It will expire in 5 minutes.`,
      html,
    });
  } catch (error) {
    console.error("Nodemailer Error sending reset password email:", error);
    if (config.node_env === "development") {
      console.log(`\n==============================================`);
      console.log(`🔑 [DEV MODE] Reset OTP for ${email}: ${otp}`);
      console.log(`==============================================\n`);
    }
  }
};

const sendPasswordChangedEmail = async (email: string, name: string) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "app",
    "templates",
    "password-changed.ejs"
  );

  const changedTime = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    const html = await ejs.renderFile(templatePath, {
      name,
      email,
      changedTime,
    });

    await transporter.sendMail({
      from: config.smtp_sender,
      to: email,
      subject: "PulseRoute — Your Password Was Changed",
      text: `Hello ${name}, your PulseRoute account password was successfully updated on ${changedTime}.`,
      html,
    });
  } catch (error) {
    console.error("Nodemailer Error sending password changed email:", error);
  }
};

const sendLoginWelcomeEmail = async (
  email: string,
  name: string,
  role: Role,
  authMethod: "Google Sign-In" | "Email & Password"
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "app",
    "templates",
    "login-welcome.ejs"
  );

  const loginTime = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    const html = await ejs.renderFile(templatePath, {
      name,
      email,
      role,
      authMethod,
      loginTime,
    });

    await transporter.sendMail({
      from: config.smtp_sender,
      to: email,
      subject: `PulseRoute — Welcome Back, ${name}!`,
      text: `Hello ${name}, you have successfully logged in to PulseRoute via ${authMethod} at ${loginTime}.`,
      html,
    });
  } catch (error) {
    console.error("Nodemailer Error sending login welcome email:", error);
  }
};

const registerUser = async (payload: IRegisterUserPayload) => {
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A user with this email already exists"
    );
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpKey = `user_register_otp:${email}`;
  const dataKey = `user_registration_data:${email}`;

  const registrationData = {
    ...payload,
    email,
    password: hashedPassword,
  };

  // Store OTP and pending registration data in Redis with 5-minute TTL
  await redisClient.set(otpKey, otp, { EX: OTP_EXPIRATION_SECONDS });
  await redisClient.set(dataKey, JSON.stringify(registrationData), {
    EX: OTP_EXPIRATION_SECONDS,
  });

  // Send attractive EJS email
  await sendVerificationEmail(email, payload.name, otp, "USER");

  return {
    email,
    expiresIn: "5 minutes",
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
      "An account with this email already exists"
    );
  }

  const isLicenseExists = await prisma.driver.findUnique({
    where: { licenseNumber: payload.licenseNumber },
  });

  if (isLicenseExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "A driver with this license number already exists"
    );
  }

  if (payload.vehicleNumber) {
    const isVehicleExists = await prisma.vehicle.findUnique({
      where: { vehicleNumber: payload.vehicleNumber },
    });
    if (isVehicleExists) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "A vehicle with this license plate / vehicle number already exists"
      );
    }
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
  const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpKey = `driver_register_otp:${email}`;
  const dataKey = `driver_registration_data:${email}`;

  const registrationData = {
    ...payload,
    email,
    password: hashedPassword,
  };

  // Store OTP and pending driver registration data in Redis with 5-minute TTL
  await redisClient.set(otpKey, otp, { EX: OTP_EXPIRATION_SECONDS });
  await redisClient.set(dataKey, JSON.stringify(registrationData), {
    EX: OTP_EXPIRATION_SECONDS,
  });

  // Send attractive EJS email
  await sendVerificationEmail(email, payload.name, otp, "DRIVER");

  return {
    email,
    expiresIn: "5 minutes",
  };
};

const verifyOtp = async (payload: IVerifyOtpPayload) => {
  const email = payload.email.trim().toLowerCase();
  const inputOtp = payload.otp.trim();

  const userOtpKey = `user_register_otp:${email}`;
  const userDataKey = `user_registration_data:${email}`;

  const driverOtpKey = `driver_register_otp:${email}`;
  const driverDataKey = `driver_registration_data:${email}`;

  // 1. Check User (Patient) OTP
  const storedUserOtp = await redisClient.get(userOtpKey);
  if (storedUserOtp) {
    if (storedUserOtp !== inputOtp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid OTP. Please enter the correct 6-digit code."
      );
    }

    const cachedDataStr = await redisClient.get(userDataKey);
    if (!cachedDataStr) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Registration session has expired. Please register again."
      );
    }

    const userData = JSON.parse(cachedDataStr as string);

    // Create User & Patient profile in Database
    const createdUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.contactNumber,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        patient: {
          create: {
            name: userData.name,
            email: userData.email,
            contactNumber: userData.contactNumber,
            address: userData.address,
            emergencyContactName: userData.emergencyContactName,
            emergencyContactNumber: userData.emergencyContactNumber,
            bloodGroup: userData.bloodGroup,
            gender: userData.gender,
            dateOfBirth: userData.dateOfBirth
              ? new Date(userData.dateOfBirth)
              : undefined,
            medicalHistory: userData.medicalHistory,
          },
        },
      },
      omit: { password: true },
      include: { patient: true },
    });

    // Delete Redis keys
    await redisClient.del(userOtpKey);
    await redisClient.del(userDataKey);

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
      config.jwt_access_expires_in
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in
    );

    // Send welcome email upon successful activation
    await sendLoginWelcomeEmail(user.email, user.name, user.role, "Email & Password");

    return {
      type: "USER" as const,
      user,
      patient,
      accessToken,
      refreshToken,
    };
  }

  // 2. Check Driver OTP
  const storedDriverOtp = await redisClient.get(driverOtpKey);
  if (storedDriverOtp) {
    if (storedDriverOtp !== inputOtp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid OTP. Please enter the correct 6-digit code."
      );
    }

    const cachedDataStr = await redisClient.get(driverDataKey);
    if (!cachedDataStr) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Driver registration session has expired. Please register again."
      );
    }

    const driverData = JSON.parse(cachedDataStr as string);

    // In a Prisma Transaction, create User, Driver, Wallet, Vehicle
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: driverData.name,
          email: driverData.email,
          password: driverData.password,
          phone: driverData.contactNumber,
          role: Role.DRIVER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
        omit: { password: true },
      });

      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          name: driverData.name,
          email: driverData.email,
          contactNumber: driverData.contactNumber,
          licenseNumber: driverData.licenseNumber,
          licenseExpiry: driverData.licenseExpiry
            ? new Date(driverData.licenseExpiry)
            : undefined,
          nidNumber: driverData.nidNumber,
          experienceYears: driverData.experienceYears || 0,
          verificationStatus: DriverVerificationStatus.PENDING,
          dutyStatus: DutyStatus.OFFLINE,
        },
      });

      const wallet = await tx.driverWallet.create({
        data: {
          driverId: driver.id,
          balance: 0.0,
          currency: "BDT",
        },
      });

      let vehicle = null;
      if (driverData.vehicleNumber && driverData.ambulanceType) {
        vehicle = await tx.vehicle.create({
          data: {
            driverId: driver.id,
            vehicleNumber: driverData.vehicleNumber,
            ambulanceType: driverData.ambulanceType as AmbulanceType,
            model: driverData.model,
            manufacturer: driverData.manufacturer,
            year: driverData.year ? Number(driverData.year) : undefined,
            hasOxygen:
              driverData.hasOxygen !== undefined ? driverData.hasOxygen : true,
            hasVentilator: driverData.hasVentilator || false,
            hasDefibrillator: driverData.hasDefibrillator || false,
            hasSuctionMachine: driverData.hasSuctionMachine || false,
            equipmentDetails: driverData.equipmentDetails,
            verificationStatus: VehicleVerificationStatus.PENDING,
          },
        });

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

    // Delete Redis keys
    await redisClient.del(driverOtpKey);
    await redisClient.del(driverDataKey);

    const jwtPayload = {
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    };

    const accessToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in
    );

    const refreshToken = jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in
    );

    // Send welcome email upon driver verification
    await sendLoginWelcomeEmail(result.user.email, result.user.name, result.user.role, "Email & Password");

    return {
      type: "DRIVER" as const,
      user: result.user,
      driver: result.driver,
      accessToken,
      refreshToken,
    };
  }

  throw new AppError(
    httpStatus.BAD_REQUEST,
    "No pending registration found for this email, or the OTP has expired. Please register again."
  );
};

const resendOtp = async (payload: IResendOtpPayload) => {
  const email = payload.email.trim().toLowerCase();

  const userOtpKey = `user_register_otp:${email}`;
  const userDataKey = `user_registration_data:${email}`;

  const driverOtpKey = `driver_register_otp:${email}`;
  const driverDataKey = `driver_registration_data:${email}`;

  const cachedUserData = await redisClient.get(userDataKey);
  if (cachedUserData) {
    const userData = JSON.parse(cachedUserData as string);
    const newOtp = crypto.randomInt(100000, 1000000).toString();

    await redisClient.set(userOtpKey, newOtp, { EX: OTP_EXPIRATION_SECONDS });
    await redisClient.set(userDataKey, cachedUserData as string, {
      EX: OTP_EXPIRATION_SECONDS,
    });

    await sendVerificationEmail(email, userData.name, newOtp, "USER");

    return {
      email,
      message: "New verification OTP has been sent to your email.",
      expiresIn: "5 minutes",
    };
  }

  const cachedDriverData = await redisClient.get(driverDataKey);
  if (cachedDriverData) {
    const driverData = JSON.parse(cachedDriverData as string);
    const newOtp = crypto.randomInt(100000, 1000000).toString();

    await redisClient.set(driverOtpKey, newOtp, { EX: OTP_EXPIRATION_SECONDS });
    await redisClient.set(driverDataKey, cachedDriverData as string, {
      EX: OTP_EXPIRATION_SECONDS,
    });

    await sendVerificationEmail(email, driverData.name, newOtp, "DRIVER");

    return {
      email,
      message: "New verification OTP has been sent to your email.",
      expiresIn: "5 minutes",
    };
  }

  throw new AppError(
    httpStatus.NOT_FOUND,
    "No pending registration session found for this email. Please register again."
  );
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found with this email address"
    );
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been permanently deleted"
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been blocked. Please contact support."
    );
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const resetKey = `password_reset_otp:${email}`;

  // Store reset OTP in Redis with 5-minute TTL
  await redisClient.set(resetKey, otp, { EX: OTP_EXPIRATION_SECONDS });

  // Send Reset Password OTP email
  await sendResetPasswordEmail(email, user.name, otp);

  return {
    email,
    expiresIn: "5 minutes",
    message: "Password reset OTP has been sent to your email.",
  };
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const email = payload.email.trim().toLowerCase();
  const inputOtp = payload.otp.trim();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User account not found");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been permanently deleted"
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been blocked. Please contact support."
    );
  }

  const resetKey = `password_reset_otp:${email}`;
  const storedOtp = await redisClient.get(resetKey);

  if (!storedOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Password reset code has expired or is invalid. Please request a new one."
    );
  }

  if (storedOtp !== inputOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid OTP code. Please enter the correct 6-digit code."
    );
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 10;
  const hashedPassword = await bcrypt.hash(payload.newPassword, saltRounds);

  // Update password in Database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      needPasswordChange: false,
    },
  });

  // Clear Redis reset OTP
  await redisClient.del(resetKey);

  // Send security confirmation email
  await sendPasswordChangedEmail(email, user.name);

  return {
    message:
      "Password has been reset successfully! You can now log in with your new password.",
  };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  const idToken = payload.idToken || payload.token;

  if (!idToken) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google ID token is required in body (as idToken or token)"
    );
  }

  let googleIdTokenPayload = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google_client_id,
    });
    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.error("Google ID token verification failed:", error);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Google ID token verification failed. Please try signing in again."
    );
  }

  if (!googleIdTokenPayload) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google ID token payload is missing"
    );
  }

  const { email, name, sub: googleId, picture } = googleIdTokenPayload;

  if (!email || !name || !googleId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Google ID token payload is missing required fields (email, name, sub)"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
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

  let user = existingUser;

  if (existingUser) {
    if (existingUser.status === UserStatus.BLOCKED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been blocked. Please contact support."
      );
    }

    if (
      existingUser.isDeleted ||
      existingUser.status === UserStatus.DELETED
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "This account has been permanently deleted"
      );
    }

    // If existing user does not have googleId linked, link it now
    if (!existingUser.googleId) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId,
          emailVerified: true,
        },
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
    }
  } else {
    // Register new User (Role: USER / Patient) via Google Sign-In
    user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        googleId,
        authProvider: AuthProvider.GOOGLE,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        patient: {
          create: {
            name,
            email: normalizedEmail,
            profilePhoto: picture,
          },
        },
      },
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
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User could not be authenticated");
  }

  // Send login welcome email with login details
  await sendLoginWelcomeEmail(user.email, user.name, user.role, "Google Sign-In");

  // Extract dynamic profile
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
    config.jwt_access_expires_in
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in
  );

  const {
    password: _pass,
    patient: _pat,
    driver: _drv,
    admin: _adm,
    ...sanitizedUser
  } = user;

  const roleTitle =
    user.role === Role.SUPER_ADMIN
      ? "Super Administrator"
      : user.role === Role.DRIVER
      ? "Ambulance Driver"
      : "User";

  return {
    user: sanitizedUser,
    accessToken,
    refreshToken,
    welcomeMessage: `Welcome to PulseRoute, ${user.name}! Logged in successfully via Google as ${roleTitle}.`,
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
    throw new AppError(httpStatus.NOT_FOUND, "No account found with this email");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This account has been permanently deleted"
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been blocked. Please contact support."
    );
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account was registered via Google Login. Please sign in with Google."
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // Send login welcome email with login details
  await sendLoginWelcomeEmail(user.email, user.name, user.role, "Email & Password");

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
    config.jwt_access_expires_in
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in
  );

  const {
    password: _pass,
    patient: _pat,
    driver: _drv,
    admin: _adm,
    ...sanitizedUser
  } = user;

  const roleTitle =
    user.role === Role.SUPER_ADMIN
      ? "Super Administrator"
      : user.role === Role.DRIVER
      ? "Ambulance Driver"
      : "User";

  return {
    user: sanitizedUser,
    accessToken,
    refreshToken,
    welcomeMessage: `Welcome back, ${user.name}! Logged in successfully as ${roleTitle}.`,
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

  const {
    patient: _pat,
    driver: _drv,
    admin: _adm,
    ...sanitizedUser
  } = user;

  return {
    user: sanitizedUser,
    profile,
  };
};

const changePassword = async (
  userPayload: IRequestUser,
  payload: IChangePasswordPayload
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
      "Account registered without password. Please use set-password."
    );
  }

  const isOldPasswordCorrect = await bcrypt.compare(
    payload.oldPassword,
    user.password
  );

  if (!isOldPasswordCorrect) {
    throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect");
  }

  if (payload.oldPassword === payload.newPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "New password cannot be the same as current password"
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
    config.jwt_refresh_secret
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      verifiedRefreshToken.error || "Invalid or expired refresh token"
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User account is inactive or not found"
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
    config.jwt_access_expires_in
  );

  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const AuthService = {
  registerUser,
  registerDriver,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  googleLogin,
  loginUser,
  getMe,
  changePassword,
  refreshToken,
};
