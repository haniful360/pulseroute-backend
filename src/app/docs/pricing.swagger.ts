export const pricingSchemas = {
  CreatePricingConfigRequest: {
    type: "object",
    required: ["ambulanceType", "baseFare", "perKmRate", "minFare"],
    properties: {
      ambulanceType: {
        type: "string",
        enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
        example: "ICU",
      },
      baseFare: {
        type: "number",
        example: 1500.0,
        description: "Initial booking charge in BDT",
      },
      perKmRate: {
        type: "number",
        example: 60.0,
        description: "Charge per kilometer in BDT",
      },
      perMinuteRate: {
        type: "number",
        example: 5.0,
        description: "Charge per in-transit minute in BDT",
      },
      platformCommissionRate: {
        type: "number",
        example: 0.12,
        description: "Platform commission fee percentage (e.g. 0.12 = 12%)",
      },
      nightSurgeMultiplier: {
        type: "number",
        example: 1.25,
        description: "Multiplier applied between 11 PM and 6 AM",
      },
      emergencySurgeMultiplier: {
        type: "number",
        example: 1.2,
        description: "Multiplier applied when emergencySeverity is CRITICAL",
      },
      minFare: {
        type: "number",
        example: 2000.0,
        description: "Minimum trip fare in BDT",
      },
      cancellationFee: {
        type: "number",
        example: 300.0,
        description: "Cancellation penalty fee in BDT",
      },
      isActive: {
        type: "boolean",
        example: true,
      },
    },
  },
  UpdatePricingConfigRequest: {
    type: "object",
    properties: {
      baseFare: { type: "number", example: 1600.0 },
      perKmRate: { type: "number", example: 65.0 },
      perMinuteRate: { type: "number", example: 6.0 },
      platformCommissionRate: { type: "number", example: 0.15 },
      nightSurgeMultiplier: { type: "number", example: 1.3 },
      emergencySurgeMultiplier: { type: "number", example: 1.25 },
      minFare: { type: "number", example: 2200.0 },
      cancellationFee: { type: "number", example: 350.0 },
      isActive: { type: "boolean", example: true },
    },
  },
  EstimateFareRequest: {
    type: "object",
    required: ["ambulanceType", "distanceKm"],
    properties: {
      ambulanceType: {
        type: "string",
        enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
        example: "ICU",
      },
      distanceKm: {
        type: "number",
        example: 10.0,
        description: "Trip distance in kilometers (generated from map)",
      },
      estimatedDurationMins: {
        type: "number",
        example: 25,
        description:
          "Optional. Estimated duration in minutes (auto-calculated if omitted)",
      },
      emergencySeverity: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MODERATE", "LOW"],
        example: "HIGH",
        description: "Optional. Severity level of the emergency",
      },
    },
  },
  FareEstimateResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Estimated fare calculated successfully",
      },
      data: {
        type: "object",
        properties: {
          ambulanceType: { type: "string", example: "ICU" },
          distanceKm: { type: "number", example: 10.0 },
          estimatedDurationMins: { type: "number", example: 25 },
          emergencySeverity: { type: "string", example: "CRITICAL" },
          baseFare: { type: "number", example: 1500.0 },
          distanceFare: { type: "number", example: 600.0 },
          durationFare: { type: "number", example: 125.0 },
          surgeMultiplier: { type: "number", example: 1.2 },
          finalEstimatedFare: { type: "number", example: 2670.0 },
          currency: { type: "string", example: "BDT" },
        },
      },
    },
  },
};

export const pricingPaths = {
  "/api/v1/pricing/estimate-fare": {
    post: {
      tags: ["Pricing & Fare Estimation"],
      summary: "Calculate Estimated Trip Fare",
      description:
        "Computes real-time estimated fare based on ambulance type, distance in km, travel duration, automatic night surge detection, and emergency severity.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EstimateFareRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Fare estimated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FareEstimateResponse" },
            },
          },
        },
        400: {
          description: "Invalid input parameters",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        404: {
          description: "Pricing configuration not found for ambulance type",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/pricing": {
    get: {
      tags: ["Pricing & Fare Estimation"],
      summary: "List All Ambulance Pricing Configurations",
      description:
        "Retrieves standard pricing rate cards across all active ambulance categories (BASIC, AC, ICU, CCU, etc.).",
      responses: {
        200: {
          description: "Pricing configurations retrieved successfully",
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
                      $ref: "#/components/schemas/CreatePricingConfigRequest",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Pricing Management (Admin)"],
      summary: "Create or Upsert Pricing Configuration (Admin Only)",
      description:
        "Sets or overrides baseline rates, commission rates, and surge multipliers for a specific ambulance type.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePricingConfigRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Pricing configuration saved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
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
  "/api/v1/pricing/{ambulanceType}": {
    get: {
      tags: ["Pricing & Fare Estimation"],
      summary: "Get Pricing Configuration for Specific Ambulance Type",
      description:
        "Retrieves fare calculation rules and rates for a specified ambulance type.",
      parameters: [
        {
          name: "ambulanceType",
          in: "path",
          required: true,
          schema: {
            type: "string",
            enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
          },
        },
      ],
      responses: {
        200: {
          description: "Pricing configuration retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
        404: {
          description: "Pricing configuration not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Pricing Management (Admin)"],
      summary: "Update Pricing Configuration (Admin Only)",
      description:
        "Allows an admin to update specific fare parameters (perKmRate, baseFare, surges) for an ambulance type.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "ambulanceType",
          in: "path",
          required: true,
          schema: {
            type: "string",
            enum: ["BASIC", "AC", "ICU", "CCU", "FREEZER", "NEONATAL"],
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdatePricingConfigRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Pricing configuration updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
        404: {
          description: "Pricing configuration not found",
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
