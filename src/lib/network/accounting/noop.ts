import { AccountingAdapter } from "./types";

export class NoopAccountingAdapter implements AccountingAdapter {
    async postOrder(orderId: string): Promise<void> {
        console.info(`[ACCOUNTING NOOP] postOrder: ${orderId}`);
    }

    async postPayment(intentId: string): Promise<void> {
        console.info(`[ACCOUNTING NOOP] postPayment: ${intentId}`);
    }

    async postRefund(refundId: string): Promise<void> {
        console.info(`[ACCOUNTING NOOP] postRefund: ${refundId}`);
    }
}
