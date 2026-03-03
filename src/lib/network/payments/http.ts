export async function fetchJson<T>(
    url: string,
    init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; data?: T; text?: string }> {
    const { timeoutMs = 15000, ...rest } = init;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...rest, signal: ctrl.signal });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            const data = (await res.json()) as T;
            return { ok: res.ok, status: res.status, data };
        }
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
    } finally {
        clearTimeout(t);
    }
}

export function toFormUrlEncoded(body: Record<string, string | number | undefined | null>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
        if (v === undefined || v === null) continue;
        sp.set(k, String(v));
    }
    return sp.toString();
}

export function stripE164Plus(phoneE164?: string) {
    if (!phoneE164) return undefined;
    // +905... => 905...
    return phoneE164.replace(/^\+/, "");
}
