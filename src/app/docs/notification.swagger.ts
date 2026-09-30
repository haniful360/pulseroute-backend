export const notificationSchemas = {
  NotificationResponse: {
    type: "object",
    properties: {
      id: { type: "string" },
      userId: { type: "string" },
      title: { type: "string", example: "Ambulance En Route" },
      message: {
        type: "string",
        example: "Driver Kamal is on the way (Vehicle: DHA-MET-1234)",
      },
      type: {
        type: "string",
        enum: ["TRIP", "PAYMENT", "WALLET", "ACCOUNT", "SYSTEM"],
        example: "TRIP",
      },
      isRead: { type: "boolean", example: false },
      link: { type: "string", example: "/trips/0191837a-1234" },
      metadata: { type: "object" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  PaginatedNotificationsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Notifications retrieved successfully",
      },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 15 },
          total: { type: "integer", example: 24 },
          totalPages: { type: "integer", example: 2 },
          unreadCount: { type: "integer", example: 3 },
        },
      },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/NotificationResponse" },
      },
    },
  },
};

export const notificationPaths = {
  "/api/v1/notifications": {
    get: {
      tags: ["In-App Notifications"],
      summary: "Get Authenticated User Notifications",
      description:
        "Fetches the user's notifications with pagination, read/unread filters, and an exact `unreadCount` badge counter for navbar bells.",
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
          schema: { type: "integer", default: 15 },
        },
        {
          name: "isRead",
          in: "query",
          schema: { type: "boolean" },
          description: "Filter by read/unread status (true or false)",
        },
        {
          name: "type",
          in: "query",
          schema: {
            type: "string",
            enum: ["TRIP", "PAYMENT", "WALLET", "ACCOUNT", "SYSTEM"],
          },
        },
      ],
      responses: {
        200: {
          description: "Notifications retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaginatedNotificationsResponse",
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/notifications/read-all": {
    patch: {
      tags: ["In-App Notifications"],
      summary: "Mark All Notifications as Read",
      description:
        "Marks all unread notifications for the logged-in user as read, resetting the unread badge counter to zero.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications marked as read",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/notifications/{id}/read": {
    patch: {
      tags: ["In-App Notifications"],
      summary: "Mark Specific Notification as Read",
      description:
        "Marks a single notification as read when clicked by the user.",
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
          description: "Notification marked as read",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    $ref: "#/components/schemas/NotificationResponse",
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Notification not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/notifications/{id}": {
    delete: {
      tags: ["In-App Notifications"],
      summary: "Delete Notification",
      description: "Permanently removes a notification from the user's inbox.",
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
          description: "Notification deleted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/notifications/broadcast": {
    post: {
      tags: ["Fleet Announcements (Admin)"],
      summary: "Broadcast Announcement or Emergency Advisory (Admin Only)",
      description:
        "Dispatches an emergency broadcast or fleet-wide announcement to all active drivers and/or users via real-time WebSocket socket.io and persists notification records.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "message"],
              properties: {
                title: { type: "string", example: "Dhaka flood route advisory" },
                message: {
                  type: "string",
                  example:
                    "Avoid Mirpur-10 to Farmgate corridor due to waterlogging.",
                },
                targetAudience: {
                  type: "string",
                  enum: ["ALL", "DRIVERS", "USERS"],
                  default: "ALL",
                },
                priority: {
                  type: "string",
                  enum: ["NORMAL", "URGENT", "CRITICAL"],
                  default: "NORMAL",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Announcement broadcasted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/notifications/broadcasts": {
    get: {
      tags: ["Fleet Announcements (Admin)"],
      summary: "Get Past Broadcast Advisories (Admin Only)",
      description:
        "Retrieves historical distinct broadcast advisories sent across the emergency response network.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Broadcast advisories retrieved successfully",
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
