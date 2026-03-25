"use client";

import { useEffect, useState } from "react";

export function PaymentReliabilityPanel() {
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    fetch("/api/network/finance-risk")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.paymentReliabilitySummary)
          setScore(data.paymentReliabilitySummary.score);
      });
  }, []);

  if (score === null) return null;

  return (
    <div className="bg-white p-4 border rounded-xl mt-4 flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800 text-sm">
          Ödeme ve Tahsilat Güvenilirlik Endeksi
        </h4>
        <p className="text-xs text-gray-500 mt-1 pr-4">
          Network üzerinde escrow release / refund davranışlarından hesaplanır.
        </p>
      </div>
      <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center bg-indigo-50 shrink-0">
        <span className="text-xl font-bold text-indigo-800">
          {score.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
