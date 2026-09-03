export const vehicleSchemas = {
  CreateVehicleRequest: {
    type: "object",
    required: ["ambulanceType", "vehicleNumber"],
    properties: {
      ambulanceType: {
        type: "string",
        enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
        example: "ICU",
      },
      vehicleNumber: {
        type: "string",
        example: "DHAKA-METRO-CHA-11-2233",
      },
      model: {
        type: "string",
        example: "HiAce High Roof Ambulance",
      },
      manufacturer: {
        type: "string",
        example: "Toyota",
      },
      year: {
        type: "integer",
        example: 2022,
      },
      hasOxygen: {
        type: "boolean",
        example: true,
      },
      hasVentilator: {
        type: "boolean",
        example: true,
      },
      hasDefibrillator: {
        type: "boolean",
        example: true,
      },
      hasSuctionMachine: {
        type: "boolean",
        example: true,
      },
      equipmentDetails: {
        type: "string",
        example:
          "Portable ventilator with built-in backup battery, high-flow oxygen cylinder",
      },
    },
  },
  UpdateVehicleRequest: {
    type: "object",
    properties: {
      model: { type: "string" },
      manufacturer: { type: "string" },
      year: { type: "integer" },
      hasOxygen: { type: "boolean" },
      hasVentilator: { type: "boolean" },
      hasDefibrillator: { type: "boolean" },
      hasSuctionMachine: { type: "boolean" },
      equipmentDetails: { type: "string" },
      isActive: { type: "boolean" },
    },
  },
  VerifyVehicleRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["APPROVED", "REJECTED", "PENDING"],
        example: "APPROVED",
      },
      rejectionReason: {
        type: "string",
        example: "Fitness certificate invalid or expired",
      },
    },
  },
  VehicleResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Vehicle operation successful" },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          vehicleNumber: { type: "string", example: "DHAKA-METRO-CHA-11-2233" },
          ambulanceType: { type: "string", example: "ICU" },
          model: { type: "string", example: "HiAce High Roof" },
          verificationStatus: { type: "string", example: "APPROVED" },
          hasOxygen: { type: "boolean", example: true },
          hasVentilator: { type: "boolean", example: true },
          isActive: { type: "boolean", example: true },
        },
      },
    },
  },
  PaginatedVehiclesResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Vehicles retrieved successfully" },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 18 },
          totalPages: { type: "integer", example: 2 },
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

export const vehiclePaths = {
  "/api/v1/vehicles": {
    post: {
      tags: ["Vehicle & Fleet Management"],
      summary: "Register a New Ambulance (Driver Only)",
      description:
        "Allows an authenticated driver to register an ambulance vehicle. Newly created vehicles are placed in PENDING verification status.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateVehicleRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Ambulance registered successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleResponse" },
            },
          },
        },
        409: {
          description: "Vehicle registration number already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    get: {
      tags: ["Vehicle & Fleet Management (Admin)"],
      summary: "List All Fleet Vehicles (Admin Only)",
      description:
        "Retrieves a paginated list of all ambulance vehicles across the platform with filtering by ambulanceType and verificationStatus.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        {
          name: "searchTerm",
          in: "query",
          description: "Search by vehicle registration number or model",
          schema: { type: "string" },
        },
        {
          name: "ambulanceType",
          in: "query",
          schema: {
            type: "string",
            enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
          },
        },
        {
          name: "verificationStatus",
          in: "query",
          schema: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED"],
          },
        },
      ],
      responses: {
        200: {
          description: "Vehicles retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaginatedVehiclesResponse",
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
  "/api/v1/vehicles/my-vehicles": {
    get: {
      tags: ["Vehicle & Fleet Management"],
      summary: "Get Owned Ambulances (Driver Only)",
      description:
        "Returns all ambulance vehicles registered by the logged-in driver.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Vehicles retrieved successfully",
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
                      $ref: "#/components/schemas/VehicleResponse",
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
  "/api/v1/vehicles/{id}": {
    get: {
      tags: ["Vehicle & Fleet Management"],
      summary: "Get Ambulance Details By ID",
      description:
        "Fetches full equipment details, verification history, and driver owner information for an ambulance vehicle.",
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
          description: "Vehicle details retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleResponse" },
            },
          },
        },
        404: {
          description: "Vehicle not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Vehicle & Fleet Management"],
      summary: "Update Ambulance Details (Driver Only)",
      description:
        "Allows driver to update equipment specifications (oxygen, ventilator, defibrillator, suction) and active status of their owned vehicle.",
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
            schema: { $ref: "#/components/schemas/UpdateVehicleRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Vehicle updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleResponse" },
            },
          },
        },
        404: {
          description: "Vehicle not found or does not belong to driver",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/vehicles/{id}/verify": {
    patch: {
      tags: ["Vehicle & Fleet Management (Admin)"],
      summary: "Approve or Reject Ambulance (Admin Only)",
      description:
        "Admin reviews vehicle fitness/documents and sets verification status to APPROVED or REJECTED.",
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
            schema: { $ref: "#/components/schemas/VerifyVehicleRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Vehicle verification status updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleResponse" },
            },
          },
        },
        404: {
          description: "Vehicle not found",
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
