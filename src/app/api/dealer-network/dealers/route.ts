import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // Return dummy dealers list for UI testing
    const dummyDealers = [
        { id: 1, dealerName: "Marmara Ana Bayi", taxNumber: "1234567890", status: "Aktif", creditLimit: "500.000 TL" },
        { id: 2, dealerName: "İç Anadolu Dağıtım", taxNumber: "0987654321", status: "Aktif", creditLimit: "1.000.000 TL" }
    ];
    return NextResponse.json({ data: dummyDealers });
}
