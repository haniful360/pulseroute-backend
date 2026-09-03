export const hospitalSchemas = {
  CreateHospitalRequest: {
    type: "object",
    required: ["name", "address", "emergencyPhone", "latitude", "longitude"],
    properties: {
      name: { type: "string", example: "Square Hospital Ltd." },
      branch: { type: "string", example: "Panthapath, Dhaka" },
      address: {
        type: "string",
        example: "18/F, Bir Uttam Qazi Nuruzzaman Sarak, Dhaka 1205",
      },
      emergencyPhone: { type: "string", example: "01713377775" },
      emergencyEmail: {
        type: "string",
        format: "email",
        example: "emergency@squarehospital.com",
      },
      latitude: { type: "number", example: 23.7533 },
      longitude: { type: "number", example: 90.3879 },
      hasICU: { type: "boolean", default: true },
      hasNICU: { type: "boolean", default: false },
      hasTraumaCenter: { type: "boolean", default: true },
      hasBloodBank: { type: "boolean", default: true },
      totalBeds: { type: "integer", example: 100 },
      availableBeds: { type: "integer", example: 15 },
    },
  },
  CreatePreAlertRequest: {
    type: "object",
    required: ["tripId", "hospitalId"],
    properties: {
      tripId: {
        type: "string",
        example: "019445a8-2023-7182-8d75-926fba428588",
      },
      hospitalId: {
        type: "string",
        example: "019445a8-2023-7182-8d75-926fba428599",
      },
      medicalCondition: {
        type: "string",
        example: "Acute Myocardial Infarction (Severe Chest Pain)",
      },
      allergies: { type: "string", example: "Penicillin, Aspirin" },
      vitalsSummary: {
        type: "string",
        example: "BP 85/55 mmHg, SpO2 88%, Pulse 118 bpm",
      },
      estimatedArrivalMins: { type: "integer", example: 8 },
    },
  },
  AcknowledgeAlertRequest: {
    type: "object",
    required: ["assignedBayNumber"],
    properties: {
      assignedBayNumber: {
        type: "string",
        example: "Trauma Bay 2",
        description: "Assigned ER Bed or Trauma Bay for immediate intake",
      },
      acknowledgedBy: {
        type: "string",
        example: "Dr. Farhan (On-Duty Emergency Medical Officer)",
      },
      notes: {
        type: "string",
        example: "Cardiology team alerted. O+ blood cross-match ready.",
      },
    },
  },
};

export const hospitalPaths = {
  "/api/v1/hospitals": {
    post: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary: "Register Hospital into Directory (Admin Only)",
      description:
        "Adds a hospital and emergency room profile with ICU/trauma facilities and hotline contact numbers.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateHospitalRequest" },
          },
        },
      },
      responses: {
        201: { description: "Hospital registered successfully" },
        400: { description: "Validation error" },
      },
    },
    get: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary: "Search & List Nearby Hospitals",
      description:
        "Fetches active hospitals with optional ICU, NICU, Trauma Center, and Blood Bank filters.",
      parameters: [
        {
          name: "searchTerm",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "hasICU",
          in: "query",
          required: false,
          schema: { type: "boolean" },
        },
        {
          name: "hasTraumaCenter",
          in: "query",
          required: false,
          schema: { type: "boolean" },
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", default: 20 },
        },
      ],
      responses: {
        200: { description: "Hospitals retrieved successfully" },
      },
    },
  },
  "/api/v1/hospitals/pre-alerts": {
    post: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary: "Dispatch Emergency Pre-Alert to Destination Hospital",
      description:
        "Notifies the destination hospital ER triage monitor in real-time with patient vitals, blood group, and live ambulance ETA. Triggers emergency trauma sirens and SMS alert.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePreAlertRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Hospital Pre-Alert dispatched successfully",
        },
        403: { description: "Forbidden - Not a trip participant" },
        404: { description: "Trip or Hospital not found" },
      },
    },
  },
  "/api/v1/hospitals/pre-alerts/track/{token}": {
    get: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary:
        "Zero-Auth Public Live ER Tracking Dashboard (For On-Duty Doctors)",
      description:
        "Accessible via secure token without login. Allows on-duty emergency room doctors and triage nurses to view the moving ambulance's live GPS coordinates, patient medical history, and arrival countdown.",
      parameters: [
        {
          name: "token",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Pre-Alert tracking token",
        },
      ],
      responses: {
        200: {
          description: "Live ER tracking telemetry retrieved successfully",
        },
        404: { description: "Invalid or expired tracking token" },
      },
    },
  },
  "/api/v1/hospitals/pre-alerts/{id}/acknowledge": {
    patch: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary: "Acknowledge Alert & Ready Trauma Bay / Bed",
      description:
        "Hospital doctor acknowledges incoming critical patient and assigns a specific Trauma Bay or ICU Bed. Immediately broadcasts to the moving ambulance driver.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Pre-alert ID or tracking token",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AcknowledgeAlertRequest" },
          },
        },
      },
      responses: {
        200: { description: "Trauma Bay acknowledged and confirmed" },
      },
    },
  },
  "/api/v1/hospitals/{id}/active-alerts": {
    get: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary: "Get Active Emergency Queue for Hospital ER Wall Monitor",
      description:
        "Returns active incoming ambulance alerts for a hospital triage monitor screen.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Hospital ID",
        },
      ],
      responses: {
        200: {
          description: "Active emergency pre-alerts retrieved successfully",
        },
      },
    },
  },
  "/api/v1/hospitals/{id}": {
    get: {
      tags: ["Hospital Emergency Pre-Alert"],
      summary: "Get Hospital Profile by ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Hospital details retrieved successfully" },
        404: { description: "Hospital not found" },
      },
    },
  },
};
