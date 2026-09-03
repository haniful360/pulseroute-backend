import httpStatus from "http-status";
import {
  DriverVerificationStatus,
  DutyStatus,
  EmergencySeverity,
  NotificationType,
  OfferStatus,
  Role,
  TripStatus,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { emitDispatchOffer, emitTripStatus } from "../../lib/socket";
import { IRequestUser } from "../auth/auth.interface";
import { NotificationService } from "../notification/notification.service";
import { PricingService } from "../pricing/pricing.service";
import {
  ICancelTripPayload,
  ICreateTripPayload,
  ITripFilterRequest,
  IUpdateTripStatusPayload,
} from "./trip.interface";

// Calculate great-circle distance between two GPS coordinates using Haversine formula
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Generates human-readable trip reference code (e.g. PR-20260903-ABCD)
function generateTripCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PR-${dateStr}-${randomSuffix}`;
}

const createTripRequest = async (
  authUser: IRequestUser,
  payload: ICreateTripPayload,
) => {
  // 1. Ensure Patient profile exists
  let patient = await prisma.patient.findUnique({
    where: { userId: authUser.userId },
  });

  if (!patient) {
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User account not found");
    }

    patient = await prisma.patient.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        contactNumber: user.phone,
      },
    });
  }

  // 2. Compute distance & fare estimate
  let distanceKm = 5.0; // Default fallback distance for emergency runs without fixed destination
  if (
    payload.destinationLatitude !== undefined &&
    payload.destinationLongitude !== undefined
  ) {
    distanceKm = calculateDistanceKm(
      payload.pickupLatitude,
      payload.pickupLongitude,
      payload.destinationLatitude,
      payload.destinationLongitude,
    );
    if (distanceKm <= 0) distanceKm = 1.0;
  }

  const estimatedDurationMins = Math.max(Math.ceil(distanceKm * 2.5), 10);
  const fareEstimate = await PricingService.calculateFareEstimate({
    ambulanceType: payload.ambulanceType,
    distanceKm,
    estimatedDurationMins,
    emergencySeverity: payload.emergencySeverity,
  });

  const tripCode = generateTripCode();

  // 3. Create Trip and initial DispatchOffers in an atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        tripCode,
        patientId: patient.id,
        ambulanceType: payload.ambulanceType,
        status: TripStatus.REQUESTED,
        emergencySeverity: payload.emergencySeverity || EmergencySeverity.HIGH,
        pickupAddress: payload.pickupAddress,
        pickupLatitude: payload.pickupLatitude,
        pickupLongitude: payload.pickupLongitude,
        destinationAddress: payload.destinationAddress,
        destinationLatitude: payload.destinationLatitude,
        destinationLongitude: payload.destinationLongitude,
        distanceKm,
        estimatedDurationMins,
        estimatedFare: fareEstimate.finalEstimatedFare,
        patientNotes: payload.patientNotes,
      },
    });

    // Initial status audit log
    await tx.tripStatusLog.create({
      data: {
        tripId: trip.id,
        status: TripStatus.REQUESTED,
        latitude: payload.pickupLatitude,
        longitude: payload.pickupLongitude,
        notes: "Emergency ambulance trip requested by patient",
        changedById: authUser.userId,
      },
    });

    // 4. Geospatial Dispatch Search
    // Find eligible online drivers matching required ambulance type
    const onlineDrivers = await tx.driver.findMany({
      where: {
        dutyStatus: DutyStatus.ONLINE,
        verificationStatus: DriverVerificationStatus.APPROVED,
        isDeleted: false,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        currentVehicle: {
          is: {
            verificationStatus: VehicleVerificationStatus.APPROVED,
            ambulanceType: payload.ambulanceType,
            isActive: true,
          },
        },
      },
      include: {
        currentVehicle: true,
      },
    });

    // Compute distance to pickup for each driver and filter within 20km radius
    const eligibleDrivers = onlineDrivers
      .map((driver) => {
        const distanceToPickup = calculateDistanceKm(
          driver.currentLatitude!,
          driver.currentLongitude!,
          payload.pickupLatitude,
          payload.pickupLongitude,
        );
        return {
          driver,
          distanceToPickupKm: distanceToPickup,
          estimatedArrivalMins: Math.max(Math.ceil(distanceToPickup * 2.5), 3),
        };
      })
      .filter((d) => d.distanceToPickupKm <= 25.0) // 25 km max emergency dispatch radius
      .sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm)
      .slice(0, 5); // Take top 5 closest ambulances

    // Create DispatchOffers with 90 seconds expiration window
    const expiresAt = new Date(Date.now() + 90 * 1000);
    const offerPromises = eligibleDrivers.map((candidate) =>
      tx.dispatchOffer.create({
        data: {
          tripId: trip.id,
          driverId: candidate.driver.id,
          distanceToPickupKm: candidate.distanceToPickupKm,
          estimatedArrivalMins: candidate.estimatedArrivalMins,
          expiresAt,
          status: OfferStatus.PENDING,
        },
      }),
    );

    await Promise.all(offerPromises);

    return {
      trip,
      fareEstimate,
      dispatchedOffersCount: eligibleDrivers.length,
    };
  });

  // Asynchronously notify candidate drivers
  try {
    const candidateDrivers = await prisma.dispatchOffer.findMany({
      where: { tripId: result.trip.id },
      include: { driver: { select: { userId: true } } },
    });

    for (const item of candidateDrivers) {
      await NotificationService.createNotification({
        userId: item.driver.userId,
        title: "🚨 New Emergency Ambulance Request!",
        message: `Emergency (${result.trip.emergencySeverity}) requested within ${item.distanceToPickupKm} km. 90s to accept!`,
        type: NotificationType.TRIP,
        link: `/trips/${result.trip.id}`,
        metadata: { tripId: result.trip.id, offerId: item.id },
      });

      // Live socket siren/chime alert to driver
      emitDispatchOffer(item.driver.userId, {
        offerId: item.id,
        tripId: result.trip.id,
        emergencySeverity: result.trip.emergencySeverity,
        pickupAddress: result.trip.pickupAddress,
        destinationAddress: result.trip.destinationAddress,
        distanceToPickupKm: item.distanceToPickupKm,
        estimatedArrivalMins: item.estimatedArrivalMins,
        expiresAt: item.expiresAt,
      });
    }
  } catch {
    // Non-blocking notification
  }

  return result;
};

const getMyOffers = async (
  authUser: IRequestUser,
  _filter?: { status?: OfferStatus },
) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  // Find all active, non-expired pending offers for this driver
  const offers = await prisma.dispatchOffer.findMany({
    where: {
      driverId: driver.id,
      status: OfferStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      trip: {
        include: {
          patient: {
            select: {
              name: true,
              contactNumber: true,
              bloodGroup: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return offers;
};

const acceptDispatchOffer = async (authUser: IRequestUser, offerId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
    include: { currentVehicle: true },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  if (driver.dutyStatus !== DutyStatus.ONLINE) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot accept an offer while your duty status is not ONLINE",
    );
  }

  // Atomic transaction to guarantee single driver acceptance
  const acceptedTrip = await prisma.$transaction(async (tx) => {
    const offer = await tx.dispatchOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.driverId !== driver.id) {
      throw new AppError(httpStatus.NOT_FOUND, "Dispatch offer not found");
    }

    if (offer.status !== OfferStatus.PENDING || offer.expiresAt < new Date()) {
      throw new AppError(
        httpStatus.GONE,
        "This dispatch offer has already expired or been responded to.",
      );
    }

    const trip = await tx.trip.findUnique({
      where: { id: offer.tripId },
    });

    if (!trip) {
      throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
    }

    // Optimistic Concurrency Check: has another driver already claimed this trip?
    if (trip.status !== TripStatus.REQUESTED || trip.driverId !== null) {
      await tx.dispatchOffer.update({
        where: { id: offerId },
        data: { status: OfferStatus.EXPIRED, respondedAt: new Date() },
      });
      throw new AppError(
        httpStatus.CONFLICT,
        "Another driver has already accepted this emergency dispatch request.",
      );
    }

    // 1. Assign trip to driver
    const updatedTrip = await tx.trip.update({
      where: { id: trip.id },
      data: {
        driverId: driver.id,
        vehicleId: driver.currentVehicleId,
        status: TripStatus.ACCEPTED,
        acceptedAt: new Date(),
        version: { increment: 1 },
      },
      include: {
        patient: {
          select: {
            name: true,
            contactNumber: true,
            emergencyContactName: true,
            emergencyContactNumber: true,
            bloodGroup: true,
            medicalHistory: true,
          },
        },
        vehicle: true,
      },
    });

    // 2. Set driver duty status to ON_TRIP
    await tx.driver.update({
      where: { id: driver.id },
      data: {
        dutyStatus: DutyStatus.ON_TRIP,
        totalTrips: { increment: 1 },
      },
    });

    // 3. Mark current offer as ACCEPTED
    await tx.dispatchOffer.update({
      where: { id: offerId },
      data: {
        status: OfferStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    // 4. Mark all other competing pending offers for this trip as EXPIRED
    await tx.dispatchOffer.updateMany({
      where: {
        tripId: trip.id,
        id: { not: offerId },
        status: OfferStatus.PENDING,
      },
      data: {
        status: OfferStatus.EXPIRED,
        respondedAt: new Date(),
      },
    });

    // 5. Append Trip Status Log
    await tx.tripStatusLog.create({
      data: {
        tripId: trip.id,
        status: TripStatus.ACCEPTED,
        latitude: driver.currentLatitude,
        longitude: driver.currentLongitude,
        notes: `Trip accepted by driver ${driver.name}`,
        changedById: authUser.userId,
      },
    });

    return updatedTrip;
  });

  // Asynchronously notify patient that ambulance is dispatched
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: acceptedTrip.patientId },
      select: { userId: true },
    });
    if (patient) {
      await NotificationService.createNotification({
        userId: patient.userId,
        title: "🚑 Ambulance Dispatched!",
        message: `Driver ${driver.name} has accepted your trip and is on the way!`,
        type: NotificationType.TRIP,
        link: `/trips/${acceptedTrip.id}`,
        metadata: { tripId: acceptedTrip.id, driverId: driver.id },
      });
    }

    // Emit live status update to anyone watching the trip room
    emitTripStatus(acceptedTrip.id, TripStatus.ACCEPTED, {
      driverId: driver.id,
      driverName: driver.name,
      contactNumber: driver.contactNumber,
      vehicleId: driver.currentVehicleId,
    });
  } catch {
    // Non-blocking notification
  }

  return acceptedTrip;
};

const rejectDispatchOffer = async (authUser: IRequestUser, offerId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const offer = await prisma.dispatchOffer.findFirst({
    where: { id: offerId, driverId: driver.id },
  });

  if (!offer) {
    throw new AppError(httpStatus.NOT_FOUND, "Dispatch offer not found");
  }

  await prisma.dispatchOffer.update({
    where: { id: offerId },
    data: {
      status: OfferStatus.REJECTED,
      respondedAt: new Date(),
    },
  });

  return { message: "Dispatch offer rejected" };
};

const updateTripStatus = async (
  authUser: IRequestUser,
  tripId: string,
  payload: IUpdateTripStatusPayload,
) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: authUser.userId },
  });

  if (!driver || driver.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId: driver.id },
  });

  if (!trip) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Trip not found or does not belong to your account",
    );
  }

  // Strict Sequential State Machine Validation
  const validTransitions: Record<TripStatus, TripStatus> = {
    [TripStatus.ACCEPTED]: TripStatus.EN_ROUTE,
    [TripStatus.EN_ROUTE]: TripStatus.ARRIVED,
    [TripStatus.ARRIVED]: TripStatus.IN_TRANSIT,
    [TripStatus.IN_TRANSIT]: TripStatus.COMPLETED,
    [TripStatus.REQUESTED]: TripStatus.ACCEPTED,
    [TripStatus.COMPLETED]: TripStatus.COMPLETED,
    [TripStatus.CANCELLED]: TripStatus.CANCELLED,
  };

  const expectedNextStatus = validTransitions[trip.status];
  if (payload.status !== expectedNextStatus) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid trip status transition. Current status is '${trip.status}', expected next status is '${expectedNextStatus}', but received '${payload.status}'.`,
    );
  }

  const now = new Date();
  const tripUpdateData: any = {
    status: payload.status,
    version: { increment: 1 },
  };

  if (payload.status === TripStatus.EN_ROUTE) tripUpdateData.enRouteAt = now;
  if (payload.status === TripStatus.ARRIVED) tripUpdateData.arrivedAt = now;
  if (payload.status === TripStatus.IN_TRANSIT)
    tripUpdateData.inTransitAt = now;
  if (payload.status === TripStatus.COMPLETED) tripUpdateData.completedAt = now;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Trip
    const updatedTrip = await tx.trip.update({
      where: { id: trip.id },
      data: tripUpdateData,
      include: {
        patient: true,
        vehicle: true,
      },
    });

    // 2. Append Trip Status Log
    await tx.tripStatusLog.create({
      data: {
        tripId: trip.id,
        status: payload.status,
        latitude: payload.latitude ?? driver.currentLatitude,
        longitude: payload.longitude ?? driver.currentLongitude,
        notes: payload.notes || `Trip status transitioned to ${payload.status}`,
        changedById: authUser.userId,
      },
    });

    // 3. Update driver location if coordinates supplied
    if (payload.latitude && payload.longitude) {
      await tx.driver.update({
        where: { id: driver.id },
        data: {
          currentLatitude: payload.latitude,
          currentLongitude: payload.longitude,
          lastLocationUpdate: now,
        },
      });

      await tx.driverLocationLog.create({
        data: {
          driverId: driver.id,
          tripId: trip.id,
          latitude: payload.latitude,
          longitude: payload.longitude,
        },
      });
    }

    // 4. If COMPLETED, release driver back to ONLINE
    if (payload.status === TripStatus.COMPLETED) {
      await tx.driver.update({
        where: { id: driver.id },
        data: {
          dutyStatus: DutyStatus.ONLINE,
        },
      });
    }

    return updatedTrip;
  });

  // Real-time Socket & Notification dispatch
  try {
    emitTripStatus(result.id, result.status, {
      tripId: result.id,
      driverId: result.driverId,
      status: result.status,
    });

    const patient = await prisma.patient.findUnique({
      where: { id: result.patientId },
      select: { userId: true },
    });

    if (patient) {
      let title = `Trip Update: ${result.status}`;
      let message = `Your emergency trip status is now ${result.status}.`;
      if (result.status === TripStatus.ARRIVED) {
        title = "🚑 Ambulance Arrived!";
        message = `The ambulance has arrived at ${result.pickupAddress}.`;
      } else if (result.status === TripStatus.IN_TRANSIT) {
        title = "🚨 En Route to Hospital";
        message = `Patient onboard. Travelling to ${result.destinationAddress}.`;
      } else if (result.status === TripStatus.COMPLETED) {
        title = "✅ Trip Completed";
        message = `Emergency trip completed safely. Your invoice is now ready for review and payment.`;
      }

      await NotificationService.createNotification({
        userId: patient.userId,
        title,
        message,
        type: NotificationType.TRIP,
        link: `/trips/${result.id}`,
        metadata: { tripId: result.id, status: result.status },
      });
    }
  } catch {
    // Non-blocking notification
  }

  return result;
};

