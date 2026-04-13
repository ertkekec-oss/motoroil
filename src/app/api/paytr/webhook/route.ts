import { NextResponse } from 'next/server';
import crypto from 'crypto';

// PayTR Webhook (Hayalet Kasiyer - Notification)
export async function POST(request: Request) {
    try {
        const body = await request.formData(); // Webhook typically comes as application/x-www-form-urlencoded
        
        const merchant_oid = body.get('merchant_oid') as string;
        const status = body.get('status') as string;
        const total_amount = body.get('total_amount') as string;
        const hash = body.get('hash') as string;
        const custom_data = body.get('custom_data') as string;

        const merchant_salt = process.env.PAYTR_MERCHANT_SALT || 'XXXXXXXXXXXXXXXX';
        const merchant_key = process.env.PAYTR_MERCHANT_KEY || 'XXXXXXXXXXXXXXXX';

        // 1. Önce HASH doğrulama (Güvenlik)
        const expected_hash = crypto.createHmac('sha256', merchant_key)
            .update(merchant_oid + merchant_salt + status + total_amount)
            .digest('base64');
            
        if (hash !== expected_hash) {
            return NextResponse.json({ error: "PAYTR notification failed: bad hash" }, { status: 400 });
        }

        // 2. İşlem Durumuna Göre Aksiyon (HAYALET KASİYER DEVREDE)
        if (status === 'success') {
            // A TYPE (Yeni Satış/Sipariş) -> Fatura Kesilecek
            // B TYPE (Cari Ödeme) -> Fatura Kesilmeyecek, Makbuz işlenecek
            console.log(`✅ [PayTR Webhook] İşlem Başarılı: ${merchant_oid}, Tutar: ${total_amount}`);
            
            // Gerçek senaryo:
            // 1. Veritabanından (Reconciliation tablosundan) merchant_oid'ye ait işlemi bul.
            // 2. type === 'A' ise Nilvera Draft/SendAPI çağır (E-Arşiv Fatura Kes). Sonra Adisyon masasını kapat.
            // 3. type === 'B' ise Finans Modülünden seçili kasaya parayı giriş yap ve Cariyi alacaklandır.
            
            // Eğer başarıyla işlediysek PayTR sunucusuna OK dönmeliyiz.
            return new NextResponse("OK");
        } else {
            console.log(`❌ [PayTR Webhook] İşlem Başarısız: ${merchant_oid}`);
            // Reddedildi, iade vs işlendi.
            return new NextResponse("OK");
        }

    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
