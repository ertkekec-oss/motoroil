import prisma from '@/lib/prisma';
import { OtonomYevmiyeMotoru } from './journalEngine';

/**
 * 🛠 Grup Şirketler Arası (Inter-Company) Otonom Muhasebe Köprüsü
 * Bu servis, X şirketi Y şirketine satış faturası kestiğinde (Eğer ikisi de aynı ana gruba bağlıysa veya sistemde kayıtlı kullanıcılarsa),
 * alıcı tarafın (Y şirketi) muhasebesinde otomatik olarak "Alım Faturası" (Yurt İçi Alımlar) ve Cari Borç kaydı oluşturur.
 */
export class InterCompanyBridge {

  /**
   * Satırları ve toplamı olan bir Satış Faturasını, alıcı firmanın "Alım Faturası" olarak klonlar.
   * Tetiklenmesi gereken yer: Satış faturası (Sales Invoice) kalıcı olarak e-fatura/basılı olarak onaylandığında.
   */
  static async mirrorSalesInvoiceToPurchase(params: {
    sourceCompanyId: string; // Faturayı Kesen
    targetTaxNumber: string; // Fatura Kesilenin VKN'si
    invoiceNo: string;
    netAmount: number;
    vatAmount: number;
    totalAmount: number;
    description: string;
    items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  }) {
    // 1. Alıcı firmanın sistemimizde kayıtlı bir şirket olup olmadığını kontrol et.
    const targetCompany = await prisma.company.findFirst({
        where: { taxNumber: params.targetTaxNumber }
    });

    if (!targetCompany) {
        // Alıcı sistemde bizim bir kiracımız (tenant) değil, işlem yapma (normal dış müşteri).
        return { success: false, reason: 'TARGET_NOT_IN_ECOSYSTEM' };
    }

    if (targetCompany.id === params.sourceCompanyId) {
        return { success: false, reason: 'SELF_INVOICING_REJECTED' }; // Kendine fatura kesemez
    }

    // 2. Satan firmanın bilgilerini al (Alıcının cari kartına Satıcı olarak işlemek için)
    const sourceCompany = await prisma.company.findUnique({
        where: { id: params.sourceCompanyId }
    });

    if (!sourceCompany) throw new Error("Source company not found.");

    // Transaction başlatıyoruz. Çünkü alıcı tarafa Fatura + Cari Kart + Muhasebe Fişi ekleyeceğiz.
    return await prisma.$transaction(async (tx) => {
        
        // 3. Alıcı şirketin içinde, Kesen Şirket (Satıcı) adına bir Cari Kart var mı? Yoksa oluştur.
        let vendorAcc = await tx.customer.findFirst({
            where: {
                companyId: targetCompany.id,
                taxNumber: sourceCompany.taxNumber || undefined
            }
        });

        if (!vendorAcc) {
            vendorAcc = await tx.customer.create({
                data: {
                    companyId: targetCompany.id,
                    name: sourceCompany.name,
                    taxNumber: sourceCompany.taxNumber,
                    commercialTitle: sourceCompany.name,
                    type: 'B2B',
                    score: 100
                }
            });
        }

        // 4. Hedef şirkete ALIM FATURASI (Purchase Invoice) yarat.
        const purchaseInvoice = await tx.tradeEnvelope.create({
            data: {
                companyId: targetCompany.id,
                type: 'ESKANTİLLİK_ALIM_FATURASI', // İç iletişim / Group şirket faturası
                status: 'DRAFT',
                title: `Grup İçi Alım: ${params.invoiceNo} - ${sourceCompany.name}`,
                senderId: targetCompany.id,   // Biziz (Alıcı)
                receiverId: vendorAcc.id, // Satan firma (bizim sistemimizde vendorAcc)
                // Detay verisi:
                documentType: 'INVOICE',
                amount: params.totalAmount,
            }
        });

        // 5. Otonom Yevmiye Motoru ile ALIM Yevmiyesi kestir!
        // 153 Ticari Mallar (Borç) / 191 İndirilecek KDV (Borç) / 320 Satıcılar (Alacak)
        await OtonomYevmiyeMotoru.bookPurchaseInvoice({
            companyId: targetCompany.id,
            documentId: purchaseInvoice.id,
            vendorId: vendorAcc.id,
            netAmount: params.netAmount,
            vatAmount: params.vatAmount,
            totalAmount: params.totalAmount
        });

        return { success: true, targetCompanyId: targetCompany.id, purchaseInvoiceId: purchaseInvoice.id };
    });
  }
}
