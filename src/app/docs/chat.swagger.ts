export const chatSwaggerPaths = {
  "/chats/{tripId}/messages": {
    post: {
      tags: ["Chat"],
      summary: "Send a message in an emergency trip conversation",
      description:
        "Allows a patient or assigned driver to send a live message. The message is persisted in PostgreSQL and instantly broadcasted to the trip room via Socket.io.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "tripId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the emergency trip",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: {
                message: {
                  type: "string",
                  example:
                    "Ambulance driver bhai, enter via gate 4 next to the pharmacy.",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Message sent and broadcasted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Message sent successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      tripId: { type: "string" },
                      senderId: { type: "string" },
                      message: { type: "string" },
                      isRead: { type: "boolean", example: false },
                      createdAt: { type: "string", format: "date-time" },
                      sender: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          avatarUrl: { type: "string", nullable: true },
                          role: { type: "string", example: "USER" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        403: { description: "User is not a participant in this trip" },
        404: { description: "Trip not found" },
      },
    },
    get: {
      tags: ["Chat"],
      summary: "Get chat message history for an emergency trip",
      description:
        "Fetches chronological chat messages between the patient and driver for the active or past trip.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "tripId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the emergency trip",
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
          schema: { type: "integer", default: 50 },
        },
      ],
      responses: {
        200: {
          description: "Trip messages retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  meta: {
                    type: "object",
                    properties: {
                      page: { type: "number", example: 1 },
                      limit: { type: "number", example: 50 },
                      total: { type: "number", example: 12 },
                      totalPages: { type: "number", example: 1 },
                    },
                  },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        tripId: { type: "string" },
                        senderId: { type: "string" },
                        message: { type: "string" },
                        isRead: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        sender: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            role: { type: "string" },
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
        403: { description: "Forbidden - Not a trip participant" },
        404: { description: "Trip not found" },
      },
    },
  },
  "/chats/{tripId}/read": {
    patch: {
      tags: ["Chat"],
      summary: "Mark all incoming messages in a trip as read",
      description:
        "Updates unread messages from the other participant to read and emits a real-time read receipt via Socket.io.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "tripId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Messages marked as read",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Messages marked as read",
                  },
                  data: {
                    type: "object",
                    properties: {
                      updatedCount: { type: "number", example: 3 },
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
};
