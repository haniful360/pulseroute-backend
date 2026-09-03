import express, { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

// Create Stripe Payment Intent for an Invoice
router.post(
  "/create-intent",
  auth(Role.USER, Role.SUPER_ADMIN),
  validateRequest(PaymentValidation.createPaymentIntentSchema),
  PaymentController.createPaymentIntent,
);

// Verify and settle payment via client paymentIntentId
router.post(
  "/confirm",
  auth(Role.USER, Role.SUPER_ADMIN),
  validateRequest(PaymentValidation.confirmPaymentSchema),
  PaymentController.confirmPayment,
);

// Stripe Webhook Endpoint (uses express.raw)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook,
);

export const PaymentRoutes = router;
