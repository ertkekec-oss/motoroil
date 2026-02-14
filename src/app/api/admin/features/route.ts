
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;

        if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role?.toUpperCase())) {
            const role = session?.role || 'Unknown';
            return NextResponse.json({ error: 'Forbidden', debugRole: role }, { status: 403 });
        }
        // ... (code omitted)
        // ... (code omitted)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const sessionResult: any = await getSession();
        // ... (code omitted)
        // ... (code omitted)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
