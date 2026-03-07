import { useEffect, useState } from 'react';

export function ReputationSignalsPanel() {
    const [signals, setSignals] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/network/reputation/signals')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSignals(data);
            });
    }, []);

    if (signals.length === 0) return null;

    return (
        <div className="bg-white p-4 border rounded-xl mt-4">
            <h4 className="font-semibold border-b pb-2 mb-4">Etki Faktörleri (Sinyaller)</h4>
            <ul className="space-y-3">
                {signals.map((sig, i) => (
                    <li key={i} className="flex justify-between items-center bg-gray-50 border p-3 rounded-md">
                        <div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-sm mr-2 ${sig.direction === 'POSITIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {sig.direction}
                            </span>
                            <span className="text-sm font-medium">{sig.type.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-xs text-gray-500 max-w-sm truncate text-right">
                            {sig.summary}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
