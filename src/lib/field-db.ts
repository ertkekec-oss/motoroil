
import Dexie, { Table } from 'dexie';

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    image?: string;
    prices?: { priceListId: string, name: string, price: number }[];
}

export interface Customer {
    id: string;
    name: string;
    balance: number;
    address: string;
    priceListId?: string;
    location?: { lat: number, lng: number };
}

export interface OfflineOrder {
    id?: number; // Auto-increment for local ID
    visitId: string; // Server visit ID if online, or local pending visit ID
    customerId: string;
    items: { productId: string, name: string, qty: number, price: number }[];
    total: number;
    notes?: string;
    timestamp: number;
    synced: boolean;
}

export interface OfflineVisit {
    id?: number;
    routeStopId: string;
    customerId: string;
    checkInTime: number;
    checkOutTime?: number;
    synced: boolean;
    serverId?: string; // If synced
}

export interface OfflineCollection {
    id?: number;
    visitId: string;
    customerId: string;
    kasaId: string;
    amount: number;
    description: string;
    timestamp: number;
    synced: boolean;
}

export class FieldDatabase extends Dexie {
    products!: Table<Product, string>;
    customers!: Table<Customer, string>;
    orders!: Table<OfflineOrder, number>;
    visits!: Table<OfflineVisit, number>;
    collections!: Table<OfflineCollection, number>;

    constructor() {
        super('FieldSalesDB');
        this.version(2).stores({
            products: 'id, name, category',
            customers: 'id, name',
            orders: '++id, visitId, synced',
            visits: '++id, routeStopId, synced',
            collections: '++id, visitId, synced'
        });
    }
}

export const fieldDb = new FieldDatabase();
