
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, terminalId, items } = body;

        console.log(`[Ödeal POS] Payment request for ${amount} TRY on terminal ${terminalId}`);

        // Simulate network delay to device
        await new Promise(resolve => setTimeout(resolve, 3000));

        // In a real scenario, we would call Ödeal API here
        // const odealResponse = await fetch('https://api.odeal.com/v1/pay', { ... });

        // Simulate 95% success rate for the demo
        const isSuccess = Math.random() < 0.95;

        if (isSuccess) {
            return NextResponse.json({
                success: true,
                transactionId: `OD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                authCode: Math.floor(100000 + Math.random() * 900000).toString(),
                receiptNo: Math.floor(1000 + Math.random() * 9000).toString(),
                message: "Ödeme Başarılı. Fiş Kesildi."
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Cihazda işlem kullanıcı tarafından iptal edildi veya limit yetersiz.",
                errorCode: "USER_CANCELLED"
            }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
