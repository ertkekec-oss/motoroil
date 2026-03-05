import { SignatureProvider } from "./SignatureProvider";

export class ETugraProvider implements SignatureProvider {
    providerKey = "etugra";

    async createSigningRequest(params: { envelopeId: string; recipientId: string; documentBlobId: string; }) {
        console.log(`[ETugraProvider] Creating signing request for Envelope: ${params.envelopeId}`);
        return {
            providerRef: `etugra-ref-${Date.now()}`,
            redirectUrl: `https://sign.e-tugra.com/mock?ref=${params.envelopeId}`
        };
    }

    async getSigningStatus(providerRef: string) {
        return { status: "SIGNED" as const };
    }

    async downloadSignedDocument(providerRef: string) {
        console.log(`[ETugraProvider] Downloading signed document logic placeholder`);
        return {
            pdfBuffer: Buffer.from("mock-signed-pdf-data"),
            certChain: Buffer.from("mock-cert-chain"),
            ocspCrl: Buffer.from("mock-ocsp-crl"),
            timestampToken: Buffer.from("mock-timestamp")
        };
    }

    async verifySignature(pdfBuffer: Buffer) {
        console.log(`[ETugraProvider] Verifying PDF PAdES signature validity`);
        return { valid: true, signerInfo: { name: "Mock Signer via e-Tuğra" } };
    }
}
