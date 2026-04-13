import prisma from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export interface JournalLineInput {
  accountCode: string;
  debit: number | Decimal;
  credit: number | Decimal;
  externalReference?: string;
}

export interface JournalEntryInput {
  companyId: string;
  sourceEventId?: string;
  description: string;
  date?: Date;
  lines: JournalLineInput[];
  createdBy?: string;
}

/**
 * 🛠 Otonom Yevmiye Motoru
 * Bu sınıf tüm finansal hareketlerin çift taraflı kayıt (TDHP) kuralına
 * göre JournalEntry modeline şaşmaz bir denge ile yazılmasını garantiler.
 */
export class OtonomYevmiyeMotoru {

  /**
   * Çekirdek Fiş Oluşturucu:
   * Verilen satırların borç ve alacak toplamlarının eşit olmasını (Denge) denetleyerek
   * veritabanına transaction ile kaydeder.
   */
  static async bookEntry(input: JournalEntryInput) {
    if (!input.lines || input.lines.length === 0) {
      throw new Error("Yevmiye fişi en az 2 satır (Borç/Alacak) içermelidir.");
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const safeLines = input.lines.map(line => {
      const d = new Decimal(line.debit || 0);
      const c = new Decimal(line.credit || 0);

      if (d.lessThan(0) || c.lessThan(0)) {
        throw new Error("Borç/Alacak tutarları negatif olamaz.");
      }

      totalDebit = totalDebit.plus(d);
      totalCredit = totalCredit.plus(c);

      return {
        accountCode: line.accountCode,
        debit: d,
        credit: c,
        externalReference: line.externalReference,
        companyId: input.companyId
      };
    });

    // 1 Kuruş toleransı ile denge kontrolü
    const difference = totalDebit.minus(totalCredit).abs();
    if (difference.greaterThan(0.01)) {
      throw new Error(
        `Yevmiye fişi DENGESİZ! Toplam Borç: ${totalDebit.toFixed(2)}, Toplam Alacak: ${totalCredit.toFixed(2)} (Fark: ${difference.toFixed(2)})`
      );
    }

    return await prisma.$transaction(async (tx) => {
        // Idempotency (Aynı event'e iki kez fiş kesilmesini engelle)
        if (input.sourceEventId) {
           const existing = await (tx as any).journalEntry.findUnique({
               where: { sourceEventId: input.sourceEventId }
           });
           if (existing) {
               console.warn(`[JournalEngine] Event ${input.sourceEventId} zaten muhasebeleştirilmiş. İşlem atlanıyor.`);
               return existing;
           }
        }

        const entry = await (tx as any).journalEntry.create({
            data: {
                companyId: input.companyId,
                sourceEventId: input.sourceEventId, // Örn: Fatura ID veya Tahsilat ID
                description: input.description,
                date: input.date || new Date(),
                createdBy: input.createdBy,
                lines: {
                    create: safeLines.map(sl => ({
                        accountCode: sl.accountCode,
                        debit: sl.debit,
                        credit: sl.credit,
                        externalReference: sl.externalReference,
                        companyId: input.companyId
                    }))
                }
            },
            include: { lines: true }
        });

        console.log(`[JournalEngine] Yevmiye Fişi Oluşturuldu: #${entry.entryNumber} (${input.description})`);
        return entry;
    });
  }

  /**
   * Şablon 1: Satış Faturası Şablonu (120, 600, 391)
   */
  static async bookSalesInvoice(params: {
      companyId: string,
      invoiceId: string,
      invoiceNo: string,
      customerName: string,
      netAmount: number,
      vatAmount: number,
      totalAmount: number,
      date?: Date
  }) {
      const isExport = params.vatAmount === 0; // Çok basit bir %0 KDV varsayımı.
      const incomeAccount = isExport ? "601.01" : "600.01";

      const lines: JournalLineInput[] = [
          // 120 - Alıcılar (Müşteri)
          { accountCode: "120.01", debit: params.totalAmount, credit: 0, externalReference: params.invoiceId },
          // 600 - Yurt İçi Satışlar
          { accountCode: incomeAccount, debit: 0, credit: params.netAmount, externalReference: params.invoiceId }
      ];

      // 391 - Hesaplanan KDV
      if (params.vatAmount > 0) {
          lines.push({ accountCode: "391.01", debit: 0, credit: params.vatAmount, externalReference: params.invoiceId });
      }

      return await this.bookEntry({
          companyId: params.companyId,
          sourceEventId: `INV_${params.invoiceId}`,
          description: `Satış Faturası: ${params.invoiceNo} - ${params.customerName}`,
          date: params.date,
          lines: lines
      });
  }

  /**
   * Şablon 2: Tahsilat Şablonu (102 Banka -> 120 Cari)
   */
  static async bookCollection(params: {
      companyId: string,
      paymentId: string,
      customerName: string,
      amount: number,
      method: 'CASH' | 'CREDIT_CARD' | 'TRANSFER',
      date?: Date
  }) {
      let debitAccount = "102.01"; // Bankalar
      
      if (params.method === 'CASH') debitAccount = "100.01"; // Kasa
      else if (params.method === 'CREDIT_CARD') debitAccount = "108.01"; // Hazır Değerler / Yoldaki Kredi Kartı Posları

      const lines: JournalLineInput[] = [
          { accountCode: debitAccount, debit: params.amount, credit: 0, externalReference: params.paymentId },
          { accountCode: "120.01", debit: 0, credit: params.amount, externalReference: params.paymentId }
      ];

      return await this.bookEntry({
          companyId: params.companyId,
          sourceEventId: `PAY_${params.paymentId}`,
          description: `Tahsilat İşlemi: ${params.customerName} - ${params.method}`,
          date: params.date,
          lines: lines
      });
  }

  /**
   * Şablon 3: Peşin Adisyon/POS Satışı Tek Adımda Kapatma
   */
  static async bookCashSale(params: {
      companyId: string,
      documentId: string,
      netAmount: number,
      vatAmount: number,
      totalAmount: number,
      method: 'CASH' | 'CREDIT_CARD',
      tableNo?: string,
      date?: Date
  }) {
      let debitAccount = params.method === 'CASH' ? "100.01" : "108.01";

      const lines: JournalLineInput[] = [
          // Nakit/Kredi Kartı Girişi
          { accountCode: debitAccount, debit: params.totalAmount, credit: 0, externalReference: params.documentId },
          // 600 Satış
          { accountCode: "600.01", debit: 0, credit: params.netAmount, externalReference: params.documentId }
      ];

      if (params.vatAmount > 0) {
          lines.push({ accountCode: "391.01", debit: 0, credit: params.vatAmount, externalReference: params.documentId });
      }

      return await this.bookEntry({
          companyId: params.companyId,
          sourceEventId: `CASH_SALE_${params.documentId}`,
          description: `Peşin Satış: ${params.tableNo ? 'Masa: ' + params.tableNo : 'Hızlı POS'}`,
          date: params.date,
          lines: lines
      });
  }
}
