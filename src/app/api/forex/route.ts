import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/TRY', {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 } 
        });
        
        if (!response.ok) throw new Error('Failed to fetch from open.er-api');

        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            rates: data.rates 
        });

    } catch (error: any) {
        console.error('Forex proxy fetch error:', error);
        
        // Güvenli katsayılarla yedek kur döndererek Canlı Kur özelliğinin sıfırlanmasını/çökmesini önle.
        return NextResponse.json({
            success: true,
            isFallback: true,
            rates: {
                TRY: 1,
                USD: 0.0284, 
                EUR: 0.0263, 
                GBP: 0.0221  
            }
        });
    }
}
