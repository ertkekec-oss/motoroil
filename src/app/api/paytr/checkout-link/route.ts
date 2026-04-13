import { NextResponse } from 'next/server';
import crypto from 'crypto';

// PayTR Link & Token Generation (A Tipi / B Tipi Ayrımı ile)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            amount, 
            customerName, 
            customerEmail, 
            customerPhone, 
            customerAddress, 
            linkType, // 'A' (Yeni Satış/Sipariş) veya 'B' (Cari Borç/Açık Hesap Tahsilatı)
            referenceId, // Sipariş ID veya Fatura ID
            merchantOid // Benzersiz sipariş/takip numarası (UUID vs)
        } = body;

        // PayTR Credentials (Gerçek ortamda ENV'den alınmalı)
        const merchant_id = process.env.PAYTR_MERCHANT_ID || 'XXXXXX';
        const merchant_key = process.env.PAYTR_MERCHANT_KEY || 'XXXXXXXXXXXXXXXX';
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT || 'XXXXXXXXXXXXXXXX';
        
        // Sepet İçeriği (Test)
        // A Tipi ise faturadaki ürünler, B Tipi ise sadece "Cari Hesap Tahsilatı"
        const basket = linkType === 'A' 
            ? [[`Sipariş Tahsilatı (${referenceId})`, amount, 1]] 
            : [["Cari Hesap Borç Tahsilatı", amount, 1]];

        const user_basket = Buffer.from(JSON.stringify(basket)).toString('base64');
        const user_ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const payment_amount = amount * 100; // Kuruş cinsinden

        const merchant_ok_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`;
        const merchant_fail_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/failed`;
        
        const timeout_limit = "30";
        const no_installment = "0"; // Taksit izni ver
        const max_installment = "12";
        const currency = "TL";
        const test_mode = "1"; // Test ortamı

        // Hash Data Oluşturma
        const hash_str = merchant_id + user_ip + merchantOid + customerEmail + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
        
        // HMAC SHA256
        const paytr_token = crypto.createHmac('sha256', merchant_key).update(hash_str + merchant_salt).digest('base64');

        // Buralarda Periodya Veritabanına "Bekleyen İşlem" (Reconciliation Table) kaydı atılmalı:
        // prisma.reconciliation.create({ targetId: referenceId, amount: amount, type: linkType, status: 'PENDING' })

        return NextResponse.json({
            success: true,
            token: paytr_token,
            linkType: linkType,
            message: "PayTR Checkout Token / Link Generated.",
            // Gerçek uygulamada paytr'ye post atıp iframe linki veya iframe tokenı dönülür.
            demoLink: `https://www.paytr.com/odeme/api/${paytr_token}`
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
