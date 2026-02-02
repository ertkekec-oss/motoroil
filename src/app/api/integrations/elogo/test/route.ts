
import { NextResponse } from 'next/server';
import { ELogoService } from '@/lib/elogo';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Handle field alias (pass vs password)
        const username = body.username;
        const password = body.password || body.pass;
        const isTest = body.isTest;

        if (!username || !password) {
            return NextResponse.json({
                success: false,
                error: 'Kullanıcı adı ve şifre gereklidir.'
            }, { status: 400 });
        }

        const logoService = new ELogoService({
            username,
            pass: password,
            isTest: !!isTest,
            firmCode: ''
        });

        const result = await logoService.login();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Bağlantı Başarılı!',
                sessionId: result.sessionId,
                endpoint: result.endpoint
            });
        } else {
            console.error('eLogo Login Failed:', { error: result.error, endpoint: result.endpoint });

            // Combine endpoint with debug data for frontend display
            const combinedDebug = `TARGET URL: ${result.endpoint}\n\nSERVER RESPONSE:\n${result.rawData}`;

            return NextResponse.json({
                success: false,
                error: result.error || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.',
                debug: combinedDebug,
                endpoint: result.endpoint
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('eLogo Test Error:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
