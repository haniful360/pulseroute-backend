import {
  AmbulanceType,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";

export interface ICreateVehiclePayload {
  ambulanceType: AmbulanceType;
  vehicleNumber: string;
  model?: string;
  manufacturer?: string;
  year?: number;
  hasOxygen?: boolean;
  hasVentilator?: boolean;
  hasDefibrillator?: boolean;
  hasSuctionMachine?: boolean;
  equipmentDetails?: string;
}

export interface IUpdateVehiclePayload {
  model?: string;
  manufacturer?: string;
  year?: number;
  hasOxygen?: boolean;
  hasVentilator?: boolean;
  hasDefibrillator?: boolean;
  hasSuctionMachine?: boolean;
  equipmentDetails?: string;
  isActive?: boolean;
}

export interface IVerifyVehiclePayload {
  status: VehicleVerificationStatus;
  reason?: string;
}

export interface IVehicleFilterRequest {
  searchTerm?: string;
  ambulanceType?: AmbulanceType;
  verificationStatus?: VehicleVerificationStatus;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
