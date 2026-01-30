// Utility Functions - Kod tekrarını önler

// Para formatı
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Tarih formatı
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
};

// Tarih ve saat formatı
export const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
};

// Sayı formatı (binlik ayraçlı)
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('tr-TR').format(num);
};

// Telefon formatı
export const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
};

// TC Kimlik No doğrulama
export const validateTCKN = (tckn: string): boolean => {
    if (!/^\d{11}$/.test(tckn)) return false;

    const digits = tckn.split('').map(Number);
    if (digits[0] === 0) return false;

    const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    if (sum10 % 10 !== digits[10]) return false;

    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    if ((oddSum * 7 - evenSum) % 10 !== digits[9]) return false;

    return true;
};

// Email doğrulama
export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// IBAN formatı
export const formatIBAN = (iban: string): string => {
    const cleaned = iban.replace(/\s/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
};

// Vergi numarası doğrulama (10 haneli)
export const validateTaxNumber = (taxNo: string): boolean => {
    return /^\d{10}$/.test(taxNo);
};

// Dosya boyutu formatı
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Yüzde hesaplama
export const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return (value / total) * 100;
};

// KDV hesaplama
export const calculateVAT = (amount: number, vatRate: number, isIncluded: boolean): {
    base: number;
    vat: number;
    total: number;
} => {
    if (isIncluded) {
        const base = amount / (1 + vatRate / 100);
        const vat = amount - base;
        return { base, vat, total: amount };
    } else {
        const vat = amount * (vatRate / 100);
        const total = amount + vat;
        return { base: amount, vat, total };
    }
};

// Kar marjı hesaplama
export const calculateProfit = (sellPrice: number, buyPrice: number): {
    profit: number;
    margin: number;
    markup: number;
} => {
    const profit = sellPrice - buyPrice;
    const margin = buyPrice > 0 ? (profit / sellPrice) * 100 : 0;
    const markup = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;

    return { profit, margin, markup };
};

// Debounce fonksiyonu (arama için)
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Dizi gruplandırma
export const groupBy = <T,>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
        const group = String(item[key]);
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {} as Record<string, T[]>);
};

// Benzersiz değerler
export const unique = <T,>(array: T[]): T[] => {
    return Array.from(new Set(array));
};

// Dizi sıralama (Türkçe karakterlere duyarlı)
export const sortTurkish = (a: string, b: string): number => {
    return a.localeCompare(b, 'tr-TR');
};

// Rastgele ID oluşturma
export const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Clipboard'a kopyalama
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        return false;
    }
};

// Local storage helpers
export const storage = {
    get: <T,>(key: string, defaultValue?: T): T | null => {
        if (typeof window === 'undefined') return defaultValue || null;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue || null;
        } catch {
            return defaultValue || null;
        }
    },

    set: <T,>(key: string, value: T): void => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.error('Storage error:', err);
        }
    },

    remove: (key: string): void => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
    },

    clear: (): void => {
        if (typeof window === 'undefined') return;
        window.localStorage.clear();
    },
};

// Class names birleştirme (conditional)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};
