import { NextResponse } from 'next/server';
import { MarketplaceServiceFactory } from '@/services/marketplaces';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, config } = body;

        if (!type || !config) {
            return NextResponse.json(
                { success: false, error: 'Eksik parametreler (type ve config gerekli)' },
                { status: 400 }
            );
        }

        console.log(`Testing connection for ${type}...`);

        const service = MarketplaceServiceFactory.createService(type as any, config);
        const isValid = await service.validateConnection();

        if (isValid) {
            return NextResponse.json({
                success: true,
                message: `✅ ${type.toUpperCase()} bağlantısı başarılı!`
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Bağlantı doğrulanmadı. API bilgilerinizi kontrol edin.'
            });
        }

    } catch (error: any) {
        console.error('Marketplace Test Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Sunucu hatası' },
            { status: 500 }
        );
    }
}