const cancelTrip = async (
  authUser: IRequestUser,
  tripId: string,
  payload: ICancelTripPayload,
) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  if (
    trip.status === TripStatus.COMPLETED ||
    trip.status === TripStatus.CANCELLED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel a trip that is already ${trip.status}.`,
    );
  }

  // Role validation
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient || patient.id !== trip.patientId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to cancel this trip",
      );
    }
    if (trip.status === TripStatus.IN_TRANSIT) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot cancel trip while patient is already in transit. Please coordinate with driver or hospital.",
      );
    }
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver || driver.id !== trip.driverId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to cancel this trip",
      );
    }
  }

  const cancelledTrip = await prisma.$transaction(async (tx) => {
    // 1. Update Trip
    const updated = await tx.trip.update({
      where: { id: trip.id },
      data: {
        status: TripStatus.CANCELLED,
        cancellationReason: payload.cancellationReason,
        cancelledById: authUser.userId,
        cancelledByRole: authUser.role,
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    });

    // 2. If an assigned driver was on trip, release driver back to ONLINE
    if (trip.driverId) {
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { dutyStatus: DutyStatus.ONLINE },
      });
    }

    // 3. Expire any remaining pending dispatch offers
    await tx.dispatchOffer.updateMany({
      where: { tripId: trip.id, status: OfferStatus.PENDING },
      data: { status: OfferStatus.EXPIRED, respondedAt: new Date() },
    });

    // 4. Log cancellation status
    await tx.tripStatusLog.create({
      data: {
        tripId: trip.id,
        status: TripStatus.CANCELLED,
        notes: `Trip cancelled by ${authUser.role}: ${payload.cancellationReason}`,
        changedById: authUser.userId,
      },
    });

    return updated;
  });

  return cancelledTrip;
};

const getMyTrips = async (authUser: IRequestUser) => {
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient) return [];

    return prisma.trip.findMany({
      where: { patientId: patient.id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            contactNumber: true,
            rating: true,
          },
        },
        vehicle: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver) return [];

    return prisma.trip.findMany({
      where: { driverId: driver.id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            contactNumber: true,
            bloodGroup: true,
          },
        },
        vehicle: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return [];
};

const getTripById = async (authUser: IRequestUser, id: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      patient: true,
      driver: {
        include: {
          currentVehicle: true,
        },
      },
      vehicle: true,
      statusLogs: {
        orderBy: { createdAt: "asc" },
      },
      invoice: true,
    },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  // Access validation: User can only see own trip; Driver can only see assigned trip; Admin sees all
  if (authUser.role === Role.USER) {
    const patient = await prisma.patient.findUnique({
      where: { userId: authUser.userId },
    });
    if (!patient || patient.id !== trip.patientId) {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied to this trip");
    }
  } else if (authUser.role === Role.DRIVER) {
    const driver = await prisma.driver.findUnique({
      where: { userId: authUser.userId },
    });
    if (!driver || driver.id !== trip.driverId) {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied to this trip");
    }
  }

  return trip;
};

const getAllTrips = async (filters: ITripFilterRequest) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const sortBy = filters.sortBy || "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const andConditions: any[] = [];

  if (filters.searchTerm) {
    andConditions.push({
      OR: [
        { tripCode: { contains: filters.searchTerm, mode: "insensitive" } },
        {
          pickupAddress: { contains: filters.searchTerm, mode: "insensitive" },
        },
        {
          destinationAddress: {
            contains: filters.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (filters.status) {
    andConditions.push({ status: filters.status });
  }

  if (filters.ambulanceType) {
    andConditions.push({ ambulanceType: filters.ambulanceType });
  }

  if (filters.emergencySeverity) {
    andConditions.push({ emergencySeverity: filters.emergencySeverity });
  }

  const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        patient: { select: { id: true, name: true, contactNumber: true } },
        driver: { select: { id: true, name: true, contactNumber: true } },
        vehicle: true,
      },
    }),
    prisma.trip.count({
      where: whereCondition,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: trips,
  };
};

export const TripService = {
  createTripRequest,
  getMyOffers,
  acceptDispatchOffer,
  rejectDispatchOffer,
  updateTripStatus,
  cancelTrip,
  getMyTrips,
  getTripById,
  getAllTrips,
};
