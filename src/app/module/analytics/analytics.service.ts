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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

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
    tripsRequestedToday,
    tripsCompletedToday,
    todayFinancials,
    billedAgg,
    paidAgg,
    payoutAgg,
    pendingPayoutsCount,
    reviewAgg,
    ambulanceTypeGroups,
    severityGroups,
    topRatedDrivers,
    mostActiveDrivers,
    highestEarningDrivers,
    recentTrips,
    recentPayoutRequests,
    recentDriverApplications,
    recentReviews,
  ] = await Promise.all([
    // User counts
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

    // Fleet readiness
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

    // Trip statuses
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

    // Today's operational stats
    prisma.trip.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.trip.count({
      where: {
        status: TripStatus.COMPLETED,
        completedAt: { gte: startOfToday },
      },
    }),
    prisma.invoice.aggregate({
      where: {
        paymentStatus: PaymentStatus.PAID,
        paidAt: { gte: startOfToday },
      },
      _sum: {
        paidAmount: true,
        platformCommission: true,
      },
    }),

    // Overall Financials
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

    // Platform rating
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),

    // Categorical breakdowns
    prisma.trip.groupBy({
      by: ["ambulanceType"],
      _count: { id: true },
    }),
    prisma.trip.groupBy({
      by: ["emergencySeverity"],
      _count: { id: true },
    }),

    // Top 5 Highest Rated Drivers
    prisma.driver.findMany({
      where: {
        isDeleted: false,
        verificationStatus: DriverVerificationStatus.APPROVED,
      },
      take: 5,
      orderBy: [{ rating: "desc" }, { totalTrips: "desc" }],
      select: {
        id: true,
        name: true,
        contactNumber: true,
        rating: true,
        totalTrips: true,
        dutyStatus: true,
        currentVehicle: {
          select: {
            ambulanceType: true,
            registrationNumber: true,
            model: true,
          },
        },
      },
    }),

    // Top 5 Most Active Drivers
    prisma.driver.findMany({
      where: {
        isDeleted: false,
        verificationStatus: DriverVerificationStatus.APPROVED,
      },
      take: 5,
      orderBy: { totalTrips: "desc" },
      select: {
        id: true,
        name: true,
        contactNumber: true,
        rating: true,
        totalTrips: true,
        dutyStatus: true,
        currentVehicle: {
          select: {
            ambulanceType: true,
            registrationNumber: true,
          },
        },
      },
    }),

    // Top 5 Highest Earning Drivers
    prisma.driverWallet.findMany({
      take: 5,
      orderBy: { totalEarnings: "desc" },
      select: {
        id: true,
        balance: true,
        totalEarnings: true,
        totalWithdrawn: true,
        driver: {
          select: {
            id: true,
            name: true,
            contactNumber: true,
            rating: true,
            totalTrips: true,
          },
        },
      },
    }),

    // Top 5 Recent Emergency Trips
    prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { id: true, name: true, contactNumber: true } },
        driver: { select: { id: true, name: true, contactNumber: true } },
        vehicle: {
          select: { ambulanceType: true, registrationNumber: true },
        },
      },
    }),

    // Top 5 Recent Payout Requests
    prisma.payoutRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true, contactNumber: true } },
      },
    }),

    // Top 5 Recent Driver Applications
    prisma.driver.findMany({
      take: 5,
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        licenseNumber: true,
        verificationStatus: true,
        createdAt: true,
      },
    }),

    // Top 5 Recent Patient Reviews
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { name: true } },
        driver: { select: { name: true } },
        trip: { select: { tripCode: true } },
      },
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
    today: {
      tripsRequestedToday,
      tripsCompletedToday,
      revenueToday: Number(todayFinancials._sum.paidAmount || 0),
      commissionToday: Number(todayFinancials._sum.platformCommission || 0),
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
    breakdown: {
      ambulanceTypes: ambulanceTypeGroups.map((g) => ({
        type: g.ambulanceType,
        count: g._count.id,
      })),
      emergencySeverities: severityGroups.map((g) => ({
        severity: g.emergencySeverity,
        count: g._count.id,
      })),
    },
    top5: {
      topRatedDrivers,
      mostActiveDrivers,
      highestEarningDrivers,
      recentTrips,
      recentPayoutRequests,
      recentDriverApplications,
      recentReviews,
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
