export const reviewSchemas = {
  CreateReviewRequest: {
    type: "object",
    required: ["tripId", "rating"],
    properties: {
      tripId: {
        type: "string",
        example: "0191837a-4567-7890-abcd-ef0123456789",
        description: "UUID of a COMPLETED trip.",
      },
      rating: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        example: 5,
        description: "Star rating from 1 to 5.",
      },
      comment: {
        type: "string",
        example:
          "The ambulance arrived within 5 minutes. The paramedic was extremely attentive and helpful!",
      },
    },
  },
  ReviewResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Review operation successful" },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          tripId: { type: "string" },
          patientId: { type: "string" },
          driverId: { type: "string" },
          rating: { type: "integer", example: 5 },
          comment: {
            type: "string",
            example: "Prompt response and great service.",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  PaginatedReviewsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Reviews retrieved successfully" },
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
          properties: {
            id: { type: "string" },
            rating: { type: "integer", example: 5 },
            comment: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            patient: {
              type: "object",
              properties: {
                name: { type: "string", example: "Tanvir Ahmed" },
              },
            },
          },
        },
      },
    },
  },
};

export const reviewPaths = {
  "/api/v1/reviews": {
    post: {
      tags: ["Reviews & Ratings"],
      summary: "Submit Trip Review & Rating (Patient Only)",
      description:
        "Allows a patient to rate and review a completed emergency ambulance trip. Automatically recalculates the driver's aggregate rating.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateReviewRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Review created and driver rating updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewResponse" },
            },
          },
        },
        400: {
          description: "Trip is not in COMPLETED status",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        409: {
          description: "Trip has already been reviewed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    get: {
      tags: ["Reviews & Ratings (Admin)"],
      summary: "List All Platform Reviews (Admin Only)",
      description:
        "Retrieves a paginated list of all reviews across the platform with rating and driver filters.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        { name: "rating", in: "query", schema: { type: "integer" } },
        { name: "driverId", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: {
          description: "Reviews retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedReviewsResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/reviews/driver/{driverId}": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "Get Public Reviews for a Driver",
      description:
        "Fetches a public list of ratings and feedback comments for a specific ambulance driver.",
      parameters: [
        {
          name: "driverId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
      ],
      responses: {
        200: {
          description: "Driver reviews retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedReviewsResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/reviews/my-reviews": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "Get My Reviews (Patient or Driver)",
      description:
        "Retrieves reviews given by the patient or reviews received by the driver.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Reviews retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/ReviewResponse" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/reviews/{id}": {
    delete: {
      tags: ["Reviews & Ratings (Admin)"],
      summary: "Delete / Moderate Review (Admin Only)",
      description:
        "Deletes an inappropriate or fraudulent review and automatically recalculates the driver's aggregate rating.",
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
          description: "Review deleted successfully",
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
