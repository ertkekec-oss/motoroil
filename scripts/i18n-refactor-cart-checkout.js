const fs = require('fs');

function refactorCart() {
    let file = fs.readFileSync('src/components/terminal/CartTable.tsx', 'utf8');

    if (!file.includes('const { t } = useLanguage()')) {
        file = file.replace("import { ShoppingCart, Minus, Plus, X } from 'lucide-react';", "import { ShoppingCart, Minus, Plus, X } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';");
        file = file.replace("export default function CartTable({ cart, setCart, getPrice }: { cart: any[], setCart: any, getPrice: (p: any) => number }) {", "export default function CartTable({ cart, setCart, getPrice }: { cart: any[], setCart: any, getPrice: (p: any) => number }) {\n    const { t } = useLanguage();");
    }

    const replacements = [
        [">Sepet Boş<", ">{t('cart.empty')}<"],
        [">Ürün okutarak veya arayarak ekleyin<", ">{t('cart.emptyDesc')}<"],
        [">Ürün<", ">{t('cart.product')}<"],
        [">Birim Fiyat<", ">{t('cart.unitPrice')}<"],
        [">Adet<", ">{t('cart.qty')}<"],
        [">Ara Toplam<", ">{t('cart.subtotal')}<"],
        [">Sil<", ">{t('cart.delete')}<"]
    ];

    for (const [search, replace] of replacements) {
        file = file.replaceAll(search, replace);
    }

    fs.writeFileSync('src/components/terminal/CartTable.tsx', file);
    console.log('CartTable i18n applied!');
}

function refactorCheckout() {
    let file = fs.readFileSync('src/components/terminal/CheckoutPanel.tsx', 'utf8');

    if (!file.includes('const { t } = useLanguage()')) {
        file = file.replace("import { CreditCard, Banknote, Landmark, ArrowRight, User, Clock, Gift } from 'lucide-react';", "import { CreditCard, Banknote, Landmark, ArrowRight, User, Clock, Gift } from 'lucide-react';\nimport { useLanguage } from '@/contexts/LanguageContext';");
        file = file.replace("}: any) {", "}: any) {\n    const { t } = useLanguage();");
    }

    const replacements = [
        [">SATIŞ ÖZETİ<", ">{t('checkout.summaryTitle')}<"],
        ["Müşteri / Cari", "{t('checkout.customer')}"],
        ["* (Zorunlu)", "* ({t('checkout.required')})"],
        [">SEÇ<", ">{t('checkout.select')}<"],
        [">Ara Toplam<", ">{t('checkout.subtotal')}<"],
        [">İndirim<", ">{t('checkout.discount')}<"],
        [">KDV Hariç Tutar<", ">{t('checkout.vatExcl')}<"],
        [">GENEL TOPLAM<", ">{t('checkout.grandTotal')}<"],
        ["Akıllı Kasiyer Kazanımları", "{t('checkout.smartCashier')}"],
        ["🎁 Ödeme İndirimi", "🎁 {t('checkout.paymentDiscount')}"],
        ["💎 Kazanç Puanı", "💎 {t('checkout.earnedPoints')}"],
        [">BEDELSİZ<", ">{t('checkout.freeItem')}<"],
        [">ÖDEME YÖNTEMİ<", ">{t('checkout.paymentMethod')}<"],
        [">PeşinKasa<", ">{t('checkout.cashRegister')}<"],
        [">Nakit<", ">{t('checkout.cash')}<"],
        [">YazarKasa POS<", ">{t('checkout.pos')}<"],
        [">PayTR Link<", ">{t('checkout.paytr')}<"],
        [">Havale/EFT<", ">{t('checkout.transferEft')}<"],
        [">Havale<", ">{t('checkout.transfer')}<"],
        [">Cari Kredi<", ">{t('checkout.credit')}<"],
        ["title={terminalMode === 'b2b' && selectedCustomer === 'Perakende Müşteri' ? 'Müşteri seçilmeli' : ''}", "title={terminalMode === 'b2b' && selectedCustomer === 'Perakende Müşteri' ? t('checkout.errSelectCustomer') : ''}"],
        [">Parçalı Tahsilat<", ">{t('checkout.splitPayment')}<"],
        ["> BEKLEMEYE AL<", "> {t('checkout.suspend')}<"],
        [">İŞLENİYOR...<", ">{t('checkout.processing')}<"],
        ["'FATURA OLUŞTUR VE KES'", "t('checkout.createInvoice')"],
        ["'ÖDEMEYİ TAMAMLA'", "t('checkout.completePayment')"],
        ["'OFFLINE İŞLEME AL'", "t('checkout.offlineProcess')"],
        [">Nakit<", ">{t('checkout.cash')}<"],
        [">Parçalı Tahsilat<", ">{t('checkout.splitPayment')}<"]
    ];

    for (const [search, replace] of replacements) {
        file = file.replaceAll(search, replace);
    }

    fs.writeFileSync('src/components/terminal/CheckoutPanel.tsx', file);
    console.log('CheckoutPanel i18n applied!');
}

refactorCart();
refactorCheckout();
