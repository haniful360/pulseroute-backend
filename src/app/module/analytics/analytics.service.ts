import {
  DriverVerificationStatus,
  DutyStatus,
  PaymentStatus,
  PayoutStatus,
  TripStatus,
  VehicleVerificationStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IOverviewAnalytics, IRecentActivities } from "./analytics.interface";

const getOverviewAnalytics = async (): Promise<IOverviewAnalytics> => {
  const [
    totalPatients,
    totalDrivers,
    approvedDrivers,
    pendingDrivers,
    totalAmbulances,
    approvedAmbulances,
    onlineAmbulances,
    onTripAmbulances,
    totalTrips,
    requestedTrips,
    activeTrips,
    completedTrips,
    cancelledTrips,
    billedAgg,
    paidAgg,
    payoutAgg,
    pendingPayoutsCount,
    reviewAgg,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.driver.count({ where: { isDeleted: false } }),
    prisma.driver.count({
      where: {
        verificationStatus: DriverVerificationStatus.APPROVED,
        isDeleted: false,
      },
    }),
    prisma.driver.count({
      where: {
        verificationStatus: DriverVerificationStatus.PENDING,
        isDeleted: false,
      },
    }),
    prisma.vehicle.count({ where: { isDeleted: false } }),
    prisma.vehicle.count({
      where: {
        verificationStatus: VehicleVerificationStatus.APPROVED,
        isDeleted: false,
      },
    }),
    prisma.driver.count({
      where: { dutyStatus: DutyStatus.ONLINE, isDeleted: false },
    }),
    prisma.driver.count({
      where: { dutyStatus: DutyStatus.ON_TRIP, isDeleted: false },
    }),
    prisma.trip.count(),
    prisma.trip.count({ where: { status: TripStatus.REQUESTED } }),
    prisma.trip.count({
      where: {
        status: {
          in: [
            TripStatus.ACCEPTED,
            TripStatus.EN_ROUTE,
            TripStatus.ARRIVED,
            TripStatus.IN_TRANSIT,
          ],
        },
      },
    }),
    prisma.trip.count({ where: { status: TripStatus.COMPLETED } }),
    prisma.trip.count({ where: { status: TripStatus.CANCELLED } }),
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        platformCommission: true,
        driverEarning: true,
      },
    }),
    prisma.payoutRequest.aggregate({
      where: { status: PayoutStatus.APPROVED },
      _sum: { amount: true },
    }),
    prisma.payoutRequest.count({
      where: {
        status: { in: [PayoutStatus.REQUESTED, PayoutStatus.PROCESSING] },
      },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    users: {
      totalPatients,
      totalDrivers,
      approvedDrivers,
      pendingDrivers,
    },
    fleet: {
      totalAmbulances,
      approvedAmbulances,
      onlineAmbulances,
      onTripAmbulances,
    },
    trips: {
      totalTrips,
      requestedTrips,
      activeTrips,
      completedTrips,
      cancelledTrips,
    },
    financials: {
      totalBilledAmount: Number(billedAgg._sum.totalAmount || 0),
      totalPaidAmount: Number(paidAgg._sum.paidAmount || 0),
      totalCommissionEarned: Number(paidAgg._sum.platformCommission || 0),
      totalDriverEarnings: Number(paidAgg._sum.driverEarning || 0),
      totalWithdrawnAmount: Number(payoutAgg._sum.amount || 0),
      pendingPayoutRequestsCount: pendingPayoutsCount,
    },
    reputation: {
      averagePlatformRating: reviewAgg._avg.rating
        ? Number(reviewAgg._avg.rating.toFixed(2))
        : 5.0,
      totalReviews: reviewAgg._count.rating || 0,
    },
  };
};

const getRecentActivities = async (): Promise<IRecentActivities> => {
  const [recentTrips, recentDriverRegistrations, recentPayoutRequests] =
    await Promise.all([
      prisma.trip.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { name: true, contactNumber: true } },
          driver: { select: { name: true, contactNumber: true } },
        },
      }),
      prisma.driver.findMany({
        take: 5,
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          verificationStatus: true,
          createdAt: true,
        },
      }),
      prisma.payoutRequest.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          driver: { select: { name: true, contactNumber: true } },
        },
      }),
    ]);

  return {
    recentTrips,
    recentDriverRegistrations,
    recentPayoutRequests,
  };
};

export const AnalyticsService = {
  getOverviewAnalytics,
  getRecentActivities,
};
