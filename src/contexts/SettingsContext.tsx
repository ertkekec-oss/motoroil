"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Campaign {
    id: string;
    name: string;
    type: string;
    conditions: any;
    discountRate?: number;
    pointsRate?: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'percent' | 'amount';
    value: number;
    usageLimit: number;
    usedCount: number;
    isUsed: boolean;
    startDate?: string;
    expiryDate?: string;
    minPurchaseAmount?: number;
    conditions?: any;
}

interface SettingsContextType {
    campaigns: Campaign[];
    refreshCampaigns: () => Promise<void>;
    coupons: Coupon[];
    refreshCoupons: () => Promise<void>;
    serviceSettings: any;
    updateServiceSettings: (s: any) => Promise<void>;
    invoiceSettings: any;
    updateInvoiceSettings: (s: any) => Promise<void>;
    referralSettings: any;
    updateReferralSettings: (s: any) => Promise<void>;
    warranties: string[];
    updateWarranties: (w: string[]) => Promise<void>;
    appSettings: Record<string, any>;
    updateAppSetting: (key: string, value: any) => Promise<void>;
    refreshSettings: () => Promise<void>;
    brands: string[];
    setBrands: React.Dispatch<React.SetStateAction<string[]>>;
    prodCats: string[];
    setProdCats: React.Dispatch<React.SetStateAction<string[]>>;
    setWarranties: React.Dispatch<React.SetStateAction<string[]>>; // Added this
    allBrands: string[];
    allCats: string[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [serviceSettings, setServiceSettings] = useState<any>({});
    const [invoiceSettings, setInvoiceSettings] = useState<any>({});
    const [referralSettings, setReferralSettings] = useState<any>({ referrerDiscount: 0, refereeGift: 0 });
    const [warranties, setWarranties] = useState<string[]>([]);
    const [appSettings, setAppSettings] = useState<Record<string, any>>({});
    const [brands, setBrands] = useState<string[]>([]);
    const [prodCats, setProdCats] = useState<string[]>([]);

    const refreshSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data && !data.error) {
                setAppSettings(data);
                if (data.campaigns) setCampaigns(data.campaigns);
                if (data.serviceSettings) setServiceSettings(data.serviceSettings);
                if (data.invoiceSettings) setInvoiceSettings(data.invoiceSettings);
                if (data.referralSettings) setReferralSettings(data.referralSettings);
                if (data.warranties) setWarranties(data.warranties);
                if (data.brands) setBrands(data.brands);
                if (data.prodCats) setProdCats(data.prodCats);
            }
        } catch (e) { console.error('Settings fetch failed', e); }
    };
    const refreshCampaigns = async () => {
        try {
            const res = await fetch('/api/campaigns');
            const data = await res.json();
            if (data.success) setCampaigns(data.campaigns);
        } catch (e) { console.error('Campaigns fetch failed', e); }
    };

    const refreshCoupons = async () => {
        try {
            const res = await fetch('/api/coupons');
            const data = await res.json();
            if (data.success) setCoupons(data.coupons);
        } catch (e) { console.error('Coupons fetch failed', e); }
    };

    const updateServiceSettings = async (s: any) => {
        setServiceSettings(s);
        await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceSettings: s }) });
    };

    const updateInvoiceSettings = async (s: any) => {
        setInvoiceSettings(s);
        await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoiceSettings: s }) });
    };

    const updateReferralSettings = async (s: any) => {
        setReferralSettings(s);
        await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referralSettings: s }) });
    };

    const updateWarranties = async (w: string[]) => {
        setWarranties(w);
        await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ warranties: w }) });
    };

    const updateAppSetting = async (key: string, value: any) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
        } catch (e) { console.error('Update setting failed', e); }
    };

    useEffect(() => {
        refreshSettings();
        refreshCampaigns();
        refreshCoupons();
    }, []);

    return (
        <SettingsContext.Provider value={{
            campaigns, refreshCampaigns, coupons, refreshCoupons,
            serviceSettings, updateServiceSettings,
            invoiceSettings, updateInvoiceSettings,
            referralSettings, updateReferralSettings,
            warranties, updateWarranties, setWarranties, // Added setWarranties
            appSettings, updateAppSetting, refreshSettings,
            brands, setBrands, allBrands: brands,
            prodCats, setProdCats, allCats: prodCats
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
