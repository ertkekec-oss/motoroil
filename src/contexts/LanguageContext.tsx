"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Fallback empty dictionaries if fetch fails or is incomplete
const defaultDictionaries: Record<string, any> = {
    tr: { 
        common: { save: "Kaydet", cancel: "İptal", welcome: "Hoş geldiniz", search: "Ara", delete: "Sil" },
        menu: {
            workspace: "WORKSPACE",
            pos: "POS Terminal",
            kds: { parent: "Restoran & KDS", kitchen: "Mutfak Ekranı (KDS)", qmenu: "QR Sipariş & Menü", courier: "Kurye Operasyonu" },
            hub: { parent: "Periodya Hub", hub: "Hub Paneli", dispute: "Uyuşmazlık Çözüm Merkezi", cart: "Ağ Sepetim", orders: "Talepler & Siparişler", catalog: "B2B Katalog", finance: "Finans & Büyüme (Growth)", rfq: "RFQ & Sözleşmeler" },
            dealer: { parent: "Dealer Network", dealers: "Bayiler", catalog: "B2B Katalog", orders: "Sipariş Onayı", refunds: "İadeler", banners: "Banner Yönetimi", settings: "Ayarlar" },
            operations: "OPERASYONLAR",
            calendar: "Global Takvim",
            staffme: "Personel Portalı",
            tasks: { parent: "Görev Merkezi", tower: "Görev Kulesi" },
            signatures: { parent: "İmzalar", board: "İmza Panosu", envelopes: "Belge & Zarflar", inbox: "Gelen Talepler", completed: "Tamamlananlar" },
            recon: { parent: "Mutabakatlar", open: "Açık Mutabakatlar", all: "Tüm Mutabakatlar", disputes: "İtiraz Yönetimi" },
            accounting: "Finansal Yönetim",
            sales: { parent: "Satış Yönetimi", all: "Tüm Satışlar", radar: "Revenue Intelligence" },
            customers: { parent: "Cariler", customers: "Müşteriler", suppliers: "Tedarikçiler" },
            inventory: { parent: "Envanter", general: "Envanter Genel", warehouse: "Depo & Stoklar", mfg: "Üretim Kontrol Merkezi" },
            assets: { parent: "Varlık ve Demirbaş", list: "Demirbaş Listesi", assignments: "Zimmet Merkezi", mnx: "Bakım ve Masraflar" },
            service: { parent: "Servis Masası", dash: "Servis Dashboard", workOrders: "İş Emirleri", new: "Yeni İş Emri", calendar: "Servis Randevuları", tv: "Atölye Canlı TV", field: "Saha Planlama Panosu", fieldDash: "Servis Saha Paneli" },
            offers: "Teklifler",
            salesx: "SalesX Saha Paneli",
            hr: { parent: "İnsan Kaynakları", employees: "Personeller", perf: "Performans & Hedef" },
            campaign: { parent: "Kampanya Engine", dash: "Dashboard", new: "Yeni Kurgu", active: "Aktif Kampanyalar", scheduled: "Planlı Kampanyalar", perf: "Performans" },
            analytics: "ANALİTİK & YÖNETİM",
            reports: { parent: "İş Zekası", ceo: "CEO Tablosu", detail: "Detaylı Analiz" },
            fintech: "Fintech Tower",
            advisor: "Mali Müşavir",
            anomaly: "Anomaliler",
            system: "SİSTEM",
            import: "Gelişmiş İçe Aktar",
            integrations: "Entegrasyonlar",
            help: "Yardım Merkezi",
            billing: { parent: "Abonelik & Market", panel: "Abonelik Paneli", store: "Modül Mağazası" },
            settings: "Ayarlar"
        }
    },
    en: { 
        common: { save: "Save", cancel: "Cancel", welcome: "Welcome", search: "Search", delete: "Delete" },
        menu: {
            workspace: "WORKSPACE",
            pos: "POS Terminal",
            kds: { parent: "Restaurant & KDS", kitchen: "Kitchen Display (KDS)", qmenu: "QR Ordering & Menu", courier: "Courier Operations" },
            hub: { parent: "Periodya Hub", hub: "Hub Dashboard", dispute: "Dispute Resolution Center", cart: "Network Cart", orders: "Requests & Orders", catalog: "B2B Catalog", finance: "Finance & Growth", rfq: "RFQs & Contracts" },
            dealer: { parent: "Dealer Network", dealers: "Dealers", catalog: "B2B Catalog", orders: "Order Approvals", refunds: "Refunds", banners: "Banner Management", settings: "Settings" },
            operations: "OPERATIONS",
            calendar: "Global Calendar",
            staffme: "Staff Portal",
            tasks: { parent: "Task Center", tower: "Task Tower" },
            signatures: { parent: "Signatures", board: "Signature Board", envelopes: "Documents & Envelopes", inbox: "Incoming Requests", completed: "Completed" },
            recon: { parent: "Reconciliation", open: "Open Reconciliations", all: "All Reconciliations", disputes: "Dispute Management" },
            accounting: "Financial Management",
            sales: { parent: "Sales Management", all: "All Sales", radar: "Revenue Intelligence" },
            customers: { parent: "Current Accounts", customers: "Customers", suppliers: "Suppliers" },
            inventory: { parent: "Inventory", general: "Inventory Overview", warehouse: "Warehouses & Stock", mfg: "Manufacturing Control Center" },
            assets: { parent: "Assets & Fixtures", list: "Asset List", assignments: "Assignment Center", mnx: "Maintenance & Expenses" },
            service: { parent: "Service Desk", dash: "Service Dashboard", workOrders: "Work Orders", new: "New Work Order", calendar: "Service Appointments", tv: "Workshop Live TV", field: "Field Planning Board", fieldDash: "Field Service Panel" },
            offers: "Quotes",
            salesx: "SalesX Field Panel",
            hr: { parent: "Human Resources", employees: "Employees", perf: "Performance & Targets" },
            campaign: { parent: "Campaign Engine", dash: "Dashboard", new: "New Setup", active: "Active Campaigns", scheduled: "Scheduled Campaigns", perf: "Performance Analytics" },
            analytics: "ANALYTICS & MANAGEMENT",
            reports: { parent: "Business Intelligence", ceo: "CEO Dashboard", detail: "Detailed Analysis" },
            fintech: "Fintech Tower",
            advisor: "Financial Advisor",
            anomaly: "Anomalies",
            system: "SYSTEM",
            import: "Advanced Import",
            integrations: "Integrations",
            help: "Help Center",
            billing: { parent: "Billing & Market", panel: "Billing Dashboard", store: "App Store" },
            settings: "Settings"
        }
    },
    de: { 
        common: { save: "Speichern", cancel: "Abbrechen", welcome: "Willkommen", search: "Suche", delete: "Löschen" },
        menu: {
            workspace: "ARBEITSBEREICH",
            pos: "Kassensystem (POS)",
            kds: { parent: "Gastro & KDS", kitchen: "Küchendisplay (KDS)", qmenu: "QR Bestellungen & Menü", courier: "Kurier-Betrieb" },
            hub: { parent: "Periodya Hub", hub: "Hub-Dashboard", dispute: "Streitbeilegungszentrum", cart: "Netzwerk-Warenkorb", orders: "Anfragen & Bestellungen", catalog: "B2B-Katalog", finance: "Finanzen & Wachstum", rfq: "Ausschreibungen & Verträge" },
            dealer: { parent: "Händlernetzwerk", dealers: "Händler", catalog: "B2B-Katalog", orders: "Bestellgenehmigungen", refunds: "Rückerstattungen", banners: "Banner-Management", settings: "Einstellungen" },
            operations: "OPERATIONEN",
            calendar: "Globaler Kalender",
            staffme: "Mitarbeiter-Portal",
            tasks: { parent: "Aufgabenzentrum", tower: "Aufgaben-Turm" },
            signatures: { parent: "Unterschriften", board: "Signatur-Board", envelopes: "Dokumente & Umschläge", inbox: "Eingehende Anfragen", completed: "Abgeschlossen" },
            recon: { parent: "Abstimmung", open: "Offene Abstimmungen", all: "Alle Abstimmungen", disputes: "Konfliktmanagement" },
            accounting: "Finanzmanagement",
            sales: { parent: "Vertriebsmanagement", all: "Alle Verkäufe", radar: "Umsatz-Intelligenz" },
            customers: { parent: "Kunden & Lieferanten", customers: "Kunden", suppliers: "Lieferanten" },
            inventory: { parent: "Inventar", general: "Inventarübersicht", warehouse: "Lager & Bestand", mfg: "Produktions­kontrollzentrum" },
            assets: { parent: "Anlagen & Ausstattung", list: "Anlagenliste", assignments: "Zuweisungszentrum", mnx: "Wartung & Ausgaben" },
            service: { parent: "Service Desk", dash: "Service-Dashboard", workOrders: "Arbeitsaufträge", new: "Neuer Arbeitsauftrag", calendar: "Service-Termine", tv: "Werkstatt Live-TV", field: "Einsatzplanung", fieldDash: "Service-Einsatzpanel" },
            offers: "Angebote",
            salesx: "SalesX Außendienst",
            hr: { parent: "Personalwesen", employees: "Mitarbeiter", perf: "Leistung & Ziele" },
            campaign: { parent: "Kampagnen-Engine", dash: "Dashboard", new: "Neues Setup", active: "Aktive Kampagnen", scheduled: "Geplante Kampagnen", perf: "Leistungsanalysen" },
            analytics: "ANALYTIK & MANAGEMENT",
            reports: { parent: "Business Intelligence", ceo: "CEO-Dashboard", detail: "Detaillierte Analyse" },
            fintech: "Fintech-Turm",
            advisor: "Steuerberater",
            anomaly: "Anomalien",
            system: "SYSTEM",
            import: "Erweiterter Import",
            integrations: "Integrationen",
            help: "Hilfe-Center",
            billing: { parent: "Abrechnung & Store", panel: "Abrechnungs-Dashboard", store: "App-Store" },
            settings: "Einstellungen"
        }
    }
};

