export interface ICreatePaymentIntentPayload {
  invoiceId: string;
}

export interface IConfirmPaymentPayload {
  invoiceId: string;
  paymentIntentId: string;
}
