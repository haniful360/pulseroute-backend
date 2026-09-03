export interface IOverviewAnalytics {
  users: {
    totalPatients: number;
    totalDrivers: number;
    approvedDrivers: number;
    pendingDrivers: number;
  };
  fleet: {
    totalAmbulances: number;
    approvedAmbulances: number;
    onlineAmbulances: number;
    onTripAmbulances: number;
  };
  trips: {
    totalTrips: number;
    requestedTrips: number;
    activeTrips: number;
    completedTrips: number;
    cancelledTrips: number;
  };
  today: {
    tripsRequestedToday: number;
    tripsCompletedToday: number;
    revenueToday: number;
    commissionToday: number;
  };
  financials: {
    totalBilledAmount: number;
    totalPaidAmount: number;
    totalCommissionEarned: number;
    totalDriverEarnings: number;
    totalWithdrawnAmount: number;
    pendingPayoutRequestsCount: number;
  };
  reputation: {
    averagePlatformRating: number;
    totalReviews: number;
  };
  breakdown: {
    ambulanceTypes: Array<{ type: string; count: number }>;
    emergencySeverities: Array<{ severity: string; count: number }>;
  };
  top5: {
    topRatedDrivers: any[];
    mostActiveDrivers: any[];
    highestEarningDrivers: any[];
    recentTrips: any[];
    recentPayoutRequests: any[];
    recentDriverApplications: any[];
    recentReviews: any[];
  };
}

export interface IRecentActivities {
  recentTrips: any[];
  recentDriverRegistrations: any[];
  recentPayoutRequests: any[];
}
