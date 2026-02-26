import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.PAYOUT_ENCRYPTION_KEY || 'default_test_key_must_be_32_bytes!';
const getKey = () => {
    // Basic fallback for exactly 32 bytes if not provided correctly
    const key = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    if (key.length === 32) return key;
    return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
};

export function encryptIban(rawIban: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);
    let encrypted = cipher.update(rawIban.replace(/\s+/g, ''), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptIban(encryptedIban: string): string {
    const parts = encryptedIban.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted IBAN format');

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function maskIban(rawIban: string): string {
    if (!rawIban) return '';
    const clean = rawIban.replace(/[^A-Z0-9]/gi, '');
    if (clean.length < 8) return clean;
    return `${clean.substring(0, 4)} **** **** **** ${clean.substring(clean.length - 4)}`;
}

export function maskHolderName(name: string): string {
    if (!name) return '';
    return name.trim().split(/\s+/).map(part => {
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(part.length - 1);
    }).join(' ');
}
