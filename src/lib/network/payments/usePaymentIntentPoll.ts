"use client";

import { useEffect, useRef, useState } from "react";

type PollState =
    | { state: "idle" }
    | { state: "polling" }
    | { state: "done"; status: string; intent: any }
    | { state: "error"; message: string };

export function usePaymentIntentPoll(intentId: string | null) {
    const [data, setData] = useState<any | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [phase, setPhase] = useState<PollState>({ state: "idle" });
    const timer = useRef<any>(null);

    useEffect(() => {
        if (!intentId) return;

        let stopped = false;
        setPhase({ state: "polling" });

        async function tick() {
            const res = await fetch(`/api/network/payments/intents/${encodeURIComponent(intentId)}`, { cache: "no-store" });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.ok) {
                if (!stopped) setPhase({ state: "error", message: "Ödeme durumu alınamadı." });
                return;
            }

            const intent = json.intent;
            setData(intent);
            setStatus(intent.status);

            if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(intent.status)) {
                if (!stopped) setPhase({ state: "done", status: intent.status, intent });
                return;
            }

            timer.current = setTimeout(tick, 1500);
        }

        tick();

        return () => {
            stopped = true;
            if (timer.current) clearTimeout(timer.current);
        };
    }, [intentId]);

    return { phase, status, intent: data };
}
