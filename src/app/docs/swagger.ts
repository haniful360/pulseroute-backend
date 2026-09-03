import { analyticsPaths, analyticsSchemas } from "./analytics.swagger";
import { driverPaths, driverSchemas } from "./driver.swagger";
import { invoicePaths, invoiceSchemas } from "./invoice.swagger";
import { notificationPaths, notificationSchemas } from "./notification.swagger";
import { paymentPaths, paymentSchemas } from "./payment.swagger";
import { pricingPaths, pricingSchemas } from "./pricing.swagger";
import { reviewPaths, reviewSchemas } from "./review.swagger";
import { settingPaths, settingSchemas } from "./setting.swagger";
import { tripPaths, tripSchemas } from "./trip.swagger";
import { userPaths, userSchemas } from "./user.swagger";
import { vehiclePaths, vehicleSchemas } from "./vehicle.swagger";
import { walletPaths, walletSchemas } from "./wallet.swagger";

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "PulseRoute — Emergency Ambulance Dispatch Platform API",
    version: "1.0.0",
    description:
      "Comprehensive REST API Documentation for PulseRoute Emergency Ambulance Dispatch Backend System.\n\n### Core Roles:\n- **USER (Patient):** Emergency ambulance booking, live status tracking, invoice & billing.\n- **DRIVER:** Duty status management (ONLINE/OFFLINE), emergency trip acceptance & lifecycle updates.\n- **SUPER_ADMIN:** Driver/vehicle verification, platform pricing & commission configuration, system analytics.\n\n### Authentication Methods:\n1. **Email & Password + Redis OTP:** Register $\\rightarrow$ receive 6-digit OTP $\\rightarrow$ verify to activate.\n2. **Google Sign-In:** Authenticate with Google OAuth ID Token via `/api/v1/auth/google-login`.\n3. **Forgot & Reset Password:** Request 6-digit Reset OTP via email $\\rightarrow$ reset password securely.",
    contact: {
      name: "PulseRoute Support",
      email: "support@pulseroute.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter your JWT Access Token in the format: Bearer <token>",
      },
    },
    schemas: {
      ...userSchemas,
      ...driverSchemas,
      ...vehicleSchemas,
      ...pricingSchemas,
      ...tripSchemas,
      ...invoiceSchemas,
      ...walletSchemas,
      ...reviewSchemas,
      ...analyticsSchemas,
      ...settingSchemas,
      ...paymentSchemas,
      ...notificationSchemas,
      RegisterUserRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Rahim Ahmed" },
          email: {
            type: "string",
            format: "email",
            example: "rahim@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
          contactNumber: { type: "string", example: "+8801711223344" },
          address: {
            type: "string",
            example: "House 12, Road 5, Dhanmondi, Dhaka",
          },
          emergencyContactName: { type: "string", example: "Karim Ahmed" },
          emergencyContactNumber: {
            type: "string",
            example: "+8801711223355",
          },
          bloodGroup: { type: "string", example: "O+" },
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
            example: "Asthma, allergic to penicillin",
          },
        },
      },
      RegisterDriverRequest: {
        type: "object",
        required: [
          "name",
          "email",
          "password",
          "contactNumber",
          "licenseNumber",
        ],
        properties: {
          name: { type: "string", example: "Kamal Hossain" },
          email: {
            type: "string",
            format: "email",
            example: "kamal.driver@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
          contactNumber: { type: "string", example: "+8801811223344" },
          licenseNumber: { type: "string", example: "DL-DHAKA-2024-9988" },
          licenseExpiry: {
            type: "string",
            format: "date",
            example: "2028-12-31",
          },
          nidNumber: { type: "string", example: "19901234567890123" },
          experienceYears: { type: "integer", example: 5 },
          vehicleNumber: { type: "string", example: "DHAKA-METRO-CHA-11-2233" },
          ambulanceType: {
            type: "string",
            enum: ["AC", "NON_AC", "ICU", "FREEZER", "NEONATAL", "BASIC"],
            example: "ICU",
          },
          model: { type: "string", example: "Toyota HiAce Grandia Ambulance" },
          manufacturer: { type: "string", example: "Toyota" },
          year: { type: "integer", example: 2022 },
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
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "rahim@example.com",
          },
          otp: { type: "string", example: "492817" },
        },
      },
      ResendOtpRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "rahim@example.com",
          },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "rahim@example.com",
          },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "rahim@example.com",
          },
          otp: { type: "string", example: "492817" },
          newPassword: {
            type: "string",
            format: "password",
            example: "newStrongPassword123",
          },
        },
      },
      GoogleLoginRequest: {
        type: "object",
        properties: {
          idToken: {
            type: "string",
            description:
              "Google OAuth ID Token obtained from Google Sign-In SDK",
            example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE3NGI2...",
          },
          token: {
            type: "string",
            description: "Alternative parameter name for Google ID Token",
            example: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE3NGI2...",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "haniful@gmail.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "haniful123",
          },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["oldPassword", "newPassword"],
        properties: {
          oldPassword: {
            type: "string",
            format: "password",
            example: "password123",
          },
          newPassword: {
            type: "string",
            format: "password",
            example: "newpassword123",
          },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      StandardSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          statusCode: { type: "integer", example: 200 },
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
          data: { type: "object" },
        },
      },
      StandardErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          statusCode: { type: "integer", example: 400 },
          message: {
            type: "string",
            example: "Invalid input or operation failed",
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Auth",
      description:
        "User, Driver, and Super Admin Authentication, Redis OTP, Google OAuth & Profile endpoints",
    },
    { name: "Health", description: "Server Health Check" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Health Check",
        description:
          "Check if the PulseRoute backend server is alive and running.",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example:
                        "Welcome to PulseRoute — Emergency Ambulance Dispatch Platform API",
                    },
                    version: { type: "string", example: "1.0.0" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register User (Patient) - Step 1: Send OTP",
        description:
          "Initiates registration for a patient, caches registration payload and generates a 6-digit OTP stored in Redis for 5 minutes, and sends an attractive verification email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterUserRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent to email successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          400: {
            description: "Bad Request / Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register-driver": {
      post: {
        tags: ["Auth"],
        summary: "Register Driver - Step 1: Send OTP",
        description:
          "Validates driver license, vehicle number, hashes password, stores pending driver data & 6-digit OTP in Redis for 5 minutes, and dispatches verification email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterDriverRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "OTP sent to email successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          400: {
            description: "Duplicate email, license, or vehicle number",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP & Activate Account - Step 2",
        description:
          "Validates the 6-digit OTP from Redis. Automatically creates User + Patient (or User + Driver + Vehicle + Wallet in a transaction), sets HTTP-only cookies, and returns JWT tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Account activated and tokens issued successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          400: {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend Verification OTP",
        description:
          "Generates a fresh 6-digit OTP, resets the 5-minute TTL in Redis, and sends a new verification email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResendOtpRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "New OTP sent successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          404: {
            description: "No pending registration found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Forgot Password - Send Reset OTP",
        description:
          "Generates a secure 6-digit password reset OTP stored in Redis for 5 minutes and sends a password reset email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset OTP sent to email",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          404: {
            description: "No account found with this email",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset Password - Verify OTP & Set New Password",
        description:
          "Verifies the 6-digit reset OTP from Redis, updates the user's password with secure bcrypt hash, deletes OTP, and sends a security confirmation email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          400: {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/google-login": {
      post: {
        tags: ["Auth"],
        summary: "Google Sign-In / Login",
        description:
          "Verifies Google OAuth ID Token, creates user (Patient) if not existing and sends attractive welcome email, or logs in existing user and returns JWT tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GoogleLoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Google Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          401: {
            description: "Google ID token verification failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Universal Dynamic Login",
        description:
          "Logs in any role (USER, DRIVER, SUPER_ADMIN), verifies active status, and dynamically returns their role-specific profile along with JWT cookies and personalized welcome message.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          401: {
            description: "Invalid email or password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
          403: {
            description: "Account blocked or deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get Current Authenticated User Profile",
        description:
          "Returns the profile of the currently logged-in user based on JWT token. Dynamically includes patient data for USER, vehicle & wallet for DRIVER, or admin data for SUPER_ADMIN.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User profile fetched successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          401: {
            description: "Unauthorized / Missing or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change Password",
        description:
          "Allows an authenticated user to change their account password.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          400: {
            description: "Incorrect current password or identical new password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh Access Token",
        description:
          "Generates new accessToken and refreshToken from an existing valid refreshToken (read from cookie or body).",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "New tokens generated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
          401: {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout User",
        description: "Clears accessToken and refreshToken HTTP-only cookies.",
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StandardSuccessResponse",
                },
              },
            },
          },
        },
      },
    },
    ...userPaths,
    ...driverPaths,
    ...vehiclePaths,
    ...pricingPaths,
    ...tripPaths,
    ...invoicePaths,
    ...walletPaths,
    ...reviewPaths,
    ...analyticsPaths,
    ...settingPaths,
    ...paymentPaths,
    ...notificationPaths,
  },
};
