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
}

export interface IRecentActivities {
  recentTrips: any[];
  recentDriverRegistrations: any[];
  recentPayoutRequests: any[];
}
