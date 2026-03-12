import { NextResponse } from 'next/server';
import { NilveraInvoiceService } from '@/services/nilveraService';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function GET() {
    const intSettings = await prisma.integratorSettings.findFirst({
        where: { isActive: true }
    });
    if (!intSettings || !intSettings.credentials) {
        return NextResponse.json({ error: "No setting" });
    }
    const creds = JSON.parse(decrypt(intSettings.credentials));
    const apiKey = creds.apiKey || creds.ApiKey;
    
    const nilvera = new NilveraInvoiceService({
        apiKey,
        baseUrl: "https://api.nilvera.com"
    });
    
    const dRes = await nilvera.checkDespatchTaxpayer("6231776841");
    const eRes = await nilvera.checkTaxpayer("6231776841");

    return NextResponse.json({
        despatch: dRes,
        einvoice: eRes
    });
}
