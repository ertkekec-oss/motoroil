import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccountForKasa } from '@/lib/accounting';

export const dynamic = 'force-dynamic';

const DEFAULT_CHART_OF_ACCOUNTS = [
    { code: '100', name: 'KASA HESABI', type: 'Borç', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlık', reportType: 'BILANCO' },
    { code: '102', name: 'BANKALAR HESABI', type: 'Borç', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlık', reportType: 'BILANCO' },
    { code: '108', name: 'DİĞER HAZIR DEĞERLER (POS)', type: 'Borç', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlık', reportType: 'BILANCO' },
    { code: '120', name: 'ALICILAR', type: 'Borç', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlık', reportType: 'BILANCO' },
    { code: '153', name: 'TİCARİ MALLAR', type: 'Borç', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Stoklar', reportType: 'BILANCO' },
    { code: '191', name: 'İNDİRİLECEK KDV', type: 'Borç', accountClass: 'AKTIF', normalBalance: 'BORC', reportGroup: 'Dönen Varlık', reportType: 'BILANCO' },
    { code: '300', name: 'BANKA KREDİLERİ', type: 'Alacak', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynak', reportType: 'BILANCO' },
    { code: '320', name: 'SATICILAR', type: 'Alacak', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Yabancı Kaynak', reportType: 'BILANCO' },
    { code: '360', name: 'ÖDENECEK VERGİ VE FONLAR', type: 'Alacak', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Borç', reportType: 'BILANCO' },
    { code: '391', name: 'HESAPLANAN KDV', type: 'Alacak', accountClass: 'PASIF', normalBalance: 'ALACAK', reportGroup: 'Kısa Vadeli Borç', reportType: 'BILANCO' },
    { code: '500', name: 'SERMAYE', type: 'Alacak', accountClass: 'OZKAYNAK', normalBalance: 'ALACAK', reportGroup: 'Özkaynaklar', reportType: 'BILANCO' },
    { code: '600', name: 'YURT İÇİ SATIŞLAR', type: 'Alacak', accountClass: 'GELIR', normalBalance: 'ALACAK', reportGroup: 'Brüt Satışlar', reportType: 'GELIR_TABLOSU' },
    { code: '621', name: 'SATILAN TİCARİ MALLAR MALİYETİ (-)', type: 'Borç', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Satışların Maliyeti', reportType: 'GELIR_TABLOSU' },
    { code: '770', name: 'GENEL YÖNETİM GİDERLERİ', type: 'Borç', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Faaliyet Giderleri', reportType: 'GELIR_TABLOSU' },
    { code: '780', name: 'FİNANSMAN GİDERLERİ', type: 'Borç', accountClass: 'GIDER', normalBalance: 'BORC', reportGroup: 'Finansman Giderleri', reportType: 'GELIR_TABLOSU' }
];

export async function GET() {
    try {
        // 1. Check if any accounts exist
        const count = await prisma.account.count();

        // 2. If empty or missing new fields, SEED/UPDATE the default chart of accounts
        if (count === 0) {
            console.log("Seeding Default Chart of Accounts...");
            try {
                for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
                    await prisma.account.create({
                        data: {
                            code: acc.code,
                            name: acc.name,
                            type: acc.type,
                            accountClass: acc.accountClass,
                            normalBalance: acc.normalBalance,
                            reportGroup: acc.reportGroup,
                            reportType: acc.reportType,
                            parentCode: null,
                            isActive: true,
                            balance: 0,
                            branch: 'Merkez' // Explicitly set branch
                        }
                    });
                }
            } catch (seedError) {
                console.error("Seeding Error:", seedError);
                // Continue execution
            }
        }

        // 3. (REMOVED REDUNDANT SYNC)
        // Kasa sync is now handled via manual /api/financials/accounts/sync or background tasks

        // 4. Fetch all accounts sorted by code
        console.log('[Accounts API] Fetching all accounts...');
        const accountsRaw = await prisma.account.findMany({
            orderBy: { code: 'asc' }
        });

        // 5. Calculate Correct Balances (TDHP Logic)
        // 5. Calculate Correct Balances (TDHP Logic)
        const accounts = accountsRaw.map(acc => {
            const rawBalance = Number(acc.balance);
            let debitBalance = 0;
            let creditBalance = 0;
            const warnings: string[] = [];

            // Determine orientation
            const accountClass = acc.accountClass || 'DIĞER';
            // Explicit check for known classes or type fallback
            const isDebitOriented =
                acc.accountClass === 'AKTIF' ||
                acc.accountClass === 'GIDER' ||
                (!acc.accountClass && acc.type === 'Borç');

            // --- BALANCE CALCULATION LOGIC (Visual Separation) ---
            if (isDebitOriented) {
                // Asset/Expense: Positive = Debit, Negative = Credit (Reverse)
                if (rawBalance >= 0) {
                    debitBalance = rawBalance;
                    creditBalance = 0;
                } else {
                    debitBalance = 0;
                    creditBalance = Math.abs(rawBalance);
                }
            } else {
                // Liability/Income/Equity: Positive = Credit, Negative = Debit (Reverse)
                if (rawBalance >= 0) {
                    creditBalance = rawBalance;
                    debitBalance = 0;
                } else {
                    creditBalance = 0;
                    debitBalance = Math.abs(rawBalance);
                }
            }

            // --- INTELLIGENT WARNING SYSTEM (LOGIC/RULE BASED) ---

            // 1. KASA (100) - Rule: Must be Debit
            if (acc.code.startsWith('100')) {
                if (creditBalance > 0) {
                    warnings.push('Kasa Negatif – Açıklama Gerekli (Kasada olmayan para harcanmış)');
                }
            }

            // 2. POS (108) - Rule: Must be Debit (Receivable from Bank)
            else if (acc.code.startsWith('108')) {
                if (creditBalance > 0) {
                    warnings.push('POS hesabı alacak bakiye veriyor – Bankaya aktarım / komisyon / ters kayıt kontrol edilmeli');
                }
            }

            // 3. SATICILAR (320) - Rule: Must be Credit (Payable to Supplier)
            else if (acc.code.startsWith('320')) {
                if (debitBalance > 0) {
                    warnings.push('Satıcı borç bakiyesi veriyor – Avans mı? Mahsup bekliyor mu?');
                }
            }

            // 4. GENERIC REVERSE BALANCE CHECK (Applicable to all other meaningful accounts)
            // Skip 391, 191 etc if they have specific behaviors, but generally:
            // Asset/Expense shouldn't likely have Credit Balance (unless returns/adjustments)
            // Liability/Income shouldn't likely have Debit Balance (unless returns/adjustments)
            else {
                if (isDebitOriented && creditBalance > 0) {
                    // e.g. 120 Alicilar having Credit Balance (Customer overpaid) which is valid but noteworthy
                    if (acc.code.startsWith('120')) {
                        warnings.push('Müşteri alacak bakiyesi veriyor (Avans/İade)');
                    } else {
                        warnings.push('Ters Bakiye (Olağandışı)');
                    }
                } else if (!isDebitOriented && debitBalance > 0) {
                    warnings.push('Ters Bakiye (Olağandışı)');
                }
            }

            return {
                ...acc,
                balance: rawBalance, // Keep raw balance for backward compatibility
                rawBalance,
                debitBalance,
                creditBalance,
                warnings
            };
        });

        console.log(`[Accounts API] Found ${accounts.length} accounts.`);

        return NextResponse.json({ success: true, accounts });

    } catch (error: any) {
        console.error("Fetch Accounts Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, name, type, parentCode } = body;

        // Basic validation
        if (!code || !name || !type) {
            return NextResponse.json({ success: false, error: 'Hesap kodu, adı ve tipi zorunludur.' }, { status: 400 });
        }

        // Check uniqueness (code + branch compound unique)
        const existing = await prisma.account.findFirst({
            where: { code, branch: 'Merkez' }
        });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Bu hesap kodu zaten kullanılıyor.' }, { status: 400 });
        }

        const newAccount = await prisma.account.create({
            data: {
                code,
                name,
                type,
                parentCode: parentCode || null,
                balance: 0
            }
        });

        return NextResponse.json({ success: true, account: newAccount });

    } catch (error: any) {
        console.error("Create Account Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
