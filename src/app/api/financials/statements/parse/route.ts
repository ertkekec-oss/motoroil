
import { NextResponse } from 'next/server';
import { parseStatementPdf } from '@/lib/statement-parser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'Dosya yüklenmedi.' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            // Some browsers might not set type correctly, check extension
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                return NextResponse.json({ success: false, error: 'Sadece PDF dosyaları desteklenir.' }, { status: 400 });
            }
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const transactions = await parseStatementPdf(buffer);

        return NextResponse.json({ success: true, transactions });

    } catch (error) {
        console.error('Statement parse error:', error);
        return NextResponse.json({ success: false, error: 'Ekstre okunamadı.' }, { status: 500 });
    }
}
