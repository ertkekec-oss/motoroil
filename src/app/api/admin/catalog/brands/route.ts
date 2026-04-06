import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    return NextResponse.json([
        { name: 'Apple', approved: true },
        { name: 'Samsung', approved: true },
        { name: 'Xiaomi', approved: true },
        { name: 'Sony', approved: false },
        { name: 'Philips', approved: true },
        { name: 'Dyson', approved: false }
    ]);
}
