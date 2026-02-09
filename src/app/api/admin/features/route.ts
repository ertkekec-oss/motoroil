
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Migration: Fix keys to match frontend expectations
        try {
            const oldFinance = await prisma.feature.findUnique({ where: { key: 'finance' } });
            const newAccounting = await prisma.feature.findUnique({ where: { key: 'accounting' } });
            if (oldFinance && !newAccounting) {
                await prisma.feature.update({ where: { key: 'finance' }, data: { key: 'accounting' } });
            }

            const oldEinvoice = await prisma.feature.findUnique({ where: { key: 'einvoice' } });
            const newEInvoice = await prisma.feature.findUnique({ where: { key: 'e_invoice' } });
            if (oldEinvoice && !newEInvoice) {
                await prisma.feature.update({ where: { key: 'einvoice' }, data: { key: 'e_invoice' } });
            }
        } catch (e) {
            console.log('Feature key migration skipped or failed:', e);
        }

        const currentFeatures = [
            { key: 'dashboard', name: 'Gelişmiş Gösterge Paneli', description: 'Tüm finansal ve operasyonel metriklerin anlık özeti.' },
            { key: 'pos', name: 'Hızlı Satış (POS)', description: 'Barkodlu perakende satış, hızlı tahsilat ve bilgi fişi.' },
            { key: 'sales', name: 'Satış Yönetimi', description: 'Satış geçmişi, faturalar ve sipariş yönetimi.' },
            { key: 'inventory', name: 'Stok & Varyant Yönetimi', description: 'Ürün, varyant, kritik stok, barkod ve depo takibi.' },
            { key: 'crm', name: 'Cari & Müşteri Takibi', description: 'Müşteri/Tedarikçi borç-alacak, ekstre ve iletişim yönetimi.' },
            { key: 'accounting', name: 'Finans & Kasa Yönetimi', description: 'Kasa, banka, gelir-gider takibi ve nakit akışı yönetimi.' },
            { key: 'service', name: 'Servis & İş Emirleri', description: 'Araç kabul, iş emri, plaka takibi, parça ve işçilik yönetimi.' },
            { key: 'e_invoice', name: 'E-Dönüşüm (E-Fatura)', description: 'GİB uyumlu E-Fatura ve E-Arşiv fatura entegrasyonu.' },
            { key: 'reporting', name: 'Gelişmiş Raporlama', description: 'Satış, stok, servis, personel ve finansal detay raporları.' },
            { key: 'branch', name: 'Çoklu Şube Yönetimi', description: 'Merkez ve şubeler arası stok transferi ve ortak yönetim.' },
            { key: 'campaign', name: 'Kampanya & Sadakat', description: 'Müşteri puan sistemi, indirim kuponları ve SMS bildirimleri.' }
        ];

        // Sync features (Upsert all)
        for (const feat of currentFeatures) {
            await prisma.feature.upsert({
                where: { key: feat.key },
                update: { name: feat.name, description: feat.description },
                create: feat
            });
        }

        // Return the fresh list
        const features = await prisma.feature.findMany({
            where: {
                key: { in: currentFeatures.map(f => f.key) }
            },
            orderBy: { name: 'asc' }
        });

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
