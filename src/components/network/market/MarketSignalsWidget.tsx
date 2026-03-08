import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Activity } from 'lucide-react';

const Card = (p: any) => <div className={`border shadow-sm rounded-lg ${p.className || ''}`}>{p.children}</div>;
const CardHeader = (p: any) => <div className="p-4 border-b">{p.children}</div>;
const CardTitle = (p: any) => <h3 className="font-semibold">{p.children}</h3>;
const CardContent = (p: any) => <div className="p-4">{p.children}</div>;
const Badge = (p: any) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{p.children}</span>;

interface MarketSignalProps {
    signals: any[];
    isLoading: boolean;
}

export function MarketSignalsWidget({ signals, isLoading }: MarketSignalProps) {
    if (isLoading) {
        return (
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Aktif Pazar Sinyalleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-16 bg-muted animate-pulse rounded-md" />
                    <div className="h-16 bg-muted animate-pulse rounded-md" />
                </CardContent>
            </Card>
        );
    }

    if (!signals || signals.length === 0) {
        return (
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Aktif Pazar Sinyalleri</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <Activity className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Henüz anlamlı pazar sinyali yok.</p>
                        <p className="text-xs">Motorumuz daha fazla ağ aktivitesi biriktiriyor.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border shadow-sm">
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Aktif Pazar Sinyalleri
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {signals?.map((signal) => (
                    <div key={signal.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <Badge variant={signal.confidence > 70 ? 'default' : 'secondary'} className="text-[10px] uppercase font-semibold">
                                    {signal.signalType.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs font-medium text-muted-foreground uppercase">{signal.categoryId || signal.regionCode || 'GLOBAL'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-semibold">
                                {signal.trendDirection === 'UP' && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                                {signal.trendDirection === 'DOWN' && <ArrowDownRight className="h-4 w-4 text-rose-500" />}
                                {signal.trendDirection === 'FLAT' && <Minus className="h-4 w-4 text-slate-500" />}
                                {signal.intensity}%
                            </div>
                        </div>

                        <p className="text-sm font-medium">{signal.summary}</p>

                        {signal.userFriendlyExplanation && (
                            <p className="text-xs text-muted-foreground">{signal.userFriendlyExplanation}</p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">Güven Skoru: %{signal.confidence}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
