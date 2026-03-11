import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';

export async function GET(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        // Assuming admin access means user exists, could add role check here
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const requirements = await prisma.platformRequirement.findMany({
            include: { contract: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, requirements });
    } catch (error: any) {
        console.error('Fetch requirements error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, role } = await getRequestContext(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { moduleId, name, description, type, contractId, validityMonths, isActive } = data;

        const requirement = await prisma.platformRequirement.create({
            data: {
                moduleId,
                name,
                description,
                type: type || 'DOCUMENT',
                contractId: type === 'CONTRACT' ? contractId : null,
                validityMonths: validityMonths ? parseInt(validityMonths) : null,
                isActive: isActive ?? true
            }
        });

        return NextResponse.json({ success: true, requirement });
    } catch (error: any) {
        console.error('Create requirement error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
