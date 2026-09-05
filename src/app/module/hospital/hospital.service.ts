import crypto from "crypto";
import httpStatus from "http-status";
import {
  AlertStatus,
  NotificationType,
  Role,
} from "../../../generated/prisma/enums";
import config from "../../config";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { getIO } from "../../lib/socket";
import { IRequestUser } from "../auth/auth.interface";
import { NotificationService } from "../notification/notification.service";
import {
  IAcknowledgeAlertPayload,
  ICreateHospitalPayload,
  ICreatePreAlertPayload,
  IHospitalFilterRequest,
} from "./hospital.interface";

// 1. Register Hospital into Directory (Admin)
const createHospital = async (payload: ICreateHospitalPayload) => {
  return await prisma.hospital.create({
    data: {
      name: payload.name,
      branch: payload.branch || null,
      address: payload.address,
      emergencyPhone: payload.emergencyPhone,
      emergencyEmail: payload.emergencyEmail || null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      hasICU: payload.hasICU ?? true,
      hasNICU: payload.hasNICU ?? false,
      hasTraumaCenter: payload.hasTraumaCenter ?? true,
      hasBloodBank: payload.hasBloodBank ?? true,
      totalBeds: payload.totalBeds ?? 50,
      availableBeds: payload.availableBeds ?? 10,
    },
  });
};

// 2. Search & List Hospitals (Public / User)
const getAllHospitals = async (filters: IHospitalFilterRequest) => {
  const { searchTerm, hasICU, hasTraumaCenter, hasBloodBank } = filters;
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const skip = (page - 1) * limit;

  const whereConditions: any = { isActive: true };

  if (searchTerm) {
    whereConditions.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { branch: { contains: searchTerm, mode: "insensitive" } },
      { address: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (hasICU !== undefined) whereConditions.hasICU = hasICU;
  if (hasTraumaCenter !== undefined)
    whereConditions.hasTraumaCenter = hasTraumaCenter;
  if (hasBloodBank !== undefined) whereConditions.hasBloodBank = hasBloodBank;

  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.hospital.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: hospitals,
  };
};

const getHospitalById = async (id: string) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
  });

  if (!hospital) {
    throw new AppError(httpStatus.NOT_FOUND, "Hospital not found");
  }

  return hospital;
};

// 3. Dispatch Hospital Emergency Pre-Alert (Driver / Patient / Admin)
const sendPreAlert = async (
  authUser: IRequestUser,
  payload: ICreatePreAlertPayload,
) => {
  const [trip, hospital] = await Promise.all([
    prisma.trip.findUnique({
      where: { id: payload.tripId },
      include: {
        patient: true,
        driver: true,
        vehicle: true,
      },
    }),
    prisma.hospital.findUnique({
      where: { id: payload.hospitalId },
    }),
  ]);

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  if (!hospital) {
    throw new AppError(httpStatus.NOT_FOUND, "Destination hospital not found");
  }

  const isPatient = trip.patient.userId === authUser.userId;
  const isDriver = trip.driver?.userId === authUser.userId;
  const isAdmin = authUser.role === Role.SUPER_ADMIN;

  if (!isPatient && !isDriver && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to dispatch pre-alerts for this trip",
    );
  }

  // Generate unique secure tracking token for one-click doctor view
  const trackingToken = crypto.randomBytes(16).toString("hex");

  const preAlert = await prisma.hospitalPreAlert.create({
    data: {
      tripId: trip.id,
      hospitalId: hospital.id,
      trackingToken,
      patientName: trip.patient.name,
      patientGender: trip.patient.gender || undefined,
      bloodGroup: trip.patient.bloodGroup || undefined,
      medicalCondition:
        payload.medicalCondition ||
        `Emergency (${trip.emergencySeverity}) ambulance in transit`,
      allergies: payload.allergies || undefined,
      vitalsSummary: payload.vitalsSummary || undefined,
      estimatedArrivalMins:
        payload.estimatedArrivalMins ||
        (trip.estimatedDurationMins
          ? Math.round(trip.estimatedDurationMins)
          : 10),
      status: AlertStatus.ALERTED,
    },
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          branch: true,
          emergencyPhone: true,
        },
      },
    },
  });

  const liveTrackingUrl = `${config.frontend_url || "http://localhost:3000"}/er/track/${trackingToken}`;

  // 1. Real-time Socket push to Hospital's ER Screen (triggers trauma siren)
  try {
    getIO()?.to(`hospital:${hospital.id}`).emit("hospital:incoming-alert", {
      preAlertId: preAlert.id,
      trackingToken: preAlert.trackingToken,
      hospitalName: hospital.name,
      patientName: trip.patient.name,
      bloodGroup: trip.patient.bloodGroup,
      medicalCondition: preAlert.medicalCondition,
      vitalsSummary: preAlert.vitalsSummary,
      estimatedArrivalMins: preAlert.estimatedArrivalMins,
      ambulanceType: trip.ambulanceType,
      vehicleNumber: trip.vehicle?.vehicleNumber,
      driverName: trip.driver?.name,
      driverContact: trip.driver?.contactNumber,
      liveTrackingUrl,
      createdAt: preAlert.createdAt,
    });
  } catch {
    // Non-blocking socket emission
  }

  // 2. In-App Notification to Patient
  try {
    await NotificationService.createNotification({
      userId: trip.patient.userId,
      title: `🏥 ER Pre-Alert Sent: ${hospital.name}`,
      message: `${hospital.name} Emergency Room has been alerted with your patient vitals. ER trauma team is standing by!`,
      type: NotificationType.TRIP,
      link: `/trips/${trip.id}`,
      metadata: {
        tripId: trip.id,
        hospitalId: hospital.id,
        preAlertId: preAlert.id,
      },
    });
  } catch {
    // Non-blocking notification
  }

  return {
    ...preAlert,
    liveTrackingUrl,
    smsDispatchedTo: hospital.emergencyPhone,
    message: `Hospital Pre-Alert dispatched to ${hospital.name} successfully.`,
  };
};

