
import { NextResponse } from 'next/server';
import { NilveraService } from '@/lib/nilvera';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { apiKey, username, password, environment, companyVkn, apiUrl } = body;

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Entegrasyon için API Key zorunludur. Otomatik giriş (Login) servisi yanıt vermediği için lütfen Nilvera Portal üzerinden aldığınız API Key\'i giriniz.' }, { status: 400 });
        }

        const nilveraService = new NilveraService({
            apiKey,
            baseUrl: apiUrl,
            username, // Opsiyonel, loglama için kalabilir
            password,
            environment: environment || 'test'
        });

        // Login endpointi 404 hatası verdiği için (deprecated) kaldırıldı.
        // API Key ile doğrudan işlem yapılacak.

        // Test connection by fetching Company Info (no VKN required)
        // This is more reliable than checking a VKN which might not exist
        const companyInfo = await nilveraService.getCompanyInfo();

        return NextResponse.json({
            success: true,
            message: `Nilvera Bağlantısı Başarılı! Firma: ${companyInfo.Name || 'Bilinmiyor'}`,
            companyInfo
        });

    } catch (error: any) {
        console.error('Nilvera Test Error:', error);

        let errorMessage = 'Bağlantı kurulamadı.';
        if (error.response?.data) {
            if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.Message) {
                errorMessage = error.response.data.Message;
                if (error.response.data.Detail) errorMessage += ` (${error.response.data.Detail})`;
            } else {
                errorMessage = JSON.stringify(error.response.data);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 401 });
    }
}
