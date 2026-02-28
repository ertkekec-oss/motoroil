"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Printer, Truck } from "lucide-react";
import { toast } from "sonner";

interface Props {
    marketplace: string;
    orderId: string;
    actionKey: "REFRESH_STATUS" | "PRINT_LABEL_A4" | "CHANGE_CARGO";
    shipmentPackageId?: string;
    label?: string;
    variant?: "outline" | "default" | "ghost";
    size?: "sm" | "default" | "lg";
    onSuccess?: () => void;
}

export function MarketplaceActionButton({
    marketplace,
    orderId,
    actionKey,
    shipmentPackageId,
    label,
    variant = "outline",
    size = "sm",
    onSuccess,
}: Props) {
    const [status, setStatus] = useState<"IDLE" | "PENDING" | "POLLING" | "SUCCESS" | "FAILED">("IDLE");
    const [auditId, setAuditId] = useState<string | null>(null);
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isLabel = actionKey === "PRINT_LABEL_A4";

    const handleAction = async () => {
        if (status === "PENDING" || status === "POLLING") return;

        let payload: any = {};

        if (actionKey === "CHANGE_CARGO") {
            const providerCode = window.prompt("Yeni kargo firması kodunu girin (örn: Trendyol Express, Aras, Yurtiçi):");
            if (!providerCode) return;
            payload = { cargoProviderCode: providerCode, shipmentPackageId };
        }

        if (isLabel && shipmentPackageId) {
            payload = {
                labelShipmentPackageId: shipmentPackageId,
                shipmentPackageId: shipmentPackageId
            };
        }

        setStatus("PENDING");
        const idempotencyKey = `${actionKey}:${orderId}:${Date.now()}`;
        const mplaceLower = marketplace.toLowerCase();
        const actionUrl = `/api/marketplaces/${encodeURIComponent(mplaceLower)}/orders/${encodeURIComponent(orderId)}/actions`;

        console.log("🚀 EXECUTE ACTION:", { actionUrl, actionKey, idempotencyKey });

        try {
            // For labels, we simply open the dedicated route in a new tab.
            // The route itself handles the "PENDING" wait-page and eventual "SUCCESS" redirect to PDF.
            if (isLabel && shipmentPackageId) {
                const labelUrl = `/api/marketplaces/${encodeURIComponent(mplaceLower)}/orders/${encodeURIComponent(orderId)}/label?shipmentPackageId=${encodeURIComponent(shipmentPackageId)}&format=A4`;

                window.open(labelUrl, "_blank", "noopener,noreferrer");

                setStatus("SUCCESS");
                toast.success("Etiket yazdırma sekmesi açıldı");
                setTimeout(() => setStatus("IDLE"), 2000);
                return;
            }

            // Normal Action POST
            const res = await fetch(actionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actionKey, idempotencyKey, payload })
            });

            const data = await res.json();

            if (res.status === 202 || data.status === "PENDING") {
                setAuditId(data.auditId);
                setStatus("POLLING");
                toast.loading("İşlem kuyruğa alındı, takip ediliyor...", { id: idempotencyKey });
            } else if (data.status === "SUCCESS") {
                setStatus("SUCCESS");
                toast.success("İşlem anında tamamlandı");

                // If this was a successful label generation (sync), open it
                if (isLabel && data.result?.storageKey) {
                    const labelUrl = `/api/marketplaces/${encodeURIComponent(mplaceLower)}/orders/${encodeURIComponent(orderId)}/label?shipmentPackageId=${encodeURIComponent(shipmentPackageId)}`;
                    window.open(labelUrl, "_blank");
                }

                onSuccess?.();
            } else {
                if (data.code === "SHIPMENT_PACKAGE_ID_MISSING") {
                    toast.error("İşlem Başarısız: Koli ID Eksik", {
                        description: data.errorMessage || "Bu işlem için kargo paket bilgisi gereklidir. Lütfen önce 'Durum Yenile' yapın.",
                        duration: 6000
                    });
                } else {
                    try {
                        const parsed = JSON.parse(data.errorMessage);
                        alert("Hata Detayı (İnceleme İçin):\n\n" + JSON.stringify(parsed.debug || parsed, null, 2));
                        throw new Error(parsed.message || "İşlem başlatılamadı");
                    } catch (e: any) {
                        if (e.message !== "Unexpected token" && !e.message.includes("JSON")) {
                            throw e; // Rethrow if it's our parsed error
                        }
                        throw new Error(data.errorMessage || "İşlem başlatılamadı");
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            setStatus("FAILED");
            toast.error(err.message || "İşlem başarısız");
        }
    };

    // Polling Logic with Exponential Backoff + Jitter
    useEffect(() => {
        if (status !== "POLLING" || !auditId) return;

        let attempt = 0;
        const maxTime = 90000; // 90s
        const startTime = Date.now();

        const poll = async () => {
            if (Date.now() - startTime > maxTime) {
                setStatus("FAILED");
                toast.error("İşlem zaman aşımına uğradı (90s)");
                return;
            }

            try {
                const res = await fetch(`/api/marketplaces/actions/${auditId}`);
                const data = await res.json();

                if (data.status === "SUCCESS") {
                    setStatus("SUCCESS");
                    toast.success("İşlem başarıyla tamamlandı");
                    if (isLabel) {
                        window.open(`/api/marketplaces/${marketplace}/orders/${orderId}/label?shipmentPackageId=${shipmentPackageId}`, "_blank");
                    }
                    onSuccess?.();
                    setTimeout(() => setStatus("IDLE"), 2000);
                } else if (data.status === "FAILED") {
                    setStatus("FAILED");
                    try {
                        const parsed = JSON.parse(data.errorMessage);
                        alert("Hata Detayı (İnceleme İçin):\n\n" + JSON.stringify(parsed.debug || parsed, null, 2));
                        toast.error(parsed.message || "İşlem başarısız oldu");
                    } catch (e: any) {
                        toast.error(data.errorMessage || "İşlem başarısız oldu");
                    }
                } else {
                    // Continue polling with exponential backoff
                    attempt++;
                    const baseDelay = Math.min(Math.pow(2, attempt) * 1000, 16000);
                    const jitter = Math.random() * 1000;
                    const delay = baseDelay + jitter;
                    pollingTimeoutRef.current = setTimeout(poll, delay);
                }
            } catch (e) {
                console.error("Polling error", e);
                pollingTimeoutRef.current = setTimeout(poll, 5000);
            }
        };

        poll();
        return () => {
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
    }, [status, auditId, marketplace, orderId, actionKey, isLabel, shipmentPackageId, onSuccess]);

    const getIcon = () => {
        if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
        if (actionKey === "PRINT_LABEL_A4") return <Printer className="h-4 w-4" />;
        if (actionKey === "REFRESH_STATUS") return <RefreshCw className="h-4 w-4 text-amber-500" />;
        if (actionKey === "CHANGE_CARGO") return <Truck className="h-4 w-4 text-blue-500" />;
        return <RefreshCw className="h-4 w-4" />;
    };

    const isLoading = status === "PENDING" || status === "POLLING";

    // Check if shipmentPackageId is required but missing
    const requiresShipmentId = actionKey === "PRINT_LABEL_A4" || actionKey === "CHANGE_CARGO";
    const isDisabled = isLoading || (requiresShipmentId && !shipmentPackageId);

    const getTooltip = () => {
        if (requiresShipmentId && !shipmentPackageId) {
            return "Koli ID henüz gelmedi. Önce 'Durum Yenile' yapın.";
        }
        return undefined;
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={(e) => {
                e.stopPropagation();
                if (requiresShipmentId && !shipmentPackageId) {
                    toast.error("Koli ID bulunamadı", {
                        description: "Önce 'Durum Yenile' butonuna tıklayarak sipariş bilgilerini güncelleyin."
                    });
                    return;
                }
                handleAction();
            }}
            disabled={isDisabled}
            title={getTooltip()}
            className={`flex items-center gap-2 transition-all ${status === 'SUCCESS' ? 'border-green-500 text-green-500 bg-green-50' : ''} ${isDisabled && requiresShipmentId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {getIcon()}
            {label || (isLabel ? "Etiket Yazdır" : actionKey === "CHANGE_CARGO" ? "Kargo Değiştir" : "Durum Yenile")}
        </Button>
    );
}
