export const analyticsSchemas = {
  OverviewAnalyticsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Platform overview analytics retrieved successfully",
      },
      data: {
        type: "object",
        properties: {
          users: {
            type: "object",
            properties: {
              totalPatients: { type: "integer", example: 120 },
              totalDrivers: { type: "integer", example: 35 },
              approvedDrivers: { type: "integer", example: 28 },
              pendingDrivers: { type: "integer", example: 7 },
            },
          },
          fleet: {
            type: "object",
            properties: {
              totalAmbulances: { type: "integer", example: 32 },
              approvedAmbulances: { type: "integer", example: 26 },
              onlineAmbulances: { type: "integer", example: 18 },
              onTripAmbulances: { type: "integer", example: 4 },
            },
          },
          trips: {
            type: "object",
            properties: {
              totalTrips: { type: "integer", example: 245 },
              requestedTrips: { type: "integer", example: 2 },
              activeTrips: { type: "integer", example: 6 },
              completedTrips: { type: "integer", example: 225 },
              cancelledTrips: { type: "integer", example: 12 },
            },
          },
          financials: {
            type: "object",
            properties: {
              totalBilledAmount: { type: "number", example: 560000.0 },
              totalPaidAmount: { type: "number", example: 535000.0 },
              totalCommissionEarned: { type: "number", example: 64200.0 },
              totalDriverEarnings: { type: "number", example: 470800.0 },
              totalWithdrawnAmount: { type: "number", example: 320000.0 },
              pendingPayoutRequestsCount: { type: "integer", example: 3 },
            },
          },
          reputation: {
            type: "object",
            properties: {
              averagePlatformRating: { type: "number", example: 4.85 },
              totalReviews: { type: "integer", example: 198 },
            },
          },
          today: {
            type: "object",
            properties: {
              tripsRequestedToday: { type: "integer", example: 14 },
              tripsCompletedToday: { type: "integer", example: 11 },
              revenueToday: { type: "number", example: 28500.0 },
              commissionToday: { type: "number", example: 3420.0 },
            },
          },
          breakdown: {
            type: "object",
            properties: {
              ambulanceTypes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", example: "ICU" },
                    count: { type: "integer", example: 45 },
                  },
                },
              },
              emergencySeverities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string", example: "CRITICAL" },
                    count: { type: "integer", example: 82 },
                  },
                },
              },
            },
          },
          top5: {
            type: "object",
            properties: {
              topRatedDrivers: { type: "array", items: { type: "object" } },
              mostActiveDrivers: { type: "array", items: { type: "object" } },
              highestEarningDrivers: {
                type: "array",
                items: { type: "object" },
              },
              recentTrips: { type: "array", items: { type: "object" } },
              recentPayoutRequests: {
                type: "array",
                items: { type: "object" },
              },
              recentDriverApplications: {
                type: "array",
                items: { type: "object" },
              },
              recentReviews: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
  },
  RecentActivitiesResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Recent platform activities retrieved successfully",
      },
      data: {
        type: "object",
        properties: {
          recentTrips: {
            type: "array",
            items: { type: "object" },
          },
          recentDriverRegistrations: {
            type: "array",
            items: { type: "object" },
          },
          recentPayoutRequests: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
    },
  },
};

export const analyticsPaths = {
  "/api/v1/analytics/overview": {
    get: {
      tags: ["Admin Analytics & Dashboards"],
      summary: "Executive Platform Operational & Financial KPI Overview",
      description:
        "Fetches unified, real-time KPI metrics covering users, fleet readiness, trip statuses, financial billing & commission accounting, and driver rating averages.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Analytics data retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OverviewAnalyticsResponse",
              },
            },
          },
        },
        403: {
          description: "Forbidden - requires SUPER_ADMIN role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/analytics/recent-activities": {
    get: {
      tags: ["Admin Analytics & Dashboards"],
      summary: "Live Activity Feed for System Administrators",
      description:
        "Provides a real-time summary of the latest 5 emergency trips, driver applications, and withdrawal payout requests.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Recent activities retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RecentActivitiesResponse" },
            },
          },
        },
      },
    },
  },
};
