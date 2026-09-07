import {
  AmbulanceType,
  DriverVerificationStatus,
  DutyStatus,
} from "../../../generated/prisma/enums";

export interface IUpdateDriverProfilePayload {
  name?: string;
  phone?: string;
  contactNumber?: string;
  avatarUrl?: string;
  licenseNumber?: string;
  licenseExpiry?: string | Date;
  licensePhotoUrl?: string;
  licensePhotos?: string[];
  nidNumber?: string;
  nidPhotoUrl?: string;
  nidPhotos?: string[];
  experienceYears?: number;

  // Vehicle details
  vehicleNumber?: string;
  ambulanceType?: AmbulanceType;
  model?: string;
  manufacturer?: string;
  year?: number;
  vehiclePhotoUrl?: string;
  vehiclePhotos?: string[];
  hasOxygen?: boolean;
  hasVentilator?: boolean;
  hasDefibrillator?: boolean;
  hasSuctionMachine?: boolean;
  equipmentDetails?: string;
}

export interface IUpdateDutyStatusPayload {
  dutyStatus: DutyStatus;
}

export interface IUpdateLocationPayload {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  vehicleId?: string;
}

export interface IVerifyDriverPayload {
  status: DriverVerificationStatus;
  reason?: string;
}

export interface IDriverFilterRequest {
  searchTerm?: string;
  verificationStatus?: DriverVerificationStatus;
  dutyStatus?: DutyStatus;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
