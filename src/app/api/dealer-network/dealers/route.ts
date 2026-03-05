import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // Return empty list as we removed the demo data
    const dummyDealers: any[] = [];
    return NextResponse.json({ data: dummyDealers });
}
