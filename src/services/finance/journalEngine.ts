import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createAccountingSlip } from '@/lib/accounting';

export interface JournalLineInput {
  accountCode: string;
  debit: number | Prisma.Decimal;
  credit: number | Prisma.Decimal;
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

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    const safeLines = input.lines.map(line => {
      const d = new Prisma.Decimal(line.debit || 0);
      const c = new Prisma.Decimal(line.credit || 0);

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

    return await createAccountingSlip({
        description: input.description,
        date: input.date || new Date(),
        sourceType: "OtonomYevmiyeMotoru",
        sourceId: input.sourceEventId || `AUTO-${Date.now()}`,
        companyId: input.companyId,
        items: safeLines.map(sl => {
            const isDebit = sl.debit.greaterThan(0);
            return {
                accountCode: sl.accountCode,
                type: isDebit ? 'Borç' : 'Alacak',
                amount: isDebit ? sl.debit.toNumber() : sl.credit.toNumber(),
                description: input.description,
                documentNo: sl.externalReference,
                documentType: 'Otonom'
            };
        })
    });
  }

  /**
   * Şablon 1: Satış Faturası Şablonu (120, 600, 391, 360)
   */
  static async bookSalesInvoice(params: {
      companyId: string,
      invoiceId: string,
      invoiceNo: string,
      customerName: string,
      netAmount: number, // Mal/Hizmet Bedeli
      vatAmount: number, // KDV Tutarı
      otvAmount?: number, // ÖTV Tutarı
      oivAmount?: number, // OİV Tutarı
      totalAmount: number, // Fatura Dip Toplam (Müşterinin ödeyeceği)
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

      // 360.01 - Ödenecek ÖTV
      if (params.otvAmount && params.otvAmount > 0) {
          lines.push({ accountCode: "360.01", debit: 0, credit: params.otvAmount, externalReference: params.invoiceId });
      }

      // 360.02 - Ödenecek OİV
      if (params.oivAmount && params.oivAmount > 0) {
          lines.push({ accountCode: "360.02", debit: 0, credit: params.oivAmount, externalReference: params.invoiceId });
      }

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
      otvAmount?: number,
      oivAmount?: number,
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

      if (params.otvAmount && params.otvAmount > 0) {
          lines.push({ accountCode: "360.01", debit: 0, credit: params.otvAmount, externalReference: params.documentId });
      }
      if (params.oivAmount && params.oivAmount > 0) {
          lines.push({ accountCode: "360.02", debit: 0, credit: params.oivAmount, externalReference: params.documentId });
      }

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

  static async bookPurchaseInvoice(params: {
    companyId: string;
    documentId: string;
    netAmount: number;
    vatAmount: number;
    otvAmount?: number;
    oivAmount?: number;
    totalAmount: number;
    vendorId: string;
  }) {
    const lines: JournalLineInput[] = [];

    // 153 Ticari Mallar / veya 770 Genel Yönetim Giderleri (Varsayılan 153 alım)
    lines.push({ accountCode: '153.01', debit: params.netAmount, credit: 0, externalReference: params.documentId });
    
    // 191 İndirilecek KDV
    if (params.vatAmount > 0) {
      lines.push({ accountCode: '191.01', debit: params.vatAmount, credit: 0, externalReference: params.documentId });
    }
    
    const oiv = params.oivAmount || 0;
    const otv = params.otvAmount || 0;
    if (oiv > 0) lines.push({ accountCode: '770.99', debit: oiv, credit: 0, externalReference: params.documentId });
    if (otv > 0) lines.push({ accountCode: '153.02', debit: otv, credit: 0, externalReference: params.documentId });

    // 320 Satıcılar
    lines.push({ accountCode: '320.01', debit: 0, credit: params.totalAmount, externalReference: params.vendorId });

    return this.bookEntry({
      companyId: params.companyId,
      sourceEventId: `PURCHASE-${params.documentId}`,
      description: `Alım Faturası: ${params.documentId}`,
      lines
    });
  }

  static async bookExpense(params: {
    companyId: string;
    expenseId: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK' | 'CREDIT_CARD';
    description: string;
  }) {
    const lines: JournalLineInput[] = [];
    
    // Yüzey masraflar, fatura vs (Basit Nakit/Kredi masraf çikişları) -> 770
    lines.push({ accountCode: '770.01', debit: params.amount, credit: 0, externalReference: params.expenseId });

    // Çıkış (Alacak) Hesapları
    if (params.paymentMethod === 'CASH') {
      lines.push({ accountCode: '100.01', debit: 0, credit: params.amount, externalReference: params.expenseId });
    } else if (params.paymentMethod === 'BANK') {
      lines.push({ accountCode: '102.01', debit: 0, credit: params.amount, externalReference: params.expenseId });
    } else if (params.paymentMethod === 'CREDIT_CARD') {
      lines.push({ accountCode: '300.01', debit: 0, credit: params.amount, externalReference: params.expenseId });
    }

    return this.bookEntry({
      companyId: params.companyId,
      sourceEventId: `EXPENSE-${params.expenseId}`,
      description: `Gider Kaydı: ${params.description}`,
      lines
    });
  }

  static async bookPayroll(params: {
    companyId: string;
    payrollId: string;
    grossSalary: number;
    advancePayment: number;
    taxes: number;
    netToPay: number;
    month: string;
  }) {
    const lines: JournalLineInput[] = [];

    // Brüt Maaş Gideri (Borç)
    lines.push({ accountCode: '770.10', debit: params.grossSalary, credit: 0, externalReference: params.payrollId });

    // Ödenen Avanslardan Düş (Personelden Alacaklı olduğumuz tutar)
    if (params.advancePayment > 0) {
      lines.push({ accountCode: '196.01', debit: 0, credit: params.advancePayment, externalReference: params.payrollId });
    }

    // Kesintiler / Vergiler (Ödenecek)
    if (params.taxes > 0) {
      lines.push({ accountCode: '360.10', debit: 0, credit: params.taxes, externalReference: params.payrollId });
    }

    // Personele Kalan Net Ödenecek (Pasif - Borçlar)
    lines.push({ accountCode: '335.01', debit: 0, credit: params.netToPay, externalReference: params.payrollId });

    return this.bookEntry({
      companyId: params.companyId,
      sourceEventId: `PAYROLL-${params.payrollId}`,
      description: `${params.month} Personel Bordro Tahakkuku`,
      lines
    });
  }

  static async bookSalesReturn(params: {
      companyId: string;
      documentId: string;
      netAmount: number;
      vatAmount: number;
      totalAmount: number;
  }) {
      const lines: JournalLineInput[] = [];
      // Satıştan İadeler -> 610
      lines.push({ accountCode: '610.01', debit: params.netAmount, credit: 0, externalReference: params.documentId });
      // İndirilecek KDV
      lines.push({ accountCode: '191.02', debit: params.vatAmount, credit: 0, externalReference: params.documentId });
      // 120 Cariden Düşülür (Alacak)
      lines.push({ accountCode: '120.01', debit: 0, credit: params.totalAmount, externalReference: params.documentId });

      return this.bookEntry({
          companyId: params.companyId,
          sourceEventId: `RETURN-${params.documentId}`,
          description: `Satış İade Faturası: ${params.documentId}`,
          lines
      });
  }
}
