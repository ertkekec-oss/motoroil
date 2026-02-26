export function redactPII(text: string): string {
    if (!text) return text;

    let redacted = text;

    // Redact Email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    redacted = redacted.replace(emailPattern, '[REDACTED_EMAIL]');

    // Redact Phone 
    const phonePattern = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g;
    redacted = redacted.replace(phonePattern, '[REDACTED_PHONE]');

    return redacted;
}
