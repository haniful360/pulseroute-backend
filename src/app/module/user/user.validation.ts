import { z } from "zod";
import { Gender, UserStatus } from "../../../generated/prisma/enums";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  phone: z.string().optional(),
  contactNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
  
  // Patient fields
  address: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  dateOfBirth: z.string().optional(),
  medicalHistory: z.string().optional(),
  profilePhoto: z.string().optional(),

  // Driver fields
  nidNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  experienceYears: z
    .preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().int().nonnegative().optional(),
    ),

  // Admin fields
  orgEmail: z.string().email("Invalid email format").optional(),
  department: z.string().optional(),
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
  updateProfileSchema,
  updateUserStatusSchema,
};

