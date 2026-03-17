import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    const param = await prisma.payrollParameter.findUnique({
      where: {
        periodYear: year,
      }
    });

    return NextResponse.json(param || {});
  } catch (error) {
    console.error('Error fetching payroll parameters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authorize();
    if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = auth.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { periodYear, sgkFloor, sgkCeiling, stampTaxRate, incomeTaxBrackets } = data;

    if (!periodYear || !sgkFloor || !sgkCeiling) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const param = await prisma.payrollParameter.upsert({
      where: {
        periodYear: parseInt(periodYear, 10),
      },
      update: {
        sgkFloor,
        sgkCeiling,
        stampTaxRate,
        incomeTaxBrackets: incomeTaxBrackets || [],
      },
      create: {
        periodYear: parseInt(periodYear, 10),
        sgkFloor,
        sgkCeiling,
        stampTaxRate,
        incomeTaxBrackets: incomeTaxBrackets || [],
      }
    });

    return NextResponse.json(param);
  } catch (error) {
    console.error('Error saving payroll parameters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
