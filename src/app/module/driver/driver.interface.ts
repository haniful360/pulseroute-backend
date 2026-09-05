import {
  DriverVerificationStatus,
  DutyStatus,
} from "../../../generated/prisma/enums";

export interface IUpdateDutyStatusPayload {
  dutyStatus: DutyStatus;
}

export interface IUpdateLocationPayload {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export interface ISetActiveVehiclePayload {
  vehicleId: string;
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
