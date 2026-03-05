import { SignatureProvider } from "./SignatureProvider";

export class EGuvenProvider implements SignatureProvider {
    providerKey = "eguven";

    async createSigningRequest(params: { envelopeId: string; recipientId: string; documentBlobId: string; }) {
        console.log(`[EGuvenProvider] Creating signing request for Envelope: ${params.envelopeId}`);
        return {
            providerRef: `eguven-ref-${Date.now()}`,
            redirectUrl: `https://sign.e-guven.com/mock?ref=${params.envelopeId}`
        };
    }

    async getSigningStatus(providerRef: string) {
        return { status: "SIGNED" as const };
    }

    async downloadSignedDocument(providerRef: string) {
        console.log(`[EGuvenProvider] Downloading signed document logic placeholder`);
        return {
            pdfBuffer: Buffer.from("mock-signed-pdf-data"),
            certChain: Buffer.from("mock-cert-chain"),
            ocspCrl: Buffer.from("mock-ocsp-crl"),
            timestampToken: Buffer.from("mock-timestamp")
        };
    }

    async verifySignature(pdfBuffer: Buffer) {
        console.log(`[EGuvenProvider] Verifying PDF PAdES signature validity`);
        return { valid: true, signerInfo: { name: "Mock Signer via e-Güven" } };
    }
}
