export function approvalLabel(status: string) {
    if (status === "PENDING_APPROVAL") return "Onay bekliyor"
    if (status === "APPROVED") return "Onaylandı"
    if (status === "REJECTED") return "Reddedildi"
    return status
}

export function paymentLabel(status: string) {
    if (status === "PAID") return "Ödeme alındı"
    if (status === "PAID_PENDING_APPROVAL") return "Ödeme yapıldı, onay bekliyor"
    if (status === "PENDING_APPROVAL") return "Ödeme bekleniyor"
    if (status === "APPROVED") return "Ödeme bekleniyor"
    if (status === "REJECTED") return "—"
    return "—"
}

export function isPaid(status: string) {
    return status === "PAID" || status === "PAID_PENDING_APPROVAL"
}

// UI tone (no colors specified; use variants)
export function badgeVariantForOrder(status: string): "default" | "secondary" | "outline" | "destructive" {
    if (status === "REJECTED") return "destructive"
    if (isPaid(status)) return "default"
    if (status === "PENDING_APPROVAL") return "secondary"
    if (status === "APPROVED") return "outline"
    return "outline"
}
