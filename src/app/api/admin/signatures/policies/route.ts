import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const setting = await prisma.appSettings.findFirst({
            where: { key: 'signature_policies' }
        });

        if (setting && setting.value) {
            return NextResponse.json(setting.value);
        }

        // Return defaults
        return NextResponse.json({
            sequentialDefault: true,
            otpRequiredDefault: false,
            allowExternalSigners: true,
            allowDocumentDownload: true,
            retentionDays: 365,
        });
    } catch (error) {
        console.error('Failed to get signature policies:', error);
        return NextResponse.json({ error: 'Failed to load policies' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure we find the exact existing key if it exists to update it
        const existing = await prisma.appSettings.findFirst({
            where: { key: 'signature_policies' }
        });

        if (existing) {
            await prisma.appSettings.update({
                where: { id: existing.id },
                data: {
                    value: body
                }
            });
        } else {
            const firstCompany = await prisma.company.findFirst();
            if (!firstCompany) {
                return NextResponse.json({ error: 'No company found to bind settings' }, { status: 400 });
            }

            await prisma.appSettings.create({
                data: {
                    key: 'signature_policies',
                    value: body,
                    companyId: firstCompany.id
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save signature policies:', error);
        return NextResponse.json({ error: 'Failed to save policies' }, { status: 500 });
    }
}
