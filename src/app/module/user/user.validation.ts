import { z } from "zod";
import { Gender, Role, UserStatus } from "../../../generated/prisma/enums";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum([Role.USER, Role.DRIVER, Role.SUPER_ADMIN]),
  contactNumber: z.string().optional(),
  status: z.enum([
    UserStatus.ACTIVE,
    UserStatus.BLOCKED,
    UserStatus.PENDING_APPROVAL,
  ]).optional(),
});


const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  phone: z.string().optional().nullable(),
  contactNumber: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  
  // Patient fields
  address: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional().nullable(),
  dateOfBirth: z.union([z.string(), z.date()]).optional().nullable(),
  medicalHistory: z.union([z.string(), z.record(z.string(), z.any()), z.array(z.any())]).optional().nullable(),
  profilePhoto: z.string().optional().nullable(),

  // Driver fields
  nidNumber: z.string().optional().nullable(),
  licenseExpiry: z.string().optional().nullable(),
  experienceYears: z
    .preprocess(
      (val) => (val !== undefined && val !== "" && val !== null ? Number(val) : undefined),
      z.number().int().nonnegative().optional(),
    ),

  // Admin fields
  orgEmail: z.string().email("Invalid email format").optional().nullable(),
  department: z.string().optional().nullable(),

  // Nested payloads
  patient: z.record(z.string(), z.any()).optional(),
  driver: z.record(z.string(), z.any()).optional(),
  admin: z.record(z.string(), z.any()).optional(),
});

const updateUserStatusSchema = z.object({
  status: z.enum([
    UserStatus.ACTIVE,
    UserStatus.BLOCKED,
    UserStatus.DELETED,
    UserStatus.PENDING_APPROVAL,
  ]),
});

export const UserValidation = {
  createUserSchema,
  updateProfileSchema,
  updateUserStatusSchema,
};

