
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getRequestContext } from '@/lib/api-context';


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
    try {
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