type Language = "tr" | "en" | "de";

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, variables?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
    language: "tr",
    setLanguage: () => {},
    t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>("tr");
    const [dictionaries, setDictionaries] = useState<Record<string, any>>(defaultDictionaries);

    useEffect(() => {
        // Load user's preferred language from local storage
        const savedLang = localStorage.getItem("periodya_lang") as Language;
        if (savedLang && ["tr", "en", "de"].includes(savedLang)) {
            setLanguageState(savedLang);
        }

        // Future: Fetch extended dictionaries from a server or dynamic imports here
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("periodya_lang", lang);
        // Optionally reload or sync state to server
    };

    const t = (key: string, variables?: Record<string, any>): string => {
        const keys = key.split(".");
        let value = dictionaries[language];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = undefined;
                break;
            }
        }

        // If string not found in target language, fallback to TR or just return the key
        if (value === undefined) {
             let trValue = dictionaries["tr"];
             for (const k of keys) {
                if (trValue && typeof trValue === 'object') trValue = trValue[k];
                else { trValue = undefined; break; }
             }
             value = trValue !== undefined ? trValue : key;
        }

        if (typeof value !== 'string') return key;

        // Replace variables e.g. {name} -> variables.name
        if (variables) {
            return value.replace(/\{(\w+)\}/g, (_, vKey) => {
                return variables[vKey] !== undefined ? variables[vKey] : `{${vKey}}`;
            });
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
