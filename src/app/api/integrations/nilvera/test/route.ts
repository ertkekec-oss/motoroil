
import { NextResponse } from 'next/server';
import { NilveraService } from '@/lib/nilvera';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { apiKey, username, password, environment, companyVkn } = body;

        if (!apiKey && (!username || !password)) {
            return NextResponse.json({ success: false, error: 'API Key veya Kullanıcı Bilgileri gereklidir.' }, { status: 400 });
        }

        const nilveraService = new NilveraService({
            apiKey,
            username,
            password,
            environment: environment || 'test'
        });

        // Autentikasyon (Login)
        if (username && password) {
            await nilveraService.login();
        }

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
        return NextResponse.json({
            success: false,
            error: error.response?.data?.Message || error.message || 'Bağlantı kurulamadı.'
        }, { status: 401 });
    }
}
