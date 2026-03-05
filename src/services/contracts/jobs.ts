import { renderPdfQueue, sendEnvelopeQueue, webhookIngestQueue, sendSmsOtpQueue, exportAuditQueue, finalizeSignatureQueue, verifySignatureQueue } from './bullmq';
import { appendAuditEvent } from './audit';
import { getStrictTenantId } from './tenantContext';

export async function enqueueRenderPdf(documentVersionId: string) {
    console.log(`[Job Enqueue] Render PDF for document version: ${documentVersionId}`);

    // Using idempotency key via jobId
    await renderPdfQueue.add('render', { documentVersionId }, {
        jobId: `render_pdf:${documentVersionId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    });
}

export async function enqueueSendEnvelope(envelopeId: string) {
    console.log(`[Job Enqueue] Send Envelope: ${envelopeId}`);

    await sendEnvelopeQueue.add('send', { envelopeId }, {
        jobId: `send_envelope:${envelopeId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
    });
}

export async function enqueueWebhookIngest(webhookInboxId: string) {
    console.log(`[Job Enqueue] Process Webhook: ${webhookInboxId}`);

    await webhookIngestQueue.add('ingest', { webhookInboxId }, {
        jobId: `webhook_ingest:${webhookInboxId}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 }
    });
}

export async function enqueueSendSmsOtp(signingSessionId: string, otpCounter: number) {
    console.log(`[Job Enqueue] Process SMS OTP for Session: ${signingSessionId}`);

    await sendSmsOtpQueue.add('send_otp', { signingSessionId }, {
        jobId: `send_sms_otp:${signingSessionId}:${otpCounter}`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 500 }
    });
}

export async function enqueueExportAudit(envelopeId: string, format: string = 'csv') {
    console.log(`[Job Enqueue] Export Audit for Envelope: ${envelopeId}`);

    await exportAuditQueue.add('export', { envelopeId, format }, {
        jobId: `export_audit:${envelopeId}:${Date.now()}`,
        attempts: 3
    });
}

export async function enqueueFinalizeSignature(providerKey: string, providerRef: string, envelopeId: string, recipientId: string) {
    console.log(`[Job Enqueue] Finalize Signature for Recipient: ${recipientId}`);

    await finalizeSignatureQueue.add('finalize', { providerKey, providerRef, envelopeId, recipientId }, {
        jobId: `finalize_sig:${providerRef}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
    });
}

export async function enqueueVerifySignature(signatureArtifactId: string) {
    console.log(`[Job Enqueue] Verify Signature Artifact: ${signatureArtifactId}`);

    await verifySignatureQueue.add('verify', { signatureArtifactId }, {
        jobId: `verify_sig:${signatureArtifactId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    });
}
