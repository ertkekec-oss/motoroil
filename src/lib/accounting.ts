import { prisma as globalPrisma } from './prisma';

// --- TİP TANIMLARI ---
type EntryLine = {
    accountCode: string;
    accountName?: string;
    type: 'Borç' | 'Alacak';
    amount: number;
    description?: string;
    documentType?: string;
    documentNo?: string;
    documentDate?: Date;
    paymentMethod?: string;
};

// --- HESAP PLANIMIZIN SABİTLERİ (TDHP UYUMLU) ---
export const ACCOUNTS = {
    AÇILIŞ: '500',         // Açılış Bilançosu (veya 500 Sermaye geçici)
    KASA: '100',          // Nakit İşlemler
    BANKA: '102',         // Banka Mevduat (TL/YP)
    POS_ALACAK: '108',    // POS Tahsilatları (Bloke bekleyen)
    ALICILAR: '120',      // Müşteri Bakiyeleri
    ALINAN_CEKLER: '101', // Alınan Çekler Portföyü
    VERILEN_CEKLER: '103', // Verilen Çekler (Alacak bakiyesi verir)
    TICARI_MALLAR: '153',
    INDIRILECEK_KDV: '191',
    KREDI_KARTLARI: '300', // İşletmenin Kredi Kartı Borçları
    SATICILAR: '320',      // Tedarikçi Bakiyeleri
    HESAPLANAN_KDV: '391',
    SERMAYE: '500',
    YURT_ICI_SATIS: '600',
    GENEL_GIDER: '770',
    FINANSMAN_GIDER: '780'
};

/**
 * Kasa ID'sine karşılık gelen Muhasebe Hesabını bulur veya oluşturur.
 */
export async function getAccountForKasa(kasaId: string, branch: string = 'Merkez', prismaClient: any = globalPrisma) {
    // 1. Fetch Kasa to get Company ID
    const kasa = await prismaClient.kasa.findUnique({ where: { id: kasaId } });
    if (!kasa) throw new Error(`Kasa bulunamadı: ${kasaId}`);

    // STRICT TENANT ISOLATION
    const companyId = kasa.companyId;

    const existing = await prismaClient.account.findFirst({
        where: { kasaId, branch, companyId } as any
    });
    if (existing) return existing;

    // TDHP'ye göre Ana Grubu belirle
    let parentRoot = ACCOUNTS.KASA;
    let namePrefix = 'KASA';

    if (kasa.type === 'Banka') {
        parentRoot = ACCOUNTS.BANKA;
        namePrefix = 'BANKA';
    } else if (kasa.type === 'POS' || kasa.type === 'Kredi Kartı Tahsilat') {
        parentRoot = ACCOUNTS.POS_ALACAK;
        namePrefix = 'POS';
    } else if (kasa.type === 'Kredi Kartı Borcu' || kasa.type === 'Kredi Kartı') {
        // Eğer işletmenin ödeme yaptığı kart ise 300
        parentRoot = ACCOUNTS.KREDI_KARTLARI;
        namePrefix = 'KK BORÇ';
    }

    const groupCode = `${parentRoot}.01`;
    let groupAccount = await prismaClient.account.findFirst({
        where: { code: groupCode, branch, companyId } as any
    });

    if (!groupAccount) {
        try {
            groupAccount = await prismaClient.account.create({
                data: {
                    companyId,
                    code: groupCode,
                    name: `${namePrefix} HESAPLARI`,
                    parentCode: parentRoot,
                    type: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'Alacak' : 'Borç',
                    accountClass: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'PASIF' : 'AKTIF',
                    normalBalance: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'ALACAK' : 'BORC',
                    reportGroup: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'Kısa Vadeli Yabancı Kaynak' : 'Dönen Varlık',
                    reportType: 'BILANCO',
                    branch
                }
            });
        } catch (e) {
            groupAccount = await prismaClient.account.findFirst({
                where: { code: groupCode, branch, companyId } as any
            });
        }
    }

    let nextSeq = 1;
    let newCode = '';
    let accountToReturn: any = null;

    while (!accountToReturn) {
        const lastChild = await prismaClient.account.findFirst({
            where: { parentCode: groupCode, branch, companyId } as any,
            orderBy: { code: 'desc' }
        });

        if (lastChild) {
            const parts = lastChild.code.split('.');
            const lastNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastNum)) nextSeq = Math.max(nextSeq, lastNum + 1);
        }

        newCode = `${groupCode}.${nextSeq.toString().padStart(3, '0')}`;

        // Check for collision
        const duplicate = await prismaClient.account.findFirst({
            where: { code: newCode, branch, companyId } as any
        });

        if (duplicate) {
            if (duplicate.kasaId === kasaId) {
                accountToReturn = duplicate;
            } else if (!duplicate.kasaId) {
                // Map existing
                accountToReturn = await prismaClient.account.update({
                    where: { id: duplicate.id },
                    data: { kasaId: kasaId }
                });
            } else {
                nextSeq++; // Try next
            }
        } else {
            try {
                accountToReturn = await prismaClient.account.create({
                    data: {
                        companyId,
                        code: newCode,
                        name: `${kasa.name.toUpperCase()}`,
                        parentCode: groupCode,
                        type: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'Alacak' : 'Borç',
                        accountClass: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'PASIF' : 'AKTIF',
                        normalBalance: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'ALACAK' : 'BORC',
                        reportGroup: (parentRoot === ACCOUNTS.KREDI_KARTLARI) ? 'Kısa Vadeli Yabancı Kaynak' : 'Dönen Varlık',
                        reportType: 'BILANCO',
                        kasaId: kasaId,
                        branch
                    }
                });
            } catch (createError: any) {
                if (createError.code === 'P2002') {
                    nextSeq++; // Race condition, try next
                } else {
                    throw createError;
                }
            }
        }
    }

    return accountToReturn;
}

