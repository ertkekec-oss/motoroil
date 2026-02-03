import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NilveraService } from '@/lib/nilvera';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settingsRecord = await prisma.appSettings.findUnique({ where: { key: 'eFaturaSettings' } });
        const rawConfig = settingsRecord?.value as any;

        let config = {};
        if (rawConfig?.apiKey) {
            config = rawConfig;
        } else if (rawConfig?.nilvera) {
            config = rawConfig.nilvera;
        } else if (rawConfig) {
            config = rawConfig;
        }

        const apiKey = (config as any).apiKey || (config as any).ApiKey;
        const environment = (config as any).environment || (config as any).Environment || 'test';
        const baseUrl = environment === 'production'
            ? 'https://api.nilvera.com'
            : 'https://apitest.nilvera.com';

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'API Key bulunamadı',
                availableKeys: Object.keys(config),
                rawConfigPresence: !!rawConfig
            });
        }

        const headers = {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
        };

        const result: any = {};
        try {
            const ea = await axios.get(`${baseUrl}/earchive/Series`, { headers });
            result.eArchiveSeries = ea.data;
        } catch (e: any) {
            result.eArchiveError = e.response?.data || e.message;
        }

        try {
            const ei = await axios.get(`${baseUrl}/einvoice/Series`, { headers });
            result.eInvoiceSeries = ei.data;
        } catch (e: any) {
            result.eInvoiceError = e.response?.data || e.message;
        }

        return NextResponse.json({
            success: true,
            environment,
            baseUrl,
            ...result
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
