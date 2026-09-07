import { z } from "zod";
import { PaymentMethod } from "../../../generated/prisma/enums";

const payInvoiceSchema = z.object({
  paymentMethod: z
    .enum([PaymentMethod.STRIPE, PaymentMethod.CASH])
    .default(PaymentMethod.CASH),
  paidAmount: z.number().positive("Paid amount must be positive").optional(),
  gatewayTransactionId: z.string().optional(),
  paymentGateway: z.string().optional(),
});

export const InvoiceValidation = {
  payInvoiceSchema,
};
