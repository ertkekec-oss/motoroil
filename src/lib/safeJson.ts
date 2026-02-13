export async function safeJson(res: Response) {
    const ct = res.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
        ? await res.json().catch(() => null)
        : await res.text().catch(() => "");

    if (!res.ok) return { ok: false, status: res.status, error: payload };
    return { ok: true, data: payload };
}
