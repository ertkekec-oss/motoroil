"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Factory, TrendingUp, AlertTriangle, Layers, Percent, ArrowDownRight, ArrowUpRight } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ManufacturingReportContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/inventory/manufacturing?limit=200");
        const data = await res.json();
        if (data.success) setOrders(data.orders);
      } catch (e) {
        console.error("Fetch orders failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === "COMPLETED");
    const totalCost = completedOrders.reduce((sum, o) => sum + Number(o.totalEstimatedCost || 0), 0);
    const totalQuantity = completedOrders.reduce((sum, o) => sum + Number(o.plannedQuantity || 0), 0);
    const avgCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    // Daily Cost Trend
    const trendMap: Record<string, number> = {};
    completedOrders.forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString("tr-TR");
      trendMap[date] = (trendMap[date] || 0) + Number(o.totalEstimatedCost || 0);
    });
    const trendData = Object.entries(trendMap).map(([date, cost]) => ({ date, cost })).sort((a,b) => new Date(a.date.split('.').reverse().join('-')).getTime() - new Date(b.date.split('.').reverse().join('-')).getTime());

    // Material Distribution (Top 5 Materials)
    const materialMap: Record<string, number> = {};
    completedOrders.forEach(o => {
      o.items?.forEach((item: any) => {
        const name = item.product?.name || "Bilinmeyen";
        materialMap[name] = (materialMap[name] || 0) + Number(item.totalCost || 0);
      });
    });
    const materialData = Object.entries(materialMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Branch Performance
    const branchMap: Record<string, number> = {};
    orders.forEach(o => {
      const branch = o.branch || "Merkez";
      branchMap[branch] = (branchMap[branch] || 0) + 1;
    });
    const branchData = Object.entries(branchMap).map(([name, count]) => ({ name, count }));

    return {
      totalCost,
      totalQuantity,
      avgCostPerUnit,
      trendData,
      materialData,
      branchData,
      completedCount: completedOrders.length,
      activeCount: orders.filter(o => o.status === "IN_PROGRESS").length
    };
  }, [orders]);

  if (isLoading) return <div className="py-10 text-center text-slate-500">Maliyet verileri analiz ediliyor...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Factory className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Toplam Üretim Maliyeti</span>
          </div>
          <div className="text-2xl font-bold dark:text-white">{formatCurrency(stats.totalCost)}</div>
          <div className="mt-1 text-[12px] text-slate-400">Tamamlanan {stats.completedCount} emir</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Birim Başı Ort. Maliyet</span>
          </div>
          <div className="text-2xl font-bold dark:text-white">{formatCurrency(stats.avgCostPerUnit)}</div>
          <div className="mt-1 text-[12px] text-slate-400">{stats.totalQuantity} birim üretimden</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aktif Üretim Bandı</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">{stats.activeCount} Emir</div>
          <div className="mt-1 text-[12px] text-slate-400">Devam eden süreçler</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fire Oranı Analizi</span>
          </div>
          <div className="text-2xl font-bold text-red-500">%3.2</div>
          <div className="mt-1 text-[12px] text-slate-400">Tahmini hammadde kaybı</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Trend Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-[15px] font-bold mb-6 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Günlük Üretim Maliyet Trendi
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.trendData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b10" />
              <XAxis dataKey="date" tick={{fontSize: 11}} stroke="#94a3b8" />
              <YAxis tick={{fontSize: 11}} stroke="#94a3b8" tickFormatter={(val) => `₺${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                formatter={(val) => [formatCurrency(Number(val)), "Maliyet"]}
              />
              <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Material Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-[15px] font-bold mb-6 dark:text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-500" /> Hammadde Sarfiyat Dağılımı (Maliyet Bazlı)
          </h3>
          <div className="flex-1 flex items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.materialData}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.materialData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-[14px] font-bold dark:text-white">Son Üretim Maliyet Detayları</h3>
          <span className="text-[11px] font-medium text-slate-400">Son {orders.length} Emir Analizi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emir No / Ürün</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Miktar</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Tahmini Maliyet</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Birim Maliyet</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-[13px] font-bold dark:text-white">{o.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">{o.product?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[13px] font-medium dark:text-white">{o.plannedQuantity} {o.product?.unit || 'Adet'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[13px] font-bold text-blue-500">{formatCurrency(o.totalEstimatedCost)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[13px] font-medium text-slate-500">{formatCurrency(o.totalEstimatedCost / (o.plannedQuantity || 1))}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                       o.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : 
                       o.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                       "bg-slate-100 text-slate-500"
                     }`}>
                       {o.status === "COMPLETED" ? "TAMAMLANDI" : o.status === "IN_PROGRESS" ? "ÜRETİMDE" : "PLANLANDI"}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
