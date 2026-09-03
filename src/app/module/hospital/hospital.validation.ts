import { z } from "zod";

const createHospitalSchema = z.object({
  name: z.string({ message: "Hospital name is required" }).min(2),
  branch: z.string().optional(),
  address: z.string({ message: "Address is required" }).min(5),
  emergencyPhone: z.string({ message: "Emergency phone is required" }).min(5),
  emergencyEmail: z.string().email().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  hasICU: z.boolean().optional(),
  hasNICU: z.boolean().optional(),
  hasTraumaCenter: z.boolean().optional(),
  hasBloodBank: z.boolean().optional(),
  totalBeds: z.number().int().positive().optional(),
  availableBeds: z.number().int().min(0).optional(),
});

const createPreAlertSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  hospitalId: z.string().min(1, "Hospital ID is required"),
  medicalCondition: z.string().optional(),
  allergies: z.string().optional(),
  vitalsSummary: z.string().optional(),
  estimatedArrivalMins: z.number().int().min(1).max(300).optional(),
});

const acknowledgeAlertSchema = z.object({
  assignedBayNumber: z
    .string({ message: "Assigned trauma bay/bed is required" })
    .min(1),
  acknowledgedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const HospitalValidation = {
  createHospitalSchema,
  createPreAlertSchema,
  acknowledgeAlertSchema,
};
