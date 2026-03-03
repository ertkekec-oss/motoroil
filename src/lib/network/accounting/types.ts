export type AccountingEvent = "ORDER_CREATED" | "PAYMENT_SUCCEEDED" | "REFUND_SUCCEEDED" | "ORDER_APPROVED" | "ORDER_REJECTED";

export interface AccountingAdapter {
    postOrder(orderId: string): Promise<void>;
    postPayment(intentId: string): Promise<void>;
    postRefund(refundId: string): Promise<void>;
}
