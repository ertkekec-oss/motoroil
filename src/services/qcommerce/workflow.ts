import prisma from '@/lib/prisma';
import { OtonomYevmiyeMotoru } from '@/services/finance/journalEngine';

export type QOrderState = 'NEW' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

/**
 * 🛠 Periodya Q-Commerce Orchestrator
 * Restoran KDS (Kitchen Display), Kurye Panosu ve Canlı Müşteri takip sisteminin kalbi.
 * Çarkların sekteye uğramadan dönmesini sağlayan veritabanı merkezi.
 */
export class QCommerceWorkflow {

  /**
   * 1. Müşteri QR Menüden Sipariş Verip Ödemeyi (PayTR/Stripe) Tamamladığında TETİKLENİR!
   * - Siparişi "NEW" olarak KDS'ye düşürür.
   * - Otomatik Satış Faturasını / E-Adisyonu açar.
   * - Otonom yevmiye kaydını oluşturur.
   */
  static async onPaymentReceivedCreateOrder(params: {
    companyId: string;
    customerName: string;
    items: { productId: string; name: string; quantity: number; unitPrice: number }[];
    totalAmount: number;
    deliveryAddress?: string;
    note?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
        // Mocking order creation, ideally using MarketplaceOrder or direct POS model.
        // For Periodya, let's assume we create a generic 'TradeEnvelope' as an ORDER.
        const order = await tx.tradeEnvelope.create({
            data: {
                companyId: params.companyId,
                type: 'Q_COMMERCE_ORDER',
                status: 'NEW', // KDS: "Bekleyen Siparişler"
                title: `[Q-Menu] ${params.customerName} - ${params.totalAmount} ₺`,
                amount: params.totalAmount,
                documentType: 'INVOICE',
                senderId: params.companyId, // Self
                receiverId: params.companyId, // Guest customer
            }
        });

        // Muhasebeleştirme (Peşin/Kredi Kartı)
        await OtonomYevmiyeMotoru.bookCashSale({
            companyId: params.companyId,
            documentId: order.id,
            netAmount: params.totalAmount * 0.90, // KDV düştüğü varsayımıyla net %10 indirimli
            vatAmount: params.totalAmount * 0.10,
            totalAmount: params.totalAmount,
            method: 'CREDIT_CARD', // Online ödeme
            date: new Date()
        });

        // Burada (idealde Pusher.js veya Supabase Realtime üzerinden) mutfağa "DİNG!" sesi yollanabilir.
        return order;
    });
  }

  /**
   * 2. Mutfakta Usta (KDS) "Hazırla" Düğmesine Bastığında TETİKLENİR!
   */
  static async setPreparing(orderId: string) {
    const order = await prisma.tradeEnvelope.update({
        where: { id: orderId },
        data: { status: 'PREPARING' } // Müşteri İzleme Ekranı: "Aşçımız Hazırlıyor"
    });
    return order;
  }

  /**
   * 3. Mutfakta İş Bitti! Usta "Hazır" Dediğinde TETİKLENİR!
   */
  static async setReadyForCourier(orderId: string) {
      const order = await prisma.tradeEnvelope.update({
          where: { id: orderId },
          data: { status: 'READY' } // Kurye Dispatch Panosu (Courier Workspace): "Paket Teslimat Bekliyor"
      });
      // SMS API'sine tetik: "Siparişiniz yola çıkmak üzere kurye bekliyor."
      return order;
  }

  /**
   * 4. Dispatch Panosundan Kuryeye Atandığında ve Kurye "Aldım" dediğinde TETİKLENİR!
   */
  static async dispatchOrder(orderId: string, courierId: string) {
      const order = await prisma.tradeEnvelope.update({
          where: { id: orderId },
          data: { 
              status: 'DISPATCHED', // Kurye PWA'sı: "Müşteriye Doğru Yoldasın"
              // courierId: courierId (Eğer schema'da varsa)
          } 
      });
      // Müşteri ekranı (Live Tracking): GPS Canlı Harita Aktif.
      return order;
  }

  /**
   * 5. Kurye Adrese Varıp "Teslim Ettim" Düğmesine Bastığında TETİKLENİR!
   */
  static async setDelivered(orderId: string) {
      const order = await prisma.tradeEnvelope.update({
          where: { id: orderId },
          data: { status: 'DELIVERED' }
      });
      // E-Arşiv / E-Fatura kuyruğuna (UBL Generation) yolla!
      return order;
  }
}
