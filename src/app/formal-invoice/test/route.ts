import { NextResponse } from 'next/server';
import { NilveraService } from '@/lib/nilvera';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { apiKey, username, password, environment, companyVkn, apiUrl } = body;

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Entegrasyon için API Key zorunludur.' }, { status: 400 });
        }

        const nilveraService = new NilveraService({
            apiKey,
            baseUrl: apiUrl,
            environment: environment || 'test'
        });

        const companyInfo = await nilveraService.getCompanyInfo();

        return NextResponse.json({
            success: true,
            message: `Nilvera Bağlantısı Başarılı! Firma: ${companyInfo.Name || 'Bilinmiyor'}`,
            companyInfo
        });

    } catch (error: any) {
        let errorMessage = 'Bağlantı kurulamadı.';
        if (error.response?.data) {
            if (typeof error.response.data === 'string') errorMessage = error.response.data;
            else if (error.response.data.Message) errorMessage = error.response.data.Message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
    }
}
