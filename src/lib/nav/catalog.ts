export interface NavRoute {
    label: string;
    href?: string;
    action?: string;
    keywords: string[];
    roles?: string[]; // Optional role constraints (e.g., 'PLATFORM_ADMIN')
    isAction?: boolean;
    icon?: string;
}

export const tenantRoutes: NavRoute[] = [
    { label: 'POS Terminal', href: '/terminal', keywords: ['pos', 'terminal', 'satış', 'sepet', 'kasa'], icon: 'Monitor' },
    { label: 'Dashboard', href: '/dashboard', keywords: ['home', 'dashboard', 'panel', 'ana sayfa'], icon: 'Home' },
    { label: 'Orders (Alınan)', href: '/network/seller/orders', keywords: ['orders', 'siparişler', 'satış', 'alınan'], roles: ['SELLER'], icon: 'ShoppingCart' },
    { label: 'Orders (Verilen)', href: '/network/buyer/orders', keywords: ['orders', 'siparişler', 'alış', 'verilen'], roles: ['BUYER'], icon: 'ShoppingBag' },
    { label: 'Ürünlerim (Seller)', href: '/seller/products', keywords: ['products', 'ürünler', 'katalog', 'satıcı'], roles: ['SELLER'], icon: 'Package' },
    { label: 'B2B Keşfet (Buyer)', href: '/catalog', keywords: ['catalog', 'keşfet', 'b2b', 'ürün bul'], roles: ['BUYER'], icon: 'Search' },
    { label: 'Finans: Kazançlar', href: '/network/finance?tab=earnings', keywords: ['finance', 'earnings', 'kazanç', 'para'], icon: 'DollarSign' },
    { label: 'Finans: Payouts', href: '/network/finance?tab=payouts', keywords: ['finance', 'payouts', 'çekim', 'withdraw'], icon: 'CreditCard' },
    { label: 'Finans: Faturalar', href: '/network/finance?tab=invoices', keywords: ['finance', 'invoices', 'fatura', 'boost'], icon: 'FileText' },
    { label: 'Finans: Ödemeler', href: '/network/finance?tab=payments', keywords: ['finance', 'payments', 'ödeme', 'hesap'], icon: 'Activity' },
    { label: 'Güven Skorum', href: '/network/trust-score', keywords: ['trust', 'güven', 'skor', 'puan'], icon: 'ShieldCheck' },
    { label: 'Boost Yönetimi', href: '/seller/boost', keywords: ['boost', 'reklam', 'öne çık', 'promosyon'], roles: ['SELLER'], icon: 'Zap' },
    { label: 'Sözleşmelerim', href: '/contracts', keywords: ['contracts', 'sözleşmeler', 'anlaşma'], icon: 'FileSignature' },
    { label: 'Taleplerim (Destek)', href: '/support/tickets', keywords: ['support', 'destek', 'yardım', 'ticket', 'dispute'], icon: 'LifeBuoy' },
];

export const tenantActions: NavRoute[] = [
    { label: 'Create Support Ticket', action: '/support/tickets/new', keywords: ['create', 'ticket', 'yardım', 'destek aç'], isAction: true, icon: 'PlusCircle' },
    { label: 'Go to Finance (Earnings)', action: '/network/finance?tab=earnings', keywords: ['go', 'finance', 'kazanç'], isAction: true, icon: 'ArrowRight' },
    { label: 'View Boost', action: '/seller/boost', keywords: ['view', 'boost', 'reklam gör'], roles: ['SELLER'], isAction: true, icon: 'Eye' },
    { label: 'Open Cart / Catalog', action: '/catalog', keywords: ['open', 'cart', 'sepet', 'katalog aç'], roles: ['BUYER'], isAction: true, icon: 'ShoppingCart' },
];

export const adminRoutes: NavRoute[] = [
    { label: 'Executive Dashboard', href: '/admin/dashboard', keywords: ['dashboard', 'admin', 'panel', 'executive', 'ceo'], icon: 'BarChart' },
    { label: 'Dispute Queue', href: '/admin/resolutions/disputes', keywords: ['dispute', 'risk', 'resolution', 'kuyruk', 'çözüm'], icon: 'AlertTriangle' },
    { label: 'Billing Health', href: '/admin/growth/billing', keywords: ['billing', 'health', 'fatura', 'tahsilat', 'ödeme'], icon: 'Activity' },
    { label: 'Payout Control', href: '/admin/finance/payouts', keywords: ['payout', 'finance', 'çekim', 'onay', 'kontrol'], icon: 'CheckCircle' },
    { label: 'Boost Rules', href: '/admin/growth/boost', keywords: ['boost', 'rules', 'kurallar', 'algoritma'], icon: 'Zap' },
    { label: 'Companies (Tenants)', href: '/admin/governance/companies', keywords: ['companies', 'tenants', 'firmalar', 'müşteriler'], icon: 'Building' },
    { label: 'Ops Health', href: '/admin/system/ops', keywords: ['ops', 'health', 'sistem', 'sağlık', 'alıcı'], icon: 'Server' },
    { label: 'Finance Audit Log', href: '/admin/finance/audit', keywords: ['finance', 'audit', 'log', 'kayıt', 'denetim'], icon: 'FileSearch' },
];

export const adminActions: NavRoute[] = [
    { label: 'Open Dispute Queue', action: '/admin/resolutions/disputes', keywords: ['open', 'dispute', 'kuyruk'], isAction: true, icon: 'AlertTriangle' },
    { label: 'Open Billing Health', action: '/admin/growth/billing', keywords: ['open', 'billing', 'tahsilat'], isAction: true, icon: 'Activity' },
    { label: 'Open Payout Control', action: '/admin/finance/payouts', keywords: ['open', 'payout', 'onay'], isAction: true, icon: 'CheckCircle' },
    { label: 'Snapshot Billing Health', action: 'SNAPSHOT_BILLING', keywords: ['snapshot', 'billing', 'tahsilat', 'rapor'], isAction: true, icon: 'Camera' },
    { label: 'Snapshot Ops Health', action: 'SNAPSHOT_OPS', keywords: ['snapshot', 'ops', 'sistem', 'sağlık'], isAction: true, icon: 'Camera' },
];
