import React from "react";
import { Activity, Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

const Card = (p: any) => (
  <div className={`border shadow-sm rounded-lg ${p.className || ""}`}>
    {p.children}
  </div>
);
const CardHeader = (p: any) => <div className="p-4 border-b">{p.children}</div>;
const CardTitle = (p: any) => <h3 className="font-semibold">{p.children}</h3>;
const CardContent = (p: any) => <div className="p-4">{p.children}</div>;

interface CategoryHeatProps {
  categories: any[];
  isLoading: boolean;
}

export function CategoryHeatMiniBoard({
  categories,
  isLoading,
}: CategoryHeatProps) {
  if (isLoading) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Pazar Isı Haritası
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Pazar Isı Haritası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Hiçbir kategori hareketi algılanmadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Sektörel Hareketlilik
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="flex flex-col gap-1">
          {categories.slice(0, 5)?.map((cat, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 rounded hover:bg-muted/50 transition"
            >
              <span className="text-sm font-medium">{cat.categoryId}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {cat.maxIntensity}%
                </span>
                {cat.trendDirection === "UP" && (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                )}
                {cat.trendDirection === "DOWN" && (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                {cat.trendDirection === "FLAT" && (
                  <Minus className="h-4 w-4 text-slate-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
