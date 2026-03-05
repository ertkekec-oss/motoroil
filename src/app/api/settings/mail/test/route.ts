import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { authorize } from '@/lib/auth';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'E-posta ve şifre zorunludur' }, { status: 400 });
        }

        const isGmail = email.toLowerCase().includes('gmail.com') || email.toLowerCase().includes('periodya.com');
        const domain = email.split('@')[1];

        const transportOptions: any = {
            host: isGmail ? 'smtp.gmail.com' : (domain ? `smtp.${domain}` : 'smtp.gmail.com'),
            port: isGmail ? 587 : 465,
            secure: !isGmail,
            auth: {
                user: email,
                pass: password.replace(/\s/g, '')
            },
            tls: {
                rejectUnauthorized: false
            }
        };

        if (isGmail) {
            transportOptions.service = 'gmail';
            transportOptions.secure = false;
        }

        const transporter = nodemailer.createTransport(transportOptions);

        // Verify connection
        await transporter.verify();

        return NextResponse.json({ success: true, message: 'Bağlantı başarılı' });
    } catch (error: any) {
        console.error("Mail Test Error:", error);
        return NextResponse.json({ error: error.message || 'Bağlantı sağlanamadı. Lütfen ayarlarınızı kontrol edin.' }, { status: 500 });
    }
}
