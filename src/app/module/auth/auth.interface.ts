import { AmbulanceType, Gender, Role } from "../../../generated/prisma/enums";

export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  contactNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bloodGroup?: string;
  gender?: Gender;
  dateOfBirth?: string | Date;
  medicalHistory?: string;
}

export interface IRegisterDriverPayload {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
  licenseNumber: string;
  licenseExpiry?: string | Date;
  nidNumber?: string;
  experienceYears?: number;

  // Ambulance / Vehicle information
  vehicleNumber?: string;
  ambulanceType?: AmbulanceType;
  model?: string;
  manufacturer?: string;
  year?: number;
  hasOxygen?: boolean;
  hasVentilator?: boolean;
  hasDefibrillator?: boolean;
  hasSuctionMachine?: boolean;
  equipmentDetails?: string;
}

export interface IVerifyOtpPayload {
  email: string;
  otp: string;
}

export interface IResendOtpPayload {
  email: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IGoogleLoginPayload {
  token?: string;
  idToken?: string;
}

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}