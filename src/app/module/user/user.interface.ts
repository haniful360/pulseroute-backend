import { Gender, Role, UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateProfilePayload {
  // Common user fields
  name?: string;
  phone?: string;
  contactNumber?: string;
  avatarUrl?: string | null;

  // Patient profile fields
  address?: string | null;
  emergencyContactNumber?: string | null;
  bloodGroup?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | Date | null;
  medicalHistory?: string | Record<string, any> | any[] | null;
  profilePhoto?: string | null;

  // Driver profile fields
  nidNumber?: string | null;
  licenseExpiry?: string | Date | null;
  experienceYears?: number | null;

  // Admin profile fields
  orgEmail?: string | null;
  department?: string | null;

  // Nested payloads
  patient?: Record<string, any>;
  driver?: Record<string, any>;
  admin?: Record<string, any>;
}

export interface IUserFilterRequest {
  searchTerm?: string;
  role?: Role;
  status?: UserStatus;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface IUpdateUserStatusPayload {
  status: UserStatus;
}
