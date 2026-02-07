
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const features = await prisma.feature.findMany({
            orderBy: { name: 'asc' }
        });

        // Initialize features if empty (seed)
        if (features.length === 0) {
            const defaultFeatures = [
                { key: 'einvoice', name: 'E-Fatura & E-Arşiv Entegrasyonu', description: 'Nilvera ve diğer entegratörler üzerinden fatura gönderimi.' },
                { key: 'pos', name: 'Hızlı Satış (POS) Ekranı', description: 'Perakende satış ve fiş kesme ekranı.' },
                { key: 'crm', name: 'CRM & Müşteri Yönetimi', description: 'Müşteri takibi, borç/alacak ve randevu sistemi.' },
                { key: 'inventory', name: 'Stok & Depo Yönetimi', description: 'Ürün takibi, kritik stok uyarıları ve transferler.' },
                { key: 'accounting', name: 'Resmi Muhasebe', description: 'Yevmiye fişleri, mizan ve mali tablolar.' },
                { key: 'reporting', name: 'Gelişmiş Raporlama', description: 'Kâr/zarar, satış analizleri ve personel performansı.' },
                { key: 'sms', name: 'SMS & WhatsApp Bildirimleri', description: 'Bakım ve kampanya bildirimleri.' },
                { key: 'mobile', name: 'Mobil Uygulama Erişimi', description: 'Sistemi mobil cihazlardan tam yetkiyle kullanma.' }
            ];

            await prisma.feature.createMany({
                data: defaultFeatures
            });

            return NextResponse.json(defaultFeatures);
        }

        return NextResponse.json(features);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { key, name, description } = body;

        if (!key || !name) {
            return NextResponse.json({ error: 'Key ve isim zorunludur' }, { status: 400 });
        }

        const feature = await prisma.feature.create({
            data: { key, name, description }
        });

        return NextResponse.json({ success: true, feature });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
