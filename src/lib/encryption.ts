
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Fallback key only for development if env is missing. In prod, this MUST be set.
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-32-chars-lengt';
// Ensure key is 32 bytes
const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string {
    if (!text.includes(':')) return text; // Not encrypted or legacy
    const parts = text.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
