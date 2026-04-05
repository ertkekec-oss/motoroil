import { NextResponse } from 'next/response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { assignmentId, otp } = body;

        // Gerçek bir sistemde OTP (SMS kodu) doğrulaması Redis'ten vs. yapılır.
        // Demo amaçlı "123456" hariç hata veriyoruz veya direkt onaylıyoruz.
        if (otp !== "123456" && otp !== "000000") {
            return NextResponse.json({ error: 'Hatalı SMS Doğrulama Kodu' }, { status: 400 });
        }

        const assignment = await prisma.assetAssignment.update({
            where: { id: assignmentId },
            data: {
                isSigned: true,
                signatureDocId: `DOC-${Date.now()}` // Mock PDF Belge ID'si
            }
        });

        return NextResponse.json({ success: true, data: assignment });
    } catch (error) {
        console.error('API Error - Sign AssetAssignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
