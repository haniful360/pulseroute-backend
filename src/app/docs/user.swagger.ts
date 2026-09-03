export const userSchemas = {
  UpdateProfileRequest: {
    type: "object",
    properties: {
      // Basic User fields
      name: {
        type: "string",
        example: "Rahim Ahmed",
        description: "Full name of the user",
      },
      phone: {
        type: "string",
        example: "+8801711223344",
        description: "Primary phone number",
      },
      avatarUrl: {
        type: "string",
        format: "uri",
        example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        description: "URL of the uploaded profile photo",
      },

      // Patient-specific fields
      address: {
        type: "string",
        example: "House 14, Road 7, Dhanmondi, Dhaka",
        description: "Residential or permanent address",
      },
      emergencyContactName: {
        type: "string",
        example: "Karim Ahmed",
        description: "Name of emergency contact person",
      },
      emergencyContactNumber: {
        type: "string",
        example: "+8801711223355",
        description: "Phone number of emergency contact person",
      },
      bloodGroup: {
        type: "string",
        example: "O+",
        description: "Blood group (e.g. A+, B+, O+, AB+, etc.)",
      },
      gender: {
        type: "string",
        enum: ["MALE", "FEMALE", "OTHER"],
        example: "MALE",
      },
      dateOfBirth: {
        type: "string",
        format: "date",
        example: "1995-05-15",
      },
      medicalHistory: {
        type: "string",
        example: "Hypertension, asthma, allergic to penicillin",
      },
      profilePhoto: {
        type: "string",
        format: "uri",
        example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      },

      // Driver-specific fields
      nidNumber: {
        type: "string",
        example: "19901234567890123",
        description: "National Identification Number",
      },
      experienceYears: {
        type: "integer",
        example: 6,
        description: "Years of ambulance/commercial driving experience",
      },

      // Admin-specific fields
      orgEmail: {
        type: "string",
        format: "email",
        example: "admin@hospital.org",
        description: "Official institutional or hospital email",
      },
      department: {
        type: "string",
        example: "Emergency Operations",
        description: "Admin assigned department",
      },
    },
  },
  UpdateUserStatusRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["ACTIVE", "BLOCKED", "PENDING_APPROVAL", "DELETED"],
        example: "BLOCKED",
        description: "Target account status",
      },
    },
  },
  UserProfileResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Profile retrieved successfully" },
      data: {
        type: "object",
        properties: {
          id: { type: "string", example: "550e8400-e29b-41d4-a716-446655440000" },
          name: { type: "string", example: "Rahim Ahmed" },
          email: { type: "string", example: "rahim@example.com" },
          phone: { type: "string", example: "+8801711223344" },
          avatarUrl: { type: "string", nullable: true },
          role: { type: "string", example: "USER" },
          status: { type: "string", example: "ACTIVE" },
          emailVerified: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          patient: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              address: { type: "string" },
              emergencyContactName: { type: "string" },
              emergencyContactNumber: { type: "string" },
              bloodGroup: { type: "string" },
              gender: { type: "string" },
              medicalHistory: { type: "string" },
            },
          },
          driver: { type: "object", nullable: true },
          admin: { type: "object", nullable: true },
        },
      },
    },
  },
  PaginatedUsersResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Users retrieved successfully" },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 52 },
          totalPages: { type: "integer", example: 6 },
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

export const userPaths = {
  "/api/v1/users/profile": {
    get: {
      tags: ["Users & Profile"],
      summary: "Get Logged-in User Profile",
      description:
        "Fetches the currently authenticated user's complete profile, including role-specific details (`patient`, `driver`, or `admin`). Excludes sensitive fields like password.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserProfileResponse" },
            },
          },
        },
        401: {
          description: "Unauthorized - missing or invalid JWT token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        404: {
          description: "User not found or deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Users & Profile"],
      summary: "Update Current User Profile",
      description:
        "Updates user profile details. Atomically syncs basic user fields (`name`, `phone`, `avatarUrl`) as well as role-specific models (`Patient`, `Driver`, or `Admin`).",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Profile updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserProfileResponse" },
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
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/users": {
    get: {
      tags: ["Users & Profile"],
      summary: "Get All Users (Admin Only)",
      description:
        "Retrieves a paginated list of all users with search, role filtering, status filtering, and sorting.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          description: "Page number (default: 1)",
          schema: { type: "integer", default: 1 },
        },
        {
          name: "limit",
          in: "query",
          description: "Items per page (default: 10)",
          schema: { type: "integer", default: 10 },
        },
        {
          name: "searchTerm",
          in: "query",
          description: "Partial search across user name, email, or phone",
          schema: { type: "string" },
        },
        {
          name: "role",
          in: "query",
          description: "Filter by role",
          schema: { type: "string", enum: ["SUPER_ADMIN", "DRIVER", "USER"] },
        },
        {
          name: "status",
          in: "query",
          description: "Filter by account status",
          schema: {
            type: "string",
            enum: ["ACTIVE", "BLOCKED", "PENDING_APPROVAL", "DELETED"],
          },
        },
        {
          name: "sortBy",
          in: "query",
          description: "Field to sort by (default: createdAt)",
          schema: { type: "string", default: "createdAt" },
        },
        {
          name: "sortOrder",
          in: "query",
          description: "Sort direction (asc or desc, default: desc)",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
        },
      ],
      responses: {
        200: {
          description: "Users retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedUsersResponse" },
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
  "/api/v1/users/{id}": {
    get: {
      tags: ["Users & Profile"],
      summary: "Get User By ID (Admin Only)",
      description:
        "Fetches complete profile details for a specific user ID including vehicles and role profiles.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID (UUID)",
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "User details retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserProfileResponse" },
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
          description: "Forbidden - requires SUPER_ADMIN role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Users & Profile"],
      summary: "Soft Delete User (Admin Only)",
      description:
        "Marks a user and their corresponding patient/driver/admin records as deleted (`isDeleted: true`, `status: DELETED`).",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID (UUID)",
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "User deleted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
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
          description: "Forbidden - requires SUPER_ADMIN role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/users/{id}/status": {
    patch: {
      tags: ["Users & Profile"],
      summary: "Update User Account Status (Admin Only)",
      description:
        "Allows an administrator to change a user's account status (e.g. BLOCKED, ACTIVE).",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "User ID (UUID)",
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateUserStatusRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "User status updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardSuccessResponse" },
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
          description: "Forbidden - requires SUPER_ADMIN role",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        404: {
          description: "User not found",
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
