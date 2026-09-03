import cron from "node-cron";
import {
  DutyStatus,
  NotificationType,
  OfferStatus,
  PaymentStatus,
  TripStatus,
} from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { emitTripStatus } from "../lib/socket";
import { NotificationService } from "../module/notification/notification.service";

// 1. Expire stale 90s dispatch offers (runs every 30 seconds)
const expireDispatchOffers = async () => {
  try {
    const expired = await prisma.dispatchOffer.updateMany({
      where: {
        status: OfferStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: OfferStatus.EXPIRED,
        respondedAt: new Date(),
      },
    });

    if (expired.count > 0) {
      console.log(`[CRON] Expired ${expired.count} stale dispatch offers.`);
    }
  } catch (error) {
    console.error("[CRON] Error expiring dispatch offers:", error);
  }
};

// 2. Escalate unfulfilled emergency trips older than 5 minutes (runs every minute)
const escalateStaleTrips = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const staleTrips = await prisma.trip.findMany({
      where: {
        status: TripStatus.REQUESTED,
        requestedAt: { lt: fiveMinutesAgo },
      },
      include: {
        patient: { select: { userId: true } },
      },
    });

    for (const trip of staleTrips) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: {
          status: TripStatus.CANCELLED,
          cancellationReason: "SYSTEM_EXPIRED_NO_AVAILABLE_DRIVER",
          cancelledAt: new Date(),
        },
      });

      // Real-time Socket broadcast
      try {
        emitTripStatus(trip.id, TripStatus.CANCELLED, {
          reason: "No available driver responded within 5 minutes.",
        });
      } catch {
        // Non-blocking socket error
      }

      // High-priority emergency guidance notification to patient
      if (trip.patient) {
        await NotificationService.createNotification({
          userId: trip.patient.userId,
          title: "🚨 No Ambulance Found - Dial 999 Immediately",
          message:
            "No nearby ambulance was able to accept your emergency request within 5 minutes. Please dial 999 directly for public emergency dispatch.",
          type: NotificationType.TRIP,
          link: `/trips/${trip.id}`,
          metadata: { tripId: trip.id, autoEscalated: true },
        });
      }
    }

    if (staleTrips.length > 0) {
      console.log(
        `[CRON] Auto-escalated and closed ${staleTrips.length} unfulfilled emergency trips.`,
      );
    }
  } catch (error) {
    console.error("[CRON] Error escalating stale emergency trips:", error);
  }
};

// 3. Auto-offline inactive "ghost" drivers with no heartbeat in 30 mins (runs every 10 minutes)
const cleanupGhostDrivers = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await prisma.driver.updateMany({
      where: {
        dutyStatus: DutyStatus.ONLINE,
        updatedAt: { lt: thirtyMinutesAgo },
      },
      data: {
        dutyStatus: DutyStatus.OFFLINE,
      },
    });

    if (result.count > 0) {
      console.log(
        `[CRON] Switched ${result.count} inactive ghost drivers to OFFLINE.`,
      );
    }
  } catch (error) {
    console.error("[CRON] Error cleaning up inactive drivers:", error);
  }
};

// 4. Nightly Platform Revenue & Performance Audit (runs daily at 00:00)
const runMidnightAudit = async () => {
  try {
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date();
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);

    const [completedTrips, financials] = await Promise.all([
      prisma.trip.count({
        where: {
          status: TripStatus.COMPLETED,
          completedAt: { gte: startOfYesterday, lte: endOfYesterday },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: { gte: startOfYesterday, lte: endOfYesterday },
        },
        _sum: {
          paidAmount: true,
          platformCommission: true,
          driverEarning: true,
        },
      }),
    ]);

    const dateStr = startOfYesterday.toISOString().split("T")[0];
    console.log(
      `[CRON AUDIT] Date: ${dateStr} | Completed Trips: ${completedTrips} | Revenue: ${financials._sum.paidAmount || 0} BDT | Platform Commission: ${financials._sum.platformCommission || 0} BDT`,
    );
  } catch (error) {
    console.error("[CRON] Error running nightly audit:", error);
  }
};

// Master Initializer
export const initCronJobs = () => {
  // 1. Every 30 seconds: Dispatch offer expiration
  cron.schedule("*/30 * * * * *", expireDispatchOffers);

  // 2. Every 1 minute: Stale emergency trip escalation
  cron.schedule("* * * * *", escalateStaleTrips);

  // 3. Every 10 minutes: Ghost driver offline cleanup
  cron.schedule("*/10 * * * *", cleanupGhostDrivers);

  // 4. Every Midnight (00:00): Daily revenue & operations audit
  cron.schedule("0 0 * * *", runMidnightAudit);

  console.log("Automated Background Cron Engine initialized (4 jobs active).");
};
