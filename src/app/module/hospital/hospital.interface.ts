export interface ICreateHospitalPayload {
  name: string;
  branch?: string;
  address: string;
  emergencyPhone: string;
  emergencyEmail?: string;
  latitude: number;
  longitude: number;
  hasICU?: boolean;
  hasNICU?: boolean;
  hasTraumaCenter?: boolean;
  hasBloodBank?: boolean;
  totalBeds?: number;
  availableBeds?: number;
}

export interface IHospitalFilterRequest {
  searchTerm?: string;
  hasICU?: boolean;
  hasTraumaCenter?: boolean;
  hasBloodBank?: boolean;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  page?: number;
  limit?: number;
}

export interface ICreatePreAlertPayload {
  tripId: string;
  hospitalId: string;
  medicalCondition?: string;
  allergies?: string;
  vitalsSummary?: string;
  estimatedArrivalMins?: number;
}

export interface IAcknowledgeAlertPayload {
  assignedBayNumber: string;
  acknowledgedBy?: string;
  notes?: string;
}