/**
 * Yevmiye Fişi Oluşturur (e-Defter Uyumlu)
 */
export async function createAccountingSlip(params: {
    description: string;
    date?: Date;
    items: EntryLine[];
    sourceType?: string;
    sourceId?: string;
    branch?: string;
    companyId: string; // REQUIRED: Tenant Isolation
}, prismaClient: any = globalPrisma) {
    const { description, date = new Date(), items, sourceType, sourceId, branch = 'Merkez', companyId } = params;

    if (!companyId) throw new Error('Accounting Slip requires companyId for safety.');

    const totalDebt = items.filter(i => i.type === 'Borç').reduce((sum, item) => sum + Number(item.amount), 0);
    const totalCredit = items.filter(i => i.type === 'Alacak').reduce((sum, item) => sum + Number(item.amount), 0);

    if (Math.abs(totalDebt - totalCredit) > 0.05) {
        throw new Error(`Fiş Dengesi Bozuk! B:${totalDebt} A:${totalCredit}`);
    }

    // Müteselsil Fiş No Üretimi
    const prefix = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    // Transactional Lock/Retry for No generation in real scenarios, here simple max+1
    const lastJournal = await prismaClient.journal.findFirst({
        where: { fisNo: { startsWith: prefix }, companyId },
        orderBy: { fisNo: 'desc' }
    });

    let seq = 1;
    if (lastJournal) {
        const lastSeq = parseInt(lastJournal.fisNo.slice(6));
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const fisNo = `${prefix}${seq.toString().padStart(4, '0')}`;

    const preparedItems = [];
    for (const item of items) {
        let account = await prismaClient.account.findFirst({
            where: { code: item.accountCode, branch, companyId } as any
        });

        if (!account) {
            const parts = item.accountCode.split('.');
            const parentCode = parts.length > 1 ? parts.slice(0, -1).join('.') : null;
            const rootCode = parts[0];

            // 1. Try to inherit from parent
            let accClass, normBal, repGrp, repType, oldType;

            if (parentCode) {
                const parent = await prismaClient.account.findFirst({ where: { code: parentCode, branch, companyId } as any }) as any;
                if (parent) {
                    accClass = parent.accountClass;
                    normBal = parent.normalBalance;
                    repGrp = parent.reportGroup;
                    repType = parent.reportType;
                    oldType = parent.type;
                }
            }

            // 2. Fallback to Root Defaults
            if (!accClass) {
                accClass = 'AKTIF'; normBal = 'BORC'; repGrp = 'Dönen Varlık'; repType = 'BILANCO'; oldType = 'Borç';

                if (rootCode.startsWith('3') || rootCode.startsWith('4')) { accClass = 'PASIF'; normBal = 'ALACAK'; repGrp = 'Yabancı Kaynak'; repType = 'BILANCO'; oldType = 'Alacak'; }
                else if (rootCode.startsWith('5')) { accClass = 'OZKAYNAK'; normBal = 'ALACAK'; repGrp = 'Özkaynaklar'; repType = 'BILANCO'; oldType = 'Alacak'; }
                else if (rootCode.startsWith('6')) {
                    const gelmi = ['600', '601', '602', '64', '67'].some(p => rootCode.startsWith(p));
                    accClass = gelmi ? 'GELIR' : 'GIDER';
                    normBal = gelmi ? 'ALACAK' : 'BORC';
                    repGrp = 'Gelir Tablosu';
                    repType = 'GELIR_TABLOSU';
                    oldType = normBal === 'BORC' ? 'Borç' : 'Alacak';
                }
                else if (rootCode.startsWith('7')) { accClass = 'GIDER'; normBal = 'BORC'; repGrp = 'Gelir Tablosu'; repType = 'GELIR_TABLOSU'; oldType = 'Borç'; }
            }

            account = await prismaClient.account.create({
                data: {
                    companyId,
                    code: item.accountCode,
                    name: item.accountName || `Hesap ${item.accountCode}`,
                    type: oldType || (normBal === 'BORC' ? 'Borç' : 'Alacak'),
                    accountClass: accClass,
                    normalBalance: normBal,
                    reportGroup: repGrp,
                    reportType: repType,
                    parentCode,
                    branch
                }
            });
        }

        // Bakiye Güncelleme (Borç+ Alacak-) 
        // Logic: AKTIF/GIDER -> Borç artırır | PASIF/GELIR/OZKAYNAK -> Alacak artırır
        const isDebitOriented = (account as any).accountClass === 'AKTIF' || (account as any).accountClass === 'GIDER';
        const change = isDebitOriented
            ? (item.type === 'Borç' ? item.amount : -item.amount)
            : (item.type === 'Alacak' ? item.amount : -item.amount);

        await prismaClient.account.update({
            where: { id: account.id },
            data: { balance: { increment: change } }
        });

        preparedItems.push({
            accountId: account.id,
            description: item.description || description,
            debt: item.type === 'Borç' ? item.amount : 0,
            credit: item.type === 'Alacak' ? item.amount : 0,
            documentType: item.documentType || 'BANKA_ISLEM',
            documentNo: item.documentNo || fisNo,
            documentDate: item.documentDate || date,
            paymentMethod: item.paymentMethod || (item.type === 'Borç' ? 'BANKA' : 'BORÇ_KAYDI')
        });
    }

    return await prismaClient.journal.create({
        data: {
            companyId,
            fisNo,
            description,
            date,
            totalDebt,
            totalCredit,
            isBalanced: true,
            status: 'Approved',
            sourceType,
            sourceId,
            branch,
            items: { create: preparedItems }
        }
    });
}

/**
 * İşlemden Otomatik Muhasebe Fişi Üretir (Ders Modu-1)
 */
export async function createJournalFromTransaction(trx: any, prismaClient: any = globalPrisma) {
    const items: EntryLine[] = [];
    const amount = Number(trx.amount);
    const branch = trx.branch || 'Merkez';
    const companyId = trx.companyId;

    if (!companyId) {
        console.error('[createJournalFromTransaction] Missing companyId in transaction', trx.id);
        return; // Cannot proceed securely
    }

    // 1. Kasa/Banka Hesabı
    // getAccountForKasa calls findUnique on kasaId, which is safe.
    const mainAcc = trx.kasaId ? await getAccountForKasa(trx.kasaId, branch, prismaClient) : null;
    const mainCode = (mainAcc as any)?.code || ACCOUNTS.KASA + '.01.001';
    const mainName = (mainAcc as any)?.name || 'MERKEZ KASA';

    if (trx.type === 'Collection') { // Tahsilat (Giren)
        items.push({ accountCode: mainCode, accountName: mainName, type: 'Borç', amount, documentType: 'MAKBUZ' });
        items.push({ accountCode: ACCOUNTS.ALICILAR + '.01', accountName: 'ALICILAR', type: 'Alacak', amount, documentType: 'MAKBUZ' });

    } else if (trx.type === 'Payment') { // Ödeme (Çıkan)
        items.push({ accountCode: ACCOUNTS.SATICILAR + '.01', accountName: 'SATICILAR', type: 'Borç', amount, documentType: 'MAKBUZ' });
        items.push({ accountCode: mainCode, accountName: mainName, type: 'Alacak', amount, documentType: 'MAKBUZ' });

    } else if (trx.type === 'Sales') { // Satış
        // Kasa/POS Borçlanıyor
        items.push({ accountCode: mainCode, accountName: mainName, type: 'Borç', amount, documentType: 'FATURA' });

        // Gelir ve KDV Alacaklanıyor (Varsayılan %20, Satış API'den dinamik gelirse daha iyi olur)
        const vatRate = 20;
        const vatAmount = amount - (amount / (1 + vatRate / 100));
        const baseAmount = amount - vatAmount;

        items.push({ accountCode: ACCOUNTS.YURT_ICI_SATIS + '.01', accountName: 'YURT İÇİ SATIŞLAR', type: 'Alacak', amount: baseAmount, documentType: 'FATURA' });
        items.push({ accountCode: ACCOUNTS.HESAPLANAN_KDV + '.01', accountName: 'HESAPLANAN KDV', type: 'Alacak', amount: vatAmount, documentType: 'FATURA' });

    } else if (trx.type === 'Expense') { // Gider
        const isCommission = trx.description?.toLowerCase().includes('komisyon');
        const expenseCode = isCommission ? (ACCOUNTS.FINANSMAN_GIDER + '.01') : (ACCOUNTS.GENEL_GIDER + '.01');
        const expenseName = isCommission ? 'FİNANSMAN GİDERLERİ' : 'GENEL GİDERLER';

        items.push({ accountCode: expenseCode, accountName: expenseName, type: 'Borç', amount, documentType: 'MAKBUZ' });
        items.push({ accountCode: mainCode, accountName: mainName, type: 'Alacak', amount, documentType: 'MAKBUZ' });

    } else if (trx.type === 'Purchase') { // Alış (Stok Girişi)
        // Ticari Mallar Borçlanıyor (Stok artışı)
        items.push({ accountCode: ACCOUNTS.TICARI_MALLAR + '.01', accountName: 'TİCARİ MALLAR', type: 'Borç', amount, documentType: 'FATURA' });

        // Satıcılar Alacaklanıyor (Tedarikçi borcu)
        items.push({ accountCode: ACCOUNTS.SATICILAR + '.01', accountName: 'SATICILAR', type: 'Alacak', amount, documentType: 'FATURA' });

    } else if (trx.type === 'Transfer' && trx.targetKasaId) { // İki Aşamalı POS veya Virman
        const targetAcc = await getAccountForKasa(trx.targetKasaId, branch, prismaClient);

        // Çıkan (Alacak)
        items.push({ accountCode: mainCode, accountName: mainName, type: 'Alacak', amount, documentType: 'BANKA_ISLEM' });
        // Giren (Borç)
        items.push({ accountCode: targetAcc.code, accountName: targetAcc.name, type: 'Borç', amount, documentType: 'BANKA_ISLEM' });
    }

    if (items.length > 0) {
        return createAccountingSlip({
            description: trx.description || `Otom. ${trx.type}`,
            date: trx.date,
            sourceType: 'Transaction',
            sourceId: trx.id,
            branch,
            items,
            companyId
        }, prismaClient) as any;
    }
}

/**
 * Satış Kaydından Dinamik KDV Oranlarıyla Fiş Üretir
 */
export async function createJournalFromSale(order: any, items: any[], kasaId: string, prismaClient: any = globalPrisma) {
    const amount = Number(order.totalAmount);
    const branch = order.branch || 'Merkez';
    const companyId = order.companyId;
    // Assuming order has companyId. If not, this will crash (as desired for safety).

    const acc = await getAccountForKasa(kasaId, branch, prismaClient);

    const entryLines: EntryLine[] = [];

    // Borç tarafı (Kasa / Banka / POS / Cari)
    entryLines.push({
        accountCode: acc.code,
        accountName: acc.name,
        type: 'Borç',
        amount,
        documentType: 'FATURA',
        documentNo: order.orderNumber,
        documentDate: order.orderDate
    });

    // Alacak tarafı (Dinamik KDV Gruplama)
    const vatGroups: Record<number, number> = {};
    let totalBase = 0;

    items.forEach(item => {
        const rate = Number(item.vat || 20);
        const itemTotal = Number(item.price) * Number(item.qty);
        const itemBase = itemTotal / (1 + rate / 100);
        const itemVat = itemTotal - itemBase;

        vatGroups[rate] = (vatGroups[rate] || 0) + itemVat;
        totalBase += itemBase;
    });

    // Ana Satış Hesabı
    entryLines.push({
        accountCode: ACCOUNTS.YURT_ICI_SATIS + '.01',
        accountName: 'YURT İÇİ SATIŞLAR',
        type: 'Alacak',
        amount: totalBase,
        documentType: 'FATURA',
        documentNo: order.orderNumber
    });

    // KDV Hesapları
    Object.entries(vatGroups).forEach(([rate, vatAmt]) => {
        if (vatAmt > 0) {
            entryLines.push({
                accountCode: `${ACCOUNTS.HESAPLANAN_KDV}.${rate.padStart(2, '0')}`,
                accountName: `%${rate} HESAPLANAN KDV`,
                type: 'Alacak',
                amount: vatAmt,
                documentType: 'FATURA',
                documentNo: order.orderNumber
            });
        }
    });

    return createAccountingSlip({
        description: `POS Satışı: ${order.orderNumber} - ${order.customerName}`,
        date: order.orderDate,
        sourceType: 'Order',
        sourceId: order.id,
        branch,
        items: entryLines,
        companyId
    }, prismaClient);
}

/**
 * Mevcut bir yevmiye fişini Ters Kayıt (Storno) ile iptal eder.
 */
export async function stornoJournalEntry(journalId: string, reason: string = 'İşlem İptali', prismaClient: any = globalPrisma) {
    const original = await prismaClient.journal.findUnique({
        where: { id: journalId },
        include: { items: { include: { account: true } } }
    });

    if (!original) return;
    if ((original as any).isReversal) throw new Error('Bu fiş zaten bir ters kayıttır.');

    const companyId = original.companyId;

    const reversalItems: EntryLine[] = original.items.map((item: any) => ({
        accountCode: (item as any).account.code,
        accountName: (item as any).account.name,
        // Borç Alacak yer değiştiriyor (Storno)
        type: (item.debt as any) > 0 ? 'Alacak' : 'Borç',
        amount: (item.debt as any) > 0 ? (item.debt as any) : (item.credit as any),
        description: `STN: ${item.description || (original as any).description}`,
        documentType: (item as any).documentType || undefined,
        documentNo: (item as any).documentNo || undefined,
        paymentMethod: (item as any).paymentMethod || undefined
    }));

    return await createAccountingSlip({
        description: `İPTAL: ${original.fisNo} - ${reason}`,
        date: new Date(),
        sourceType: 'JournalReversal',
        sourceId: original.id,
        branch: original.branch || 'Merkez',
        items: reversalItems,
        companyId: companyId!
    }, prismaClient);
}

/**
 * Mevcut kasa bakiyelerini muhasebe hesaplarıyla senkronize eder.
 * (Bakiyesi olan ama yevmiye kaydı olmayan kasalar için 'Açılış Fişi' oluşturur)
 */
export async function syncKasaBalancesToLedger(branch: string = 'Merkez', companyId: string, prismaClient: any = globalPrisma) {
    if (!companyId) return;

    const kasalar = await prismaClient.kasa.findMany({
        where: { branch, companyId } as any
    });

    for (const kasa of kasalar) {
        const account = await getAccountForKasa(kasa.id, branch, prismaClient);
        const kasaBalance = Number(kasa.balance);
        const accountBalance = (account as any).balance;

        // Fark varsa (ve henüz hiç yevmiye kaydı yoksa veya bakiye tam uyuşmuyorsa)
        if (Math.abs(kasaBalance - accountBalance) > 0.01) {
            const diff = kasaBalance - accountBalance;
            const items: EntryLine[] = [];

            if (diff > 0) {
                // Kasa borçlu (Para girmeli)
                items.push({ accountCode: account.code, accountName: account.name, type: 'Borç', amount: diff });
                items.push({ accountCode: ACCOUNTS.SERMAYE + '.01', accountName: 'SERMAYE / AÇILIŞ', type: 'Alacak', amount: diff });
            } else {
                // Kasa alacaklı (Para çıkmalı - Nadir durum)
                items.push({ accountCode: ACCOUNTS.SERMAYE + '.01', accountName: 'SERMAYE / AÇILIŞ', type: 'Borç', amount: Math.abs(diff) });
                items.push({ accountCode: account.code, accountName: account.name, type: 'Alacak', amount: Math.abs(diff) });
            }

            await createAccountingSlip({
                description: `Bakiye Senkronizasyonu (Açılış/Düzeltme) - ${kasa.name}`,
                date: new Date(),
                sourceType: 'System',
                sourceId: kasa.id,
                branch,
                items,
                companyId
            }, prismaClient);
        }
    }
}

/**
 * Muhasebe sistemini baştan sona onarır:
 * 1. Kasaları senkronize eder.
 * 2. Eksik komisyon fişlerini tamamlar.
 * 3. Hatalı bakiye yönlerini düzeltir.
 */
export async function repairAccounting(branch: string = 'Merkez', companyId: string, prismaClient: any = globalPrisma) {
    // 1. Kasa Bakiyelerini Eşitle (Açılış Fişi)
    await syncKasaBalancesToLedger(branch, companyId, prismaClient);

    // 2. Eksik Komisyon Fişlerini Bul ve Tamamla
    const transactions = await prismaClient.transaction.findMany({
        where: {
            type: 'Expense',
            description: { contains: 'Komisyon', mode: 'insensitive' },
            deletedAt: null,
            branch,
            companyId // Safety
        } as any
    });

    for (const trx of transactions) {
        const journal = await prismaClient.journal.findFirst({
            where: { sourceId: trx.id, sourceType: 'Transaction', companyId }
        });

        if (!journal) {
            console.log(`[Repair] Creating missing journal for: ${trx.description}`);
            await createJournalFromTransaction(trx, prismaClient);
        }
    }

    return { success: true };
}
