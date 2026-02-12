import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { BANK_FORM_DEFINITIONS } from '@/services/banking/bank-definitions';
import { BankConnectionService, BankConnectionStatus } from '@/services/banking/bank-connection-service';

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const session = auth.user;

    try {
        const { bankId, integrationMethod, credentials, status } = await request.json();

        if (!bankId || !credentials) {
            return NextResponse.json({ success: false, error: 'Banka ve bilgiler gereklidir.' }, { status: 400 });
        }

        const bankDef = BANK_FORM_DEFINITIONS[bankId];
        if (!bankDef) {
            return NextResponse.json({ success: false, error: 'Banka tanımı bulunamadı.' }, { status: 400 });
        }

        // DYNAMIC VALIDATION: Check for required credentials based on bank policy
        const missing = bankDef.requiredCredentials.filter(key => !credentials[key] || credentials[key].trim() === '');
        if (missing.length > 0) {
            const labels = missing.map(m => bankDef.onboardingFields.find(f => f.key === m)?.label || m);
            return NextResponse.json({
                success: false,
                error: `Eksik zorunlu alanlar: ${labels.join(', ')}`
            }, { status: 400 });
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
        const iban = credentials.iban || 'PENDING';

        const connection = await (prisma as any).bankConnection.upsert({
            where: { iban },
            update: {
                bankId,
                integrationMethod,
                credentialsEncrypted: encryptedData,
                updatedAt: new Date()
            },
            create: {
                companyId: company.id,
                bankName: bankId,
                bankId,
                iban,
                integrationMethod,
                credentialsEncrypted: encryptedData,
                connectionType: 'AUTO_PULL'
            }
        });

        // Use Service for Status Transition
        if (status) {
            await BankConnectionService.updateStatus(connection.id, status as BankConnectionStatus, {
                actorId: session.id,
                reasonCode: 'USER_CONFIGURATION_UPDATE'
            });
        }

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

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const connections = await (prisma as any).bankConnection.findMany({
            where: { companyId: auth.user.companyId },
            select: {
                id: true,
                bankName: true,
                bankId: true,
                iban: true,
                status: true,
                currency: true,
                lastSyncAt: true
            }
        });

        return NextResponse.json({ success: true, connections });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
