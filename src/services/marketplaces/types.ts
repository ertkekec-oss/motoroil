export interface MarketplaceOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    orderDate: Date;
    status: string;
    totalAmount: number;
    currency: string;
    items: MarketplaceOrderItem[];
    shippingAddress: MarketplaceAddress;
    invoiceAddress: MarketplaceAddress;
    cargoTrackingNumber?: string;
    cargoTrackingLink?: string;
    cargoProvider?: string;
    shipmentPackageId?: string | null; // CRITICAL: For Trendyol label printing and cargo operations
}

export interface MarketplaceOrderItem {
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    taxRate: number;
    discountAmount?: number;
}

export interface MarketplaceAddress {
    fullName: string;
    address: string;
    city: string;
    district: string;
    phone: string;
}

export interface TrendyolConfig {
    apiKey: string;
    apiSecret: string;
    supplierId: string;
    isTest?: boolean;
}

export interface HepsiburadaConfig {
    merchantId: string;
    username?: string;
    password?: string;
    secretKey?: string;
    isTest?: boolean;
}

export interface N11Config {
    apiKey: string;
    apiSecret: string;
    isTest?: boolean;
}

export interface PazaramaConfig {
    apiKey: string;
    apiSecret: string;
    isTest?: boolean;
}

export type MarketplaceConfig = TrendyolConfig | HepsiburadaConfig | N11Config | PazaramaConfig;

export interface IMarketplaceService {
    getOrders(startDate?: Date, endDate?: Date): Promise<MarketplaceOrder[]>;
    validateConnection(): Promise<boolean>;
}
