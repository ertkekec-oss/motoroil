import { NextResponse } from 'next/server';
import crypto from 'crypto';

// PayTR Refund (İade) API'si
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { merchantOid, returnAmount, referenceNo } = body;

        const merchant_id = process.env.PAYTR_MERCHANT_ID || 'XXXXXX';
        const merchant_key = process.env.PAYTR_MERCHANT_KEY || 'XXXXXXXXXXXXXXXX';
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT || 'XXXXXXXXXXXXXXXX';
        
        // Return amount must be sent in same format as charge (TL is regular decimals or kurus depending on version, here PayTR refund uses decimals usually, but verify)
        // Hash for Refund:
        const paytr_token = crypto.createHmac('sha256', merchant_key)
            .update(merchant_id + merchantOid + returnAmount + merchant_salt)
            .digest('base64');

        // Here we would POST to PayTR refund API
        // const response = await fetch('https://www.paytr.com/odeme/iade', {
        //    method: 'POST',
        //    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //    body: `merchant_id=${merchant_id}&merchant_oid=${merchantOid}&return_amount=${returnAmount}&paytr_token=${paytr_token}&reference_no=${referenceNo}`
        // });
        
        // const data = await response.json();
        const data = { status: 'success', is_test: 1 }; // Mocked
        
        if (data.status === 'success') {
            console.log(`✅ [PayTR Refund] ${merchantOid} için iade başarılı.`);
            return NextResponse.json({ success: true, message: "İade onaylandı." });
        } else {
            console.error(`❌ [PayTR Refund Fail] ${merchantOid}`);
            return NextResponse.json({ success: false, error: "İade reddedildi." }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
