export const driverSchemas = {
  UpdateDriverProfileRequest: {
    type: "object",
    properties: {
      name: { type: "string", example: "Kamal Hossain" },
      phone: { type: "string", example: "+8801811223344" },
      avatarUrl: {
        type: "string",
        example: "https://res.cloudinary.com/demo/image/upload/avatar.jpg",
      },
      licenseNumber: { type: "string", example: "DL-DHAKA-2024-9988" },
      licenseExpiry: {
        type: "string",
        format: "date",
        example: "2028-12-31",
      },
      licensePhotoUrl: {
        type: "string",
        example: "https://res.cloudinary.com/demo/image/upload/license.jpg",
      },
      licensePhotos: {
        type: "array",
        items: { type: "string" },
        example: [
          "https://res.cloudinary.com/demo/image/upload/license_front.jpg",
          "https://res.cloudinary.com/demo/image/upload/license_back.jpg",
        ],
      },
      nidNumber: { type: "string", example: "19901234567890123" },
      nidPhotoUrl: {
        type: "string",
        example: "https://res.cloudinary.com/demo/image/upload/nid.jpg",
      },
      nidPhotos: {
        type: "array",
        items: { type: "string" },
        example: [
          "https://res.cloudinary.com/demo/image/upload/nid_front.jpg",
          "https://res.cloudinary.com/demo/image/upload/nid_back.jpg",
        ],
      },
      experienceYears: { type: "integer", example: 6 },
      vehicleNumber: { type: "string", example: "DHAKA-METRO-CHA-11-2233" },
      ambulanceType: {
        type: "string",
        enum: ["AC", "NON_AC", "ICU", "FREEZER", "NEONATAL", "BASIC"],
        example: "ICU",
      },
      model: { type: "string", example: "Toyota HiAce Grandia Ambulance" },
      manufacturer: { type: "string", example: "Toyota" },
      year: { type: "integer", example: 2023 },
      vehiclePhotoUrl: {
        type: "string",
        example: "https://res.cloudinary.com/demo/image/upload/ambulance.jpg",
      },
      vehiclePhotos: {
        type: "array",
        items: { type: "string" },
        example: [
          "https://res.cloudinary.com/demo/image/upload/ambulance_front.jpg",
          "https://res.cloudinary.com/demo/image/upload/ambulance_inside.jpg",
        ],
      },
      hasOxygen: { type: "boolean", example: true },
      hasVentilator: { type: "boolean", example: true },
      hasDefibrillator: { type: "boolean", example: true },
      hasSuctionMachine: { type: "boolean", example: true },
      equipmentDetails: {
        type: "string",
        example: "Portable ICU ventilator, defibrillator, high-flow oxygen",
      },
    },
  },
  UpdateDutyStatusRequest: {
    type: "object",
    required: ["dutyStatus"],
    properties: {
      dutyStatus: {
        type: "string",
        enum: ["ONLINE", "OFFLINE", "BUSY"],
        example: "ONLINE",
        description:
          "Target duty status. Driver can only go ONLINE if APPROVED and has an APPROVED active ambulance.",
      },
    },
  },
  UpdateLocationRequest: {
    type: "object",
    required: ["latitude", "longitude"],
    properties: {
      latitude: {
        type: "number",
        minimum: -90,
        maximum: 90,
        example: 23.8103,
        description: "Current GPS latitude",
      },
      longitude: {
        type: "number",
        minimum: -180,
        maximum: 180,
        example: 90.4125,
        description: "Current GPS longitude",
      },
    },
  },
  VerifyDriverRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["APPROVED", "REJECTED", "SUSPENDED", "PENDING"],
        example: "APPROVED",
        description: "Driver verification decision",
      },
      reason: {
        type: "string",
        example: "License copy was verified and background check completed",
        description: "Reason or remarks for verification decision",
      },
    },
  },
  DriverProfileResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Driver profile retrieved successfully",
      },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Kamal Hossain" },
          email: { type: "string", example: "kamal.driver@example.com" },
          contactNumber: { type: "string", example: "+8801811223344" },
          licenseNumber: { type: "string", example: "DL-DHAKA-2024-9988" },
          licensePhotoUrl: {
            type: "string",
            nullable: true,
            example: "https://res.cloudinary.com/demo/image/upload/license.jpg",
          },
          licensePhotos: {
            type: "array",
            items: { type: "string" },
            example: [
              "https://res.cloudinary.com/demo/image/upload/license_front.jpg",
              "https://res.cloudinary.com/demo/image/upload/license_back.jpg",
            ],
          },
          nidPhotoUrl: {
            type: "string",
            nullable: true,
            example: "https://res.cloudinary.com/demo/image/upload/nid.jpg",
          },
          nidPhotos: {
            type: "array",
            items: { type: "string" },
            example: [
              "https://res.cloudinary.com/demo/image/upload/nid_front.jpg",
              "https://res.cloudinary.com/demo/image/upload/nid_back.jpg",
            ],
          },
          experienceYears: { type: "integer", example: 5 },
          verificationStatus: { type: "string", example: "APPROVED" },
          dutyStatus: { type: "string", example: "ONLINE" },
          currentLatitude: { type: "number", example: 23.8103 },
          currentLongitude: { type: "number", example: 90.4125 },
          rating: { type: "number", example: 4.9 },
          totalTrips: { type: "integer", example: 42 },
          currentVehicle: { type: "object", nullable: true },
          wallet: {
            type: "object",
            nullable: true,
            properties: {
              balance: { type: "string", example: "12500.00" },
              totalEarnings: { type: "string", example: "45000.00" },
            },
          },
        },
      },
    },
  },
  PaginatedDriversResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Drivers retrieved successfully" },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 25 },
          totalPages: { type: "integer", example: 3 },
        },
      },
      data: {
        type: "array",
        items: {
          type: "object",
        },
      },
    },
  },
};

