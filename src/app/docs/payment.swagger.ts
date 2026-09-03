export const paymentSchemas = {
  CreatePaymentIntentRequest: {
    type: "object",
    required: ["invoiceId"],
    properties: {
      invoiceId: {
        type: "string",
        example: "0191837a-4567-7890-abcd-ef0123456789",
        description: "UUID of an UNPAID trip invoice.",
      },
    },
  },
  PaymentIntentResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 201 },
      message: {
        type: "string",
        example: "Stripe Payment Intent created successfully",
      },
      data: {
        type: "object",
        properties: {
          clientSecret: {
            type: "string",
            example: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJ...",
            description:
              "Stripe client secret used to initialize mobile SDK or Stripe.js elements.",
          },
          paymentIntentId: {
            type: "string",
            example: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
          },
          amount: { type: "number", example: 2500.0 },
          currency: { type: "string", example: "bdt" },
          invoiceNumber: { type: "string", example: "INV-20260903-8A2F" },
        },
      },
    },
  },
  ConfirmPaymentRequest: {
    type: "object",
    required: ["invoiceId", "paymentIntentId"],
    properties: {
      invoiceId: {
        type: "string",
        example: "0191837a-4567-7890-abcd-ef0123456789",
      },
      paymentIntentId: {
        type: "string",
        example: "pi_3MtwBwLkdIwHu7ix28a3tqPa",
      },
    },
  },
};

export const paymentPaths = {
  "/api/v1/payments/create-intent": {
    post: {
      tags: ["Stripe Payments"],
      summary: "Create Stripe Payment Intent (Patient / User)",
      description:
        "Generates a client secret and payment intent on Stripe for an unpaid ambulance invoice. Enables secure checkout with cards via Stripe Elements or Mobile SDK.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePaymentIntentRequest" },
          },
        },
      },
      responses: {
        201: {
          description: "Payment Intent created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentIntentResponse" },
            },
          },
        },
        400: {
          description: "Invoice already paid or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/payments/confirm": {
    post: {
      tags: ["Stripe Payments"],
      summary: "Confirm and Settle Stripe Payment (Patient / User)",
      description:
        "Directly verifies that the Stripe Payment Intent status is 'succeeded', marks the invoice as PAID, records the transaction, and automatically credits the driver's wallet with net earnings.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ConfirmPaymentRequest" },
          },
        },
      },
      responses: {
        200: {
          description: "Payment verified and invoice settled",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InvoiceResponse" },
            },
          },
        },
        400: {
          description: "Payment has not succeeded yet",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StandardErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/payments/webhook": {
    post: {
      tags: ["Stripe Payments"],
      summary: "Stripe Webhook Listener",
      description:
        "Handles asynchronous Stripe webhook events (such as 'payment_intent.succeeded') using cryptographic signature verification.",
      parameters: [
        {
          name: "stripe-signature",
          in: "header",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Webhook event processed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  received: { type: "boolean", example: true },
                },
              },
            },
          },
        },
      },
    },
  },
};
