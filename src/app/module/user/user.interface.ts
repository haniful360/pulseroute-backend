import { Gender, Role, UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateProfilePayload {
  // Common user fields
  name?: string;
  phone?: string;
  avatarUrl?: string;

  // Patient profile fields
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bloodGroup?: string;
  gender?: Gender;
  dateOfBirth?: string | Date;
  medicalHistory?: string;
  profilePhoto?: string;

  // Driver profile fields
  contactNumber?: string;
  nidNumber?: string;
  experienceYears?: number;

  // Admin profile fields
  orgEmail?: string;
  department?: string;
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
