import React from 'react';
import { Lightbulb, Info } from 'lucide-react';

const Card = (p: any) => <div className={`border shadow-sm rounded-lg ${p.className || ''}`}>{p.children}</div>;
const CardHeader = (p: any) => <div className="p-4 border-b">{p.children}</div>;
const CardTitle = (p: any) => <h3 className="font-semibold">{p.children}</h3>;
const CardContent = (p: any) => <div className="p-4">{p.children}</div>;
const Badge = (p: any) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{p.children}</span>;
const Button = (p: any) => <button className={`px-3 py-1 bg-blue-600 text-white rounded text-sm ${p.className || ''}`} onClick={p.onClick}>{p.children}</button>;

interface TenantInsightProps {
    insights: any[];
    isLoading: boolean;
    onActionClick: (action: string) => void;
}

export function TenantInsightsWidget({ insights, isLoading, onActionClick }: TenantInsightProps) {
    if (isLoading) {
        return (
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Önerilen Aksiyonlar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-16 bg-muted animate-pulse rounded-md" />
                </CardContent>
            </Card>
        );
    }

    if (!insights || insights.length === 0) {
        return (
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Önerilen Aksiyonlar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <Info className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Bugün sizin için aktif bir öneri bulunmuyor.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border bg-slate-50 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-emerald-600" />
                    Bugün Öncelikli Önerileriniz
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {insights?.map((insight) => (
                    <div key={insight.id} className="flex flex-col gap-2 p-3 bg-white border border-emerald-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                            <Badge variant={insight.priority === 1 ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-semibold">
                                {insight.insightType.replace('_', ' ')}
                            </Badge>
                            {insight.categoryId && <span className="text-[10px] font-semibold text-muted-foreground">{insight.categoryId}</span>}
                            <span className="ml-auto text-xs font-semibold text-emerald-600">{insight.score}/100</span>
                        </div>

                        <p className="text-sm font-medium">{insight.summary}</p>
                        {insight.userFriendlyExplanation && (
                            <p className="text-xs text-muted-foreground">{insight.userFriendlyExplanation}</p>
                        )}

                        <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="default" className="text-xs h-8" onClick={() => onActionClick(insight.recommendedAction)}>
                                {insight.recommendedAction.replace(/_/g, ' ')}
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
