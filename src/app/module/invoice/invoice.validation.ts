import { z } from "zod";
import { PaymentMethod } from "../../../generated/prisma/enums";

const payInvoiceSchema = z.object({
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.STRIPE], {
    message: "Payment method must be CASH or STRIPE",
  }),
  paidAmount: z.number().positive("Paid amount must be positive").optional(),
  gatewayTransactionId: z.string().optional(),
  paymentGateway: z.string().optional(),
});

export const InvoiceValidation = {
  payInvoiceSchema,
};