export const driverPaths = {
  "/api/v1/drivers/dashboard": {
    get: {
      tags: ["Driver Operations"],
      summary: "Get Driver Dedicated Dashboard Overview",
      description:
        "Unified dashboard metrics for authenticated drivers: duty status, active ambulance, wallet balance, today/weekly earnings, active ongoing trip, pending offers count, recent trips, and patient reviews.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Driver dashboard retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  statusCode: { type: "integer", example: 200 },
                  data: {
                    type: "object",
                    properties: {
                      profile: { type: "object" },
                      duty: { type: "object" },
                      financials: { type: "object" },
                      performance: { type: "object" },
                      live: { type: "object" },
                      recentTrips: { type: "array", items: { type: "object" } },
                      recentReviews: {
                        type: "array",
                        items: { type: "object" },
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
  },
  "/api/v1/drivers/my-profile": {
    get: {
      tags: ["Driver Operations"],
      summary: "Get Driver Profile & Fleet Info",
      description:
        "Fetches the logged-in driver's complete profile, active ambulance, owned vehicles list, and wallet metrics.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Driver profile retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverProfileResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - requires DRIVER role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Driver Operations"],
      summary: "Update Driver Profile & Vehicle Details",
      description:
        "Dedicated full-access profile update for authenticated drivers. Allows updating personal user info (`name`, `phone`, `avatar`), driver documents (`licenseNumber`, `licenseExpiry`, `licensePhotos`, `nidNumber`, `nidPhotos`, `experienceYears`), and assigned vehicle specs (`vehicleNumber`, `ambulanceType`, `vehiclePhotos`, `equipmentDetails`, equipment toggles). Supports both JSON payloads and multipart file uploads.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                avatar: {
                  type: "string",
                  format: "binary",
                  description: "Profile portrait picture",
                },
                licensePhoto: {
                  type: "string",
                  format: "binary",
                  description: "Single driving license photo",
                },
                licensePhotos: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Multiple license photos / scans",
                },
                nidPhoto: {
                  type: "string",
                  format: "binary",
                  description: "Single NID card photo",
                },
                nidPhotos: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Multiple NID photos (front & back)",
                },
                vehiclePhoto: {
                  type: "string",
                  format: "binary",
                  description: "Single ambulance vehicle photo",
                },
                vehiclePhotos: {
                  type: "array",
                  items: { type: "string", format: "binary" },
                  description: "Multiple ambulance photos",
                },
                name: { type: "string", example: "Kamal Hossain" },
                phone: { type: "string", example: "+8801811223344" },
                licenseNumber: {
                  type: "string",
                  example: "DL-DHAKA-2024-9988",
                },
                licenseExpiry: {
                  type: "string",
                  format: "date",
                  example: "2028-12-31",
                },
                nidNumber: { type: "string", example: "19901234567890123" },
                experienceYears: { type: "integer", example: 6 },
                vehicleNumber: {
                  type: "string",
                  example: "DHAKA-METRO-CHA-11-2233",
                },
                ambulanceType: {
                  type: "string",
                  enum: [
                    "AC",
                    "NON_AC",
                    "ICU",
                    "FREEZER",
                    "NEONATAL",
                    "BASIC",
                  ],
                  example: "ICU",
                },
                model: {
                  type: "string",
                  example: "Toyota HiAce Grandia Ambulance",
                },
                manufacturer: { type: "string", example: "Toyota" },
                year: { type: "integer", example: 2023 },
                hasOxygen: { type: "boolean", example: true },
                hasVentilator: { type: "boolean", example: true },
                hasDefibrillator: { type: "boolean", example: true },
                hasSuctionMachine: { type: "boolean", example: true },
                equipmentDetails: {
                  type: "string",
                  example:
                    "Portable ICU ventilator, defibrillator, high-flow oxygen",
                },
              },
            },
          },
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateDriverProfileRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Driver profile and details updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverProfileResponse" },
            },
          },
        },
        400: {
          description: "Bad Request - validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - requires DRIVER role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/drivers/duty-status": {
    patch: {
      tags: ["Driver Operations"],
      summary: "Toggle Duty Status (ONLINE / OFFLINE)",
      description:
        "Toggles driver duty status. Enforces strict safety rules: driver must be APPROVED and have an APPROVED active vehicle to go ONLINE.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateDutyStatusRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Duty status updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverProfileResponse" },
            },
          },
        },
        400: {
          description: "Bad Request - no vehicle assigned or validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        403: {
          description: "Forbidden - driver or vehicle not approved",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/drivers/location": {
    patch: {
      tags: ["Driver Operations"],
      summary: "Update Live GPS Location",
      description:
        "Updates driver current GPS position and appends coordinate entry to driver location logs for real-time dispatch calculations.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateLocationRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Live location updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
        400: {
          description: "Invalid coordinates provided",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/drivers": {
    get: {
      tags: ["Driver Management (Admin)"],
      summary: "List All Drivers (Admin Only)",
      description:
        "Retrieves a paginated list of all registered drivers with search and status filtering.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        {
          name: "searchTerm",
          in: "query",
          description: "Search across name, email, phone, or licenseNumber",
          schema: { type: "string" },
        },
        {
          name: "verificationStatus",
          in: "query",
          schema: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
          },
        },
        {
          name: "dutyStatus",
          in: "query",
          schema: {
            type: "string",
            enum: ["ONLINE", "OFFLINE", "ON_TRIP", "BUSY"],
          },
        },
      ],
      responses: {
        200: {
          description: "Drivers retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedDriversResponse" },
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
  "/api/v1/drivers/{id}": {
    get: {
      tags: ["Driver Management (Admin)"],
      summary: "Get Driver By ID (Admin Only)",
      description:
        "Fetches full driver application details, verification history, vehicles list, and wallet metrics.",
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
          description: "Driver details retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverProfileResponse" },
            },
          },
        },
        404: {
          description: "Driver not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/drivers/{id}/verify": {
    patch: {
      tags: ["Driver Management (Admin)"],
      summary: "Approve or Reject Driver Application (Admin Only)",
      description:
        "Admins review driver credentials and update verificationStatus to APPROVED, REJECTED, or SUSPENDED.",
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
            schema: { $ref: "#/components/schemas/VerifyDriverRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Driver verification status updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverProfileResponse" },
            },
          },
        },
        404: {
          description: "Driver not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
};
