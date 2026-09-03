import {
  AmbulanceType,
  EmergencySeverity,
  OfferStatus,
  TripStatus,
} from "../../../generated/prisma/enums";

export interface ICreateTripPayload {
  ambulanceType: AmbulanceType;
  emergencySeverity?: EmergencySeverity;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  patientNotes?: string;
}

export interface IUpdateTripStatusPayload {
  status: TripStatus;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ICancelTripPayload {
  cancellationReason: string;
}

export interface ITripFilterRequest {
  searchTerm?: string;
  status?: TripStatus;
  ambulanceType?: AmbulanceType;
  emergencySeverity?: EmergencySeverity;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface IDispatchOfferFilterRequest {
  status?: OfferStatus;
}
