export interface SignatureProvider {
    providerKey: string;

    createSigningRequest(params: {
        envelopeId: string;
        recipientId: string;
        documentBlobId: string;
    }): Promise<{
        providerRef: string;
        redirectUrl?: string;
    }>;

    getSigningStatus(providerRef: string): Promise<{
        status: "PENDING" | "SIGNED" | "FAILED";
    }>;

    downloadSignedDocument(providerRef: string): Promise<{
        pdfBuffer: Buffer;
        certChain?: Buffer;
        ocspCrl?: Buffer;
        timestampToken?: Buffer;
    }>;

    verifySignature(pdfBuffer: Buffer): Promise<{
        valid: boolean;
        signerInfo?: any;
    }>;
}
