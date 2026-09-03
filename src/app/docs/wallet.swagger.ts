export const walletSchemas = {
  CreatePayoutRequest: {
    type: "object",
    required: ["amount", "paymentMethod", "accountNumber"],
    properties: {
      amount: {
        type: "number",
        minimum: 100,
        example: 5000.0,
        description:
          "Requested withdrawal amount in BDT. Cannot exceed current wallet balance.",
      },
      paymentMethod: {
        type: "string",
        enum: ["CASH", "STRIPE"],
        example: "CASH",
        description:
          "Payout channel (e.g. CASH / Mobile Banking / Stripe Direct).",
      },
      accountNumber: {
        type: "string",
        example: "01811223344",
        description: "Mobile financial service number or bank account number.",
      },
      accountDetails: {
        type: "string",
        example: "bKash Personal / Dutch-Bangla Bank Dhanmondi Branch",
      },
    },
  },
  ProcessPayoutRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["APPROVED", "REJECTED", "PROCESSING"],
        example: "APPROVED",
      },
      transactionReference: {
        type: "string",
        example: "TRX-BKASH-998822",
        description:
          "Transaction ID or reference number from bank/MFS transfer.",
      },
      rejectionReason: {
        type: "string",
        example: "Provided account number was invalid",
      },
    },
  },
  DriverWalletResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Driver wallet retrieved successfully",
      },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          driverId: { type: "string" },
          balance: { type: "string", example: "14250.00" },
          totalEarnings: { type: "string", example: "45000.00" },
          totalCommissionPaid: { type: "string", example: "5400.00" },
          totalWithdrawn: { type: "string", example: "25350.00" },
          currency: { type: "string", example: "BDT" },
        },
      },
    },
  },
  PaginatedTransactionsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Wallet transactions retrieved successfully",
      },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 15 },
          totalPages: { type: "integer", example: 2 },
        },
      },
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            amount: { type: "string", example: "2200.00" },
            type: { type: "string", example: "TRIP_EARNING" },
            direction: { type: "string", example: "CREDIT" },
            balanceAfter: { type: "string", example: "14250.00" },
            description: {
              type: "string",
              example: "Trip earning for Invoice INV-20260903-8A2F",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  PayoutRequestResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Payout operation completed" },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          amount: { type: "string", example: "5000.00" },
          status: { type: "string", example: "REQUESTED" },
          accountNumber: { type: "string", example: "01811223344" },
          paymentMethod: { type: "string", example: "CASH" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  PaginatedPayoutsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: {
        type: "string",
        example: "Payout requests retrieved successfully",
      },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 6 },
          totalPages: { type: "integer", example: 1 },
        },
      },
      data: {
        type: "array",
        items: { type: "object" },
      },
    },
  },
};

export const walletPaths = {
  "/api/v1/wallets/my-wallet": {
    get: {
      tags: ["Driver Wallet & Earnings"],
      summary: "Get Driver Wallet Summary",
      description:
        "Fetches current available balance, total earnings, platform commission paid, and total withdrawn amounts.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Wallet retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverWalletResponse" },
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
  "/api/v1/wallets/my-transactions": {
    get: {
      tags: ["Driver Wallet & Earnings"],
      summary: "Get Driver Wallet Transaction History",
      description:
        "Retrieves a paginated ledger of all credit and debit transactions (trip earnings, commission deductions, payout withdrawals).",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        {
          name: "type",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "TRIP_EARNING",
              "COMMISSION_DEDUCTION",
              "PAYOUT_WITHDRAWAL",
              "BONUS",
              "PENALTY",
              "REFUND",
            ],
          },
        },
      ],
      responses: {
        200: {
          description: "Transactions retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaginatedTransactionsResponse",
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/wallets/payout-request": {
    post: {
      tags: ["Driver Wallet & Earnings"],
      summary: "Request Withdrawal / Payout",
      description:
        "Allows a driver to submit a payout withdrawal request. Requires available balance >= requested amount.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePayoutRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Payout request submitted successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PayoutRequestResponse" },
            },
          },
        },
        400: {
          description: "Insufficient wallet balance",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
        409: {
          description: "Pending payout request already exists",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/wallets/admin/payouts": {
    get: {
      tags: ["Driver Payout Management (Admin)"],
      summary: "List All Driver Payout Requests (Admin Only)",
      description:
        "Retrieves a paginated list of all driver withdrawal payout requests with status filtering.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: ["REQUESTED", "PROCESSING", "APPROVED", "REJECTED"],
          },
        },
      ],
      responses: {
        200: {
          description: "Payout requests retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaginatedPayoutsResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/wallets/admin/payouts/{id}": {
    patch: {
      tags: ["Driver Payout Management (Admin)"],
      summary: "Approve or Reject Driver Payout Request (Admin Only)",
      description:
        "Approves or rejects a driver's payout request. On APPROVAL, automatically deducts the amount from the driver's wallet balance and logs a debit transaction.",
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
            schema: { $ref: "#/components/schemas/ProcessPayoutRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Payout request updated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PayoutRequestResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/wallets/statement/export": {
    get: {
      tags: ["Wallet & Driver Ledger"],
      summary: "Download Driver Earning & Ledger Statement (CSV Export)",
      description:
        "Generates a downloadable RFC 4180 CSV statement file containing all earning credits, commission deductions, and withdrawal payouts for the authenticated driver.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "startDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date-time" },
          description: "Filter from start date",
        },
        {
          name: "endDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date-time" },
          description: "Filter up to end date",
        },
        {
          name: "type",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "TRIP_PAYMENT_CREDIT",
              "PLATFORM_COMMISSION_DEBIT",
              "PAYOUT_WITHDRAWAL_DEBIT",
              "BONUS_CREDIT",
              "ADJUSTMENT",
            ],
          },
        },
      ],
      responses: {
        200: {
          description: "Downloadable CSV statement file",
          content: {
            "text/csv": {
              schema: { type: "string" },
            },
          },
        },
      },
    },
  },
};
