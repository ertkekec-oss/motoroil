import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth';
import { BANK_FORM_DEFINITIONS } from '@/services/banking/bank-definitions';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const { bankId, credentials } = await request.json();

        if (!bankId || !credentials) {
            return NextResponse.json({ success: false, error: 'Banka ve bilgiler gereklidir.' }, { status: 400 });
        }

        const bankDef = BANK_FORM_DEFINITIONS[bankId];
        if (!bankDef) {
            return NextResponse.json({ success: false, error: 'Banka tanımı bulunamadı.' }, { status: 400 });
        }

        // --- LEVEL 1: CONNECTIVITY ---
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const connectivity = {
            status: "PASS" as "PASS" | "FAIL",
            latencyMs: Math.floor(Math.random() * 200) + 50,
            errorCode: null as string | null,
            message: "Sunucu erişilebilir."
        };

        // Simulate IP Whitelist error if customerNo starts with '99'
        if (credentials.customerNo?.startsWith('99')) {
            connectivity.status = "FAIL";
            connectivity.errorCode = "IP_NOT_WHITELISTED";
            connectivity.message = "Bağlantı reddedildi: IP adresiniz banka sisteminde whitelist edilmemiş.";
        }

        // --- LEVEL 2: PERMISSION ---
        await new Promise(resolve => setTimeout(resolve, 800));
        const permission = {
            status: "PASS" as "PASS" | "FAIL",
            errorCode: null as string | null,
            message: "Yetkilendirme başarılı."
        };

        // Bank specific validation rules
        if (connectivity.status === "PASS") {
            if (bankId === 'KUVEYT_TURK') {
                // Kuveyt Turk only needs customerNo for success in this simulation
                if (!credentials.customerNo || credentials.customerNo.length < 3) {
                    permission.status = "FAIL";
                    permission.errorCode = "AUTH_FAILED";
                    permission.message = "Müşteri numarası geçersiz.";
                }
            } else {
                // Other banks need user/pass
                if (!credentials.serviceUsername || !credentials.servicePassword) {
                    permission.status = "FAIL";
                    permission.errorCode = "AUTH_FAILED";
                    permission.message = "Api Kullanıcı Adı veya Şifre eksik.";
                } else if (credentials.servicePassword === 'wrong') {
                    permission.status = "FAIL";
                    permission.errorCode = "AUTH_FAILED";
                    permission.message = "Hatalı şifre veya kullanıcı adı.";
                }
            }
        } else {
            permission.status = "FAIL";
            permission.errorCode = "UNKNOWN";
            permission.message = "Bağlantı sağlanamadığı için yetki testi yapılamadı.";
        }

        // Recommended Status logic
        let recommendedStatus = "ERROR";
        if (connectivity.status === "PASS" && permission.status === "PASS") {
            recommendedStatus = "ACTIVE";
        } else if (connectivity.status === "FAIL" && connectivity.errorCode === "IP_NOT_WHITELISTED") {
            recommendedStatus = "PENDING_ACTIVATION";
        } else if (permission.errorCode === "AUTH_FAILED") {
            recommendedStatus = "EXPIRED";
        }

        return NextResponse.json({
            success: true,
            connectivity,
            permission,
            recommendedStatus
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
