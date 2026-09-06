import { z } from "zod";
import { PaymentMethod } from "../../../generated/prisma/enums";

const payInvoiceSchema = z.object({
  paymentMethod: z
    .literal(PaymentMethod.STRIPE, {
      message: "Payment method must be STRIPE",
    })
    .default(PaymentMethod.STRIPE),
  paidAmount: z.number().positive("Paid amount must be positive").optional(),
  gatewayTransactionId: z.string().optional(),
  paymentGateway: z.string().default("STRIPE").optional(),
});

export const InvoiceValidation = {
  payInvoiceSchema,
};
