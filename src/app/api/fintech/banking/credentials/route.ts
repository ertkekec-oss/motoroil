import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        const { bankId, integrationMethod, credentials } = await request.json();

        if (!bankId || !credentials) {
            return NextResponse.json({ success: false, error: 'Banka ve bilgiler gereklidir.' }, { status: 400 });
        }

        const company = await prisma.company.findFirst({ where: { tenantId: session.tenantId } });
        if (!company) throw new Error('Company not found');

        // Şifreleri (Kişisel/Gizli Verileri) Şifrele
        const encryptedData: Record<string, string> = {};
        for (const [key, value] of Object.entries(credentials)) {
            if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) {
                encryptedData[key] = encrypt(value as string);
            } else {
                encryptedData[key] = value as string;
            }
        }

        // Find or Update BankConnection
        // BizimHesap modelinde IBAN bazlı bağlantı kurulur. 
        // Eğer seçilen banka için IBAN girilmişse o bağlantıyı güncelleriz.
        const iban = credentials.iban || 'PENDING';

        const connection = await (prisma as any).bankConnection.upsert({
            where: { iban },
            update: {
                bankId,
                integrationMethod,
                credentialsEncrypted: encryptedData,
                status: 'ACTIVE',
                updatedAt: new Date()
            },
            create: {
                companyId: company.id,
                bankName: bankId,
                bankId,
                iban,
                integrationMethod,
                credentialsEncrypted: encryptedData,
                status: 'ACTIVE',
                connectionType: 'AUTO_PULL'
            }
        });

        // Audit Log
        await (prisma as any).fintechAudit.create({
            data: {
                companyId: company.id,
                who: session.id,
                action: 'BANK_CREDENTIALS_UPDATED',
                details: JSON.stringify({ bankId, connectionId: connection.id, iban })
            }
        });

        return NextResponse.json({
            success: true,
            connectionId: connection.id
        });

    } catch (error: any) {
        console.error('Bank Credentials Update Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
