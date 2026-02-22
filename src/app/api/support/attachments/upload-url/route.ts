import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUploadPresignedUrl } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    try {
        const { fileName, contentType } = await req.json();

        if (!fileName || !contentType) {
            return NextResponse.json({ error: 'Dosya bilgileri eksik' }, { status: 400 });
        }

        const fileId = uuidv4();
        const extension = fileName.split('.').pop();
        const key = `support/attachments/${session.tenantId}/${fileId}.${extension}`;

        const uploadUrl = await getUploadPresignedUrl(key, contentType);

        return NextResponse.json({
            success: true,
            uploadUrl,
            fileKey: key,
            fileId
        });
    } catch (error: any) {
        console.error("Attachment Upload Error:", error);
        return NextResponse.json({ error: 'Yükleme hazırlığı başarısız' }, { status: 500 });
    }
}
