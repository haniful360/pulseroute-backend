import { z } from "zod";
import { AmbulanceType, Gender } from "../../../generated/prisma/enums";

// 1. Patient / User Registration Validation
const registerUserSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  gender: z
    .enum([Gender.MALE, Gender.FEMALE, Gender.OTHER])
    .optional(),
  dateOfBirth: z.string().optional(),
  medicalHistory: z.string().optional(),
  avatarUrl: z.string().optional(),
});

// 2. Driver Registration Validation
const registerDriverSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  contactNumber: z
    .string({ message: "Contact number is required" })
    .min(6, "Contact number must be at least 6 digits"),
  licenseNumber: z
    .string({ message: "License number is required" })
    .min(3, "License number must be at least 3 characters"),
  licenseExpiry: z.string().optional(),
  licensePhotoUrl: z.string().optional(),
  licensePhotos: z.union([z.string(), z.array(z.string())]).optional(),
  nidNumber: z.string().optional(),
  nidPhotoUrl: z.string().optional(),
  nidPhotos: z.union([z.string(), z.array(z.string())]).optional(),
  avatarUrl: z.string().optional(),
  experienceYears: z
    .preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().nonnegative().optional(),
    ),
  vehicleNumber: z.string().optional(),
  ambulanceType: z
    .enum([
      AmbulanceType.BASIC,
      AmbulanceType.AC,
      AmbulanceType.ICU,
      AmbulanceType.CCU,
      AmbulanceType.FREEZER,
      AmbulanceType.NEONATAL,
    ])
    .optional(),
  vehiclePhotoUrl: z.string().optional(),
  vehiclePhotos: z.union([z.string(), z.array(z.string())]).optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z
    .preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().optional(),
    ),
  hasOxygen: z
    .preprocess(
      (val) =>
        typeof val === "string" ? val.toLowerCase() === "true" : typeof val === "boolean" ? val : undefined,
      z.boolean().optional(),
    ),
  hasVentilator: z
    .preprocess(
      (val) =>
        typeof val === "string" ? val.toLowerCase() === "true" : typeof val === "boolean" ? val : undefined,
      z.boolean().optional(),
    ),
  hasDefibrillator: z
    .preprocess(
      (val) =>
        typeof val === "string" ? val.toLowerCase() === "true" : typeof val === "boolean" ? val : undefined,
      z.boolean().optional(),
    ),
  hasSuctionMachine: z
    .preprocess(
      (val) =>
        typeof val === "string" ? val.toLowerCase() === "true" : typeof val === "boolean" ? val : undefined,
      z.boolean().optional(),
    ),
  equipmentDetails: z.string().optional(),
});

// 3. OTP Verification
const verifyOtpSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
  otp: z
    .string({ message: "OTP is required" })
    .length(6, "OTP must be exactly 6 digits"),
});

// 4. Resend OTP
const resendOtpSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
  role: z.enum(["USER", "DRIVER"]).optional(),
});

// 5. User / Driver / Admin Login
const loginUserSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password cannot be empty"),
});

// 6. Forgot Password
const forgotPasswordSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
});

// 7. Reset Password
const resetPasswordSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email address format"),
  otp: z
    .string({ message: "OTP is required" })
    .length(6, "OTP must be exactly 6 digits"),
  newPassword: z
    .string({ message: "New password is required" })
    .min(6, "New password must be at least 6 characters"),
});

// 8. Change Password (Authenticated)
const changePasswordSchema = z.object({
  oldPassword: z
    .string({ message: "Old password is required" })
    .min(1, "Old password cannot be empty"),
  newPassword: z
    .string({ message: "New password is required" })
    .min(6, "New password must be at least 6 characters"),
});

// 9. Google Sign-In / Login
const googleLoginSchema = z
  .object({
    idToken: z.string().optional(),
    token: z.string().optional(),
  })
  .refine((data) => Boolean(data.idToken || data.token), {
    message: "Google ID Token (idToken or token) is required",
    path: ["idToken"],
  });

// 10. Refresh Token
const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const AuthValidation = {
  registerUserSchema,
  registerDriverSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  googleLoginSchema,
  refreshTokenSchema,
};
