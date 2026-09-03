import {
  PaymentMethod,
  PaymentStatus,
} from "../../../generated/prisma/enums";

export interface IPayInvoicePayload {
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  gatewayTransactionId?: string;
  paymentGateway?: string;
}

export interface IInvoiceFilterRequest {
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  searchTerm?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

