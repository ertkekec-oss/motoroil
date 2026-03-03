"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { usePaymentIntentPoll } from "@/lib/hub/payments/usePaymentIntentPoll";

function ResultContent() {
    const sp = useSearchParams();
    const router = useRouter();
    const intentId = sp.get("intentId");

    const { phase, intent } = usePaymentIntentPoll(intentId);

    return (
        <div className="mx-auto max-w-xl">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="text-sm text-muted-foreground">Ödeme</div>
                <div className="mt-1 text-2xl font-semibold">Sonuç</div>

                <div className="mt-4 text-sm text-muted-foreground">
                    {phase.state === "polling" && "Doğrulanıyor…"}
                    {phase.state === "error" && phase.message}
                    {phase.state === "done" && (
                        <>
                            Durum: <span className="font-medium">{phase.status}</span>
                        </>
                    )}
                </div>

                {intent?.orderId && phase.state === "done" && phase.status === "SUCCEEDED" && (
                    <div className="mt-6 flex gap-2">
                        <button
                            onClick={() => router.push(`/network/orders/${intent.orderId}`)}
                            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                        >
                            Siparişi Gör
                        </button>
                        <Link
                            href="/network/orders"
                            className="h-10 px-4 rounded-xl border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center"
                        >
                            Siparişler
                        </Link>
                    </div>
                )}

                {phase.state === "done" && phase.status !== "SUCCEEDED" && (
                    <div className="mt-6 flex gap-2">
                        <Link
                            href="/network/cart"
                            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center"
                        >
                            Sepete Dön
                        </Link>
                        <Link
                            href="/network/catalog"
                            className="h-10 px-4 rounded-xl border bg-card text-sm font-medium hover:bg-muted/40 inline-flex items-center"
                        >
                            Kataloğa Git
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <div className="min-h-screen bg-background px-4 py-12">
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <ResultContent />
            </Suspense>
        </div>
    );
}
