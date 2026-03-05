import { PayoutProvider } from "./PayoutProvider";

export class ManualBankPayoutProvider implements PayoutProvider {
    providerKey = "manual_bank";
    supportsTransfers = true;
    supportsBatchTransfers = false;
    providesWebhook = false;

    async initiateTransfer(params: any): Promise<any> {
        console.log(`[ManualBankPayoutProvider] initiateTransfer for ${params.idempotencyKey}`);

        // Return EXECUTING since it's manual, we wait for a bank feed or manual marking to set it as SETTLED.
        return {
            providerRef: `manual-payout-${params.idempotencyKey}`,
            status: "EXECUTING",
            metaJson: { notes: "Awaiting manual bank transfer or bank feed match" }
        };
    }

    async getTransferStatus(providerRef: string): Promise<any> {
        // Status updates happen externally via Bank Feeds
        return { status: "EXECUTING" };
    }

    async verifyWebhook(headers: Record<string, string>, rawBody: Buffer): Promise<any> {
        return { valid: false }; // Not supported
    }
}
