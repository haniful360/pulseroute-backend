import {
  PaymentMethod,
  PayoutStatus,
  TransactionType,
} from "../../../generated/prisma/enums";

export interface ICreatePayoutRequestPayload {
  amount: number;
  paymentMethod: PaymentMethod;
  accountNumber: string;
  accountDetails?: string;
}

export interface IProcessPayoutPayload {
  status: PayoutStatus;
  rejectionReason?: string;
  transactionReference?: string;
}

export interface IPayoutFilterRequest {
  status?: PayoutStatus;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ITransactionFilterRequest {
  type?: TransactionType;
  page?: string | number;
  limit?: string | number;
}

