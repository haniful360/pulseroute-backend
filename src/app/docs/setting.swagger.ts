export const settingSchemas = {
  UpsertSettingRequest: {
    type: "object",
    required: ["key", "value"],
    properties: {
      key: {
        type: "string",
        example: "EMERGENCY_HOTLINE",
        description:
          "Alphanumeric uppercase configuration key with underscores.",
      },
      value: {
        type: "string",
        example: "999",
      },
      description: {
        type: "string",
        example: "Emergency hotline phone number displayed to public",
      },
    },
  },
  UpdateSettingRequest: {
    type: "object",
    required: ["value"],
    properties: {
      value: {
        type: "string",
        example: "100",
      },
      description: {
        type: "string",
        example: "Updated description for this setting",
      },
    },
  },
  SettingResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "System setting retrieved successfully",
      },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string", example: "EMERGENCY_HOTLINE" },
          value: { type: "string", example: "999" },
          description: { type: "string" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  PublicSettingsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Public system settings retrieved successfully",
      },
      data: {
        type: "object",
        properties: {
          EMERGENCY_HOTLINE: { type: "string", example: "999" },
          SEARCH_RADIUS_KM: { type: "string", example: "15" },
          OFFER_EXPIRY_SECONDS: { type: "string", example: "90" },
          MAINTENANCE_MODE: { type: "string", example: "false" },
          PLATFORM_NAME: {
            type: "string",
            example: "PulseRoute Emergency Dispatch",
          },
          SUPPORT_EMAIL: { type: "string", example: "support@pulseroute.com" },
          SUPPORT_PHONE: { type: "string", example: "+8801700000000" },
        },
      },
    },
  },
};

export const settingPaths = {
  "/api/v1/settings/public": {
    get: {
      tags: ["System Settings"],
      summary: "Get Public System Configurations",
      description:
        "Fetches client-safe platform configurations including emergency helpline, maintenance mode status, search radius, and support contacts.",
      responses: {
        200: {
          description: "Public settings retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicSettingsResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/settings": {
    get: {
      tags: ["System Settings (Admin)"],
      summary: "List All System Settings (Admin Only)",
      description:
        "Retrieves all runtime configuration settings from the database.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "All settings retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        value: { type: "string" },
                        description: { type: "string" },
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
    post: {
      tags: ["System Settings (Admin)"],
      summary: "Create or Upsert System Setting (Admin Only)",
      description:
        "Creates a new configuration key or updates its value if it already exists.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpsertSettingRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Setting saved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SettingResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/settings/{key}": {
    get: {
      tags: ["System Settings (Admin)"],
      summary: "Get Setting By Key (Admin Only)",
      description: "Fetches a specific system setting by its alphanumeric key.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Setting retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SettingResponse" },
            },
          },
        },
        404: {
          description: "Setting not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["System Settings (Admin)"],
      summary: "Update Setting Value (Admin Only)",
      description:
        "Updates the value and description of an existing configuration key.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateSettingRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Setting updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SettingResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["System Settings (Admin)"],
      summary: "Delete System Setting (Admin Only)",
      description: "Deletes a configuration key from the platform database.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Setting deleted successfully",
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
