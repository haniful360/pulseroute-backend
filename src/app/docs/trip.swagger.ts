export const tripSchemas = {
  CreateTripRequest: {
    type: "object",
    required: [
      "ambulanceType",
      "pickupAddress",
      "pickupLatitude",
      "pickupLongitude",
    ],
    properties: {
      ambulanceType: {
        type: "string",
        enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
        example: "ICU",
      },
      emergencySeverity: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MODERATE", "LOW"],
        example: "CRITICAL",
      },
      pickupAddress: {
        type: "string",
        example: "House 12, Road 5, Dhanmondi, Dhaka",
      },
      pickupLatitude: {
        type: "number",
        example: 23.7465,
      },
      pickupLongitude: {
        type: "number",
        example: 90.3752,
      },
      destinationAddress: {
        type: "string",
        example: "Square Hospital Emergency Dept, Panthapath, Dhaka",
      },
      destinationLatitude: {
        type: "number",
        example: 23.7533,
      },
      destinationLongitude: {
        type: "number",
        example: 90.3868,
      },
      patientNotes: {
        type: "string",
        example:
          "Patient experiencing severe chest pain, oxygen support required",
      },
    },
  },
  UpdateTripStatusRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["EN_ROUTE", "ARRIVED", "IN_TRANSIT", "COMPLETED"],
        example: "EN_ROUTE",
        description:
          "Must follow sequential progression: ACCEPTED -> EN_ROUTE -> ARRIVED -> IN_TRANSIT -> COMPLETED",
      },
      latitude: {
        type: "number",
        example: 23.748,
      },
      longitude: {
        type: "number",
        example: 90.378,
      },
      notes: {
        type: "string",
        example: "Ambulance arrived at patient's residence",
      },
    },
  },
  CancelTripRequest: {
    type: "object",
    required: ["cancellationReason"],
    properties: {
      cancellationReason: {
        type: "string",
        example: "Patient was transported by private vehicle instead",
      },
    },
  },
  TripResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Trip operation completed" },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          tripCode: { type: "string", example: "PR-20260903-7B8A" },
          status: { type: "string", example: "ACCEPTED" },
          ambulanceType: { type: "string", example: "ICU" },
          emergencySeverity: { type: "string", example: "CRITICAL" },
          pickupAddress: { type: "string" },
          destinationAddress: { type: "string" },
          distanceKm: { type: "number", example: 6.2 },
          estimatedFare: { type: "string", example: "3200.00" },
          driver: { type: "object", nullable: true },
          vehicle: { type: "object", nullable: true },
        },
      },
    },
  },
  DispatchOfferResponse: {
    type: "object",
    properties: {
      id: { type: "string" },
      tripId: { type: "string" },
      status: { type: "string", example: "PENDING" },
      distanceToPickupKm: { type: "number", example: 2.8 },
      estimatedArrivalMins: { type: "integer", example: 7 },
      expiresAt: { type: "string", format: "date-time" },
      trip: {
        type: "object",
        properties: {
          tripCode: { type: "string" },
          ambulanceType: { type: "string" },
          emergencySeverity: { type: "string" },
          pickupAddress: { type: "string" },
          estimatedFare: { type: "string" },
        },
      },
    },
  },
  PaginatedTripsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Trips retrieved successfully" },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 34 },
          totalPages: { type: "integer", example: 4 },
        },
      },
      data: {
        type: "array",
        items: { type: "object" },
      },
    },
  },
};

export const tripPaths = {
  "/api/v1/trips": {
    post: {
      tags: ["Emergency Dispatch & Trips"],
      summary: "Request Emergency Ambulance (Patient)",
      description:
        "Initiates an emergency trip request. Computes dynamic fare estimate and executes geospatial dispatching to send time-limited offers to nearby online ambulances.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateTripRequest" },
          },
        },
      },
      responses: {
        201: {
          description:
            "Trip created and dispatch offers broadcast to nearby drivers",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripResponse" },
            },
          },
        },
      },
    },
    get: {
      tags: ["Emergency Dispatch & Trips (Admin)"],
      summary: "List All Platform Trips (Admin Only)",
      description:
        "Retrieves a paginated list of all trips with search, status filters, and ambulance type filters.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        { name: "searchTerm", in: "query", schema: { type: "string" } },
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "REQUESTED",
              "ACCEPTED",
              "EN_ROUTE",
              "ARRIVED",
              "IN_TRANSIT",
              "COMPLETED",
              "CANCELLED",
            ],
          },
        },
        {
          name: "ambulanceType",
          in: "query",
          schema: {
            type: "string",
            enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
          },
        },
      ],
      responses: {
        200: {
          description: "Trips retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedTripsResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/offers/my-offers": {
    get: {
      tags: ["Driver Dispatch Offers"],
      summary: "Get Active Dispatch Offers (Driver Only)",
      description:
        "Fetches non-expired pending emergency dispatch offers broadcast to the authenticated driver.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Active offers retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  statusCode: { type: "integer", example: 200 },
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/DispatchOfferResponse",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/offers/{offerId}/accept": {
    patch: {
      tags: ["Driver Dispatch Offers"],
      summary: "Accept Dispatch Offer (Driver Only)",
      description:
        "Claims the trip atomically. Uses database transactions to ensure single-driver allocation and automatically expires competing offers.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "offerId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Offer accepted; trip is now in ACCEPTED status",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripResponse" },
            },
          },
        },
        409: {
          description: "Trip already claimed by another driver",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        410: {
          description: "Offer expired",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/offers/{offerId}/reject": {
    patch: {
      tags: ["Driver Dispatch Offers"],
      summary: "Reject Dispatch Offer (Driver Only)",
      description: "Rejects an emergency dispatch offer.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "offerId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Offer rejected successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/my-trips": {
    get: {
      tags: ["Emergency Dispatch & Trips"],
      summary: "Get My Trip History (Patient or Driver)",
      description:
        "Returns all past and active trips for the authenticated patient or driver.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Trips retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TripResponse" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/{id}": {
    get: {
      tags: ["Emergency Dispatch & Trips"],
      summary: "Get Trip Details by ID",
      description:
        "Fetches complete trip information including patient, assigned driver, vehicle, status transition logs, and invoice details.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Trip details retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripResponse" },
            },
          },
        },
        404: {
          description: "Trip not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/{id}/status": {
    patch: {
      tags: ["Emergency Dispatch & Trips"],
      summary: "Progress Trip Lifecycle Status (Driver Only)",
      description:
        "Sequentially transitions trip status: ACCEPTED -> EN_ROUTE -> ARRIVED -> IN_TRANSIT -> COMPLETED. Records status audit logs and frees driver upon completion.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateTripStatusRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Trip status updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TripResponse" },
            },
          },
        },
        400: {
          description: "Invalid status progression step",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/trips/{id}/cancel": {
    patch: {
      tags: ["Emergency Dispatch & Trips"],
      summary: "Cancel Trip (Patient or Driver or Admin)",
      description:
        "Cancels an active trip request with a mandatory reason. Frees the assigned driver back to ONLINE.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CancelTripRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Trip cancelled successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
      },
    },
  },
};
