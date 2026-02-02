
import { NextResponse } from 'next/server';
import { NilveraService } from '@/lib/nilvera';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { apiKey, username, password, environment, companyVkn } = body;

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Entegrasyon için API Key zorunludur. Otomatik giriş (Login) servisi yanıt vermediği için lütfen Nilvera Portal üzerinden aldığınız API Key\'i giriniz.' }, { status: 400 });
        }

        const nilveraService = new NilveraService({
            apiKey,
            username, // Opsiyonel, loglama için kalabilir
            password,
            environment: environment || 'test'
        });

        // Login endpointi 404 hatası verdiği için (deprecated) kaldırıldı.
        // API Key ile doğrudan işlem yapılacak.

        // Test connection by checking a VKN (self VKN if provided, otherwise a fixed common one)
        const testVkn = companyVkn || '4840846711'; // Nilvera's own VKN or a dummy
        const result = await nilveraService.checkUser(testVkn);

        // If we get a response (even if user is not e-invoice user), it means the API Key is valid
        // because unauthorized requests would throw 401.

        return NextResponse.json({
            success: true,
            message: 'Nilvera API Bağlantısı Başarılı!',
            isEInvoiceUser: result.isEInvoiceUser
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
