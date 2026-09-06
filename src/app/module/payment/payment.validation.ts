import { z } from "zod";

const createPaymentIntentSchema = z.object({
  invoiceId: z.string({ message: "Invoice ID is required" }),
});

const confirmPaymentSchema = z.object({
  invoiceId: z.string({ message: "Invoice ID is required" }),
  paymentIntentId: z.string({ message: "Payment Intent ID is required" }),
  paymentMethodId: z.string().optional(),
});

export const PaymentValidation = {
  createPaymentIntentSchema,
  confirmPaymentSchema,
};
