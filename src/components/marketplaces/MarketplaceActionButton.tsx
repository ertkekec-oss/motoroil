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
            payload = { labelShipmentPackageId: shipmentPackageId };
        }

        setStatus("PENDING");
        const idempotencyKey = `${actionKey}:${orderId}:${Date.now()}`;

        try {
            // For labels, we FIRST try the direct label route
            if (isLabel && shipmentPackageId) {
                const res = await fetch(`/api/marketplaces/${marketplace}/orders/${orderId}/label?shipmentPackageId=${shipmentPackageId}`);
                if (res.status === 302 || (res.status === 200 && res.redirected)) {
                    window.open(res.url, "_blank");
                    setStatus("IDLE");
                    toast.success("Etiket indiriliyor...");
                    return;
                }
                if (res.status === 202) {
                    const data = await res.json();
                    if (data.auditId) {
                        setAuditId(data.auditId);
                        setStatus("POLLING");
                        toast.info("Etiket hazırlanıyor, lütfen bekleyin...");
                        return;
                    }
                }
            }

            // Normal Action POST
            const res = await fetch(`/api/marketplaces/${marketplace}/orders/${orderId}/actions`, {
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
                onSuccess?.();
            } else {
                throw new Error(data.errorMessage || "İşlem başlatılamadı");
            }
        } catch (err: any) {
            toast.error(err.message);
            setStatus("FAILED");
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
                    toast.error(data.errorMessage || "İşlem başarısız oldu");
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

    return (
        <Button
            variant={variant}
            size={size}
            onClick={(e) => {
                e.stopPropagation();
                handleAction();
            }}
            disabled={isLoading}
            className={`flex items-center gap-2 transition-all ${status === 'SUCCESS' ? 'border-green-500 text-green-500 bg-green-50' : ''}`}
        >
            {getIcon()}
            {label || (isLabel ? "Etiket Yazdır" : actionKey === "CHANGE_CARGO" ? "Kargo Değiştir" : "Durum Yenile")}
        </Button>
    );
}