// 4. Public Live ER Tracking Dashboard (Zero-Auth for on-duty doctors)
const getPublicAlertByToken = async (token: string) => {
  const preAlert = await prisma.hospitalPreAlert.findUnique({
    where: { trackingToken: token },
    include: {
      hospital: true,
      trip: {
        include: {
          patient: {
            select: {
              name: true,
              gender: true,
              bloodGroup: true,
              contactNumber: true,
              emergencyContactName: true,
              emergencyContactNumber: true,
              medicalHistory: true,
            },
          },
          driver: {
            select: {
              name: true,
              contactNumber: true,
              currentLatitude: true,
              currentLongitude: true,
            },
          },
          vehicle: {
            select: {
              vehicleNumber: true,
              ambulanceType: true,
              hasOxygen: true,
              hasVentilator: true,
              hasDefibrillator: true,
            },
          },
        },
      },
    },
  });

  if (!preAlert) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Hospital pre-alert not found or invalid token",
    );
  }

  return preAlert;
};

// 5. Hospital Acknowledges & Prepares Trauma Bay (Doctor confirmation)
const acknowledgeAlert = async (
  idOrToken: string,
  payload: IAcknowledgeAlertPayload,
) => {
  const existingAlert = await prisma.hospitalPreAlert.findFirst({
    where: {
      OR: [{ id: idOrToken }, { trackingToken: idOrToken }],
    },
    include: {
      hospital: { select: { name: true } },
      trip: { select: { id: true, driverId: true, patientId: true } },
    },
  });

  if (!existingAlert) {
    throw new AppError(httpStatus.NOT_FOUND, "Pre-alert record not found");
  }

  const updatedAlert = await prisma.hospitalPreAlert.update({
    where: { id: existingAlert.id },
    data: {
      status: AlertStatus.ACKNOWLEDGED,
      assignedBayNumber: payload.assignedBayNumber,
      acknowledgedBy: payload.acknowledgedBy || "On-Duty ER Staff",
      acknowledgedAt: new Date(),
      notes: payload.notes || null,
    },
  });

  // Real-time broadcast to the ambulance trip room (Driver & Patient)
  try {
    getIO()
      ?.to(`trip:${existingAlert.tripId}`)
      .emit("hospital:bay-ready", {
        preAlertId: existingAlert.id,
        hospitalName: existingAlert.hospital.name,
        assignedBayNumber: payload.assignedBayNumber,
        acknowledgedBy: updatedAlert.acknowledgedBy,
        notes: payload.notes,
        message: `${existingAlert.hospital.name} ER has prepared ${payload.assignedBayNumber}! Proceed directly to the trauma entrance.`,
      });
  } catch {
    // Non-blocking socket emission
  }

  return updatedAlert;
};

// 6. Hospital Active Alerts (For ER monitoring screens)
const getHospitalActiveAlerts = async (hospitalId: string) => {
  const alerts = await prisma.hospitalPreAlert.findMany({
    where: {
      hospitalId,
      status: {
        in: [
          AlertStatus.ALERTED,
          AlertStatus.ACKNOWLEDGED,
          AlertStatus.PREPARING_BAY,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      trip: {
        select: {
          id: true,
          status: true,
          ambulanceType: true,
          pickupAddress: true,
          destinationAddress: true,
          driver: { select: { name: true, contactNumber: true } },
          vehicle: { select: { vehicleNumber: true } },
        },
      },
    },
  });

  return alerts;
};

export const HospitalService = {
  createHospital,
  getAllHospitals,
  getHospitalById,
  sendPreAlert,
  getPublicAlertByToken,
  acknowledgeAlert,
  getHospitalActiveAlerts,
};
