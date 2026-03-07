import prisma from '@/lib/prisma';
import { resolveCarrierAdapter } from '../carriers/carrierRegistry';
import { CreateShipmentLabelInput } from '../carriers/carrierAdapter';
import crypto from 'crypto';

function hashPayload(payload: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function requestShipmentLabel(shipmentId: string, input: CreateShipmentLabelInput) {
    const shipment = await prisma.networkShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new Error('Shipment not found');

    if (shipment.status === 'LABEL_CREATED') {
        throw new Error('Label already created');
    }

    const carrierCode = shipment.carrierCode;
    const adapter = resolveCarrierAdapter(carrierCode);
    const requestHash = hashPayload(input);

    const existingRequest = await prisma.networkShipmentLabelRequest.findFirst({
        where: { shipmentId, requestPayloadHash: requestHash, requestStatus: 'SUCCESS' }
    });
    if (existingRequest && shipment.labelFileKey) {
        return { message: 'Duplicate label creation blocked', labelFileKey: shipment.labelFileKey };
    }

    const labelRequest = await prisma.networkShipmentLabelRequest.create({
        data: {
            shipmentId,
            carrierCode,
            requestStatus: 'PENDING',
            requestPayloadHash: requestHash
        }
    });

    try {
        const response = await adapter.createShipmentLabel(input);

        // Update shipment details
        await prisma.networkShipment.update({
            where: { id: shipmentId },
            data: {
                status: 'LABEL_CREATED',
                trackingNumber: response.trackingNumber,
                externalShipmentId: response.externalShipmentId,
                labelFileKey: response.labelFileKey
            }
        });

        await prisma.networkShipmentLabelRequest.update({
            where: { id: labelRequest.id },
            data: {
                requestStatus: 'SUCCESS',
                responsePayloadHash: hashPayload(response.rawResponse),
                completedAt: new Date()
            }
        });

        return response;
    } catch (error: any) {
        await prisma.networkShipmentLabelRequest.update({
            where: { id: labelRequest.id },
            data: {
                requestStatus: 'FAILED',
                errorCode: 'LABEL_REQUEST_FAILED'
            }
        });

        throw error;
    }
}

export async function generateCarrierLabel(shipmentId: string) {
    throw new Error('Not Implemented');
}

export async function retryShipmentLabelRequest(requestId: string) {
    throw new Error('Not Implemented');
}
