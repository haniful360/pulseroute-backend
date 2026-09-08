export const invoiceSchemas = {
  InvoiceResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Invoice operation successful" },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          invoiceNumber: { type: "string", example: "INV-20260903-8A2F" },
          tripId: { type: "string" },
          patientId: { type: "string" },
          driverId: { type: "string" },
          baseFare: { type: "string", example: "1500.00" },
          distanceFare: { type: "string", example: "870.00" },
          totalAmount: { type: "string", example: "2500.00" },
          platformCommission: { type: "string", example: "300.00" },
          driverEarning: { type: "string", example: "2200.00" },
          paymentStatus: { type: "string", example: "PAID" },
          paymentMethod: { type: "string", example: "STRIPE" },
          paidAmount: { type: "string", example: "2500.00" },
          issuedAt: { type: "string", format: "date-time" },
          paidAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
  PaginatedInvoicesResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string", example: "Invoices retrieved successfully" },
      meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 28 },
          totalPages: { type: "integer", example: 3 },
        },
      },
      data: {
        type: "array",
        items: { type: "object" },
      },
    },
  },
};

export const invoicePaths = {
  "/api/v1/invoices/generate/{tripId}": {
    post: {
      tags: ["Invoices & Billing"],
      summary: "Generate Invoice for Completed Trip",
      description:
        "Generates a billing receipt and invoice for a completed trip with fare breakdown, platform commission cut, and driver earning.",
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
        201: {
          description: "Invoice generated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InvoiceResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/invoices/my-invoices": {
    get: {
      tags: ["Invoices & Billing"],
      summary: "Get My Invoices (Patient or Driver)",
      description:
        "Retrieves billing invoices associated with the authenticated patient or driver.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Invoices retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/InvoiceResponse" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/invoices": {
    get: {
      tags: ["Invoices & Billing (Admin)"],
      summary: "List All Platform Invoices (Admin Only)",
      description:
        "Retrieves a paginated list of all platform invoices with payment status and method filters.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 10 },
        },
        { name: "searchTerm", in: "query", schema: { type: "string" } },
        {
          name: "paymentStatus",
          in: "query",
          schema: {
            type: "string",
            enum: ["UNPAID", "PENDING", "PAID", "REFUNDED", "FAILED"],
          },
        },
        {
          name: "paymentMethod",
          in: "query",
          schema: { type: "string", enum: ["STRIPE"] },
        },
      ],
      responses: {
        200: {
          description: "Invoices retrieved successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaginatedInvoicesResponse",
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/invoices/{id}": {
    get: {
      tags: ["Invoices & Billing"],
      summary: "Get Invoice Details By ID",
      description:
        "Fetches full invoice breakdown, payment records, patient details, and driver info.",
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
          description: "Invoice details retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InvoiceResponse" },
            },
          },
        },
        404: {
          description: "Invoice not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/invoices/export/csv": {
    get: {
      tags: ["Invoices & Billing"],
      summary: "Export Platform Invoices Financial Audit (Admin Only - CSV)",
      description:
        "Generates a complete, downloadable RFC 4180 CSV export of platform billing records, fares, distance, and driver earnings.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "startDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "endDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "paymentStatus",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["PAID", "UNPAID", "REFUNDED"] },
        },
        {
          name: "paymentMethod",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["STRIPE"] },
        },
      ],
      responses: {
        200: {
          description: "Downloadable CSV audit file",
          content: {
            "text/csv": {
              schema: { type: "string" },
            },
          },
        },
      },
    },
  },
  "/api/v1/invoices/{id}/receipt/export": {
    get: {
      tags: ["Invoices & Billing"],
      summary: "Download Official Medical Trip Receipt (CSV Export)",
      description:
        "Generates an official itemized medical receipt for patient insurance claims and expense reimbursements.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Invoice ID",
        },
      ],
      responses: {
        200: {
          description: "Downloadable CSV medical receipt file",
          content: {
            "text/csv": {
              schema: { type: "string" },
            },
          },
        },
        403: { description: "Forbidden - Not a trip participant" },
        404: { description: "Invoice not found" },
      },
    },
  },
};
