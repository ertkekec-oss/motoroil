"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/lib/utils";
import { Clock, PlayCircle, CheckCircle2, Factory, FileText, Check, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect } from "react";

const KANBAN_COLUMNS = [
  { id: "DRAFT", title: "Taslak", icon: FileText, color: "text-slate-500", bgLight: "bg-slate-100 dark:bg-slate-800", borderLight: "border-slate-200 dark:border-slate-700" },
  { id: "PLANNED", title: "Planlandı (Malzeme Ayrıldı)", icon: Clock, color: "text-blue-500", bgLight: "bg-blue-50 dark:bg-blue-900/20", borderLight: "border-blue-200 dark:border-blue-800" },
  { id: "IN_PROGRESS", title: "Üretimde", icon: PlayCircle, color: "text-amber-500", bgLight: "bg-amber-50 dark:bg-amber-900/20", borderLight: "border-amber-200 dark:border-amber-800" },
  { id: "COMPLETED", title: "Tamamlandı (Stoğa Girdi)", icon: CheckCircle2, color: "text-emerald-500 text-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-900/20", borderLight: "border-emerald-200 dark:border-emerald-800" },
];

export default function KanbanBoard({ 
    orders, 
    handleUpdateStatus, 
    setSelectedOrder 
}: { 
    orders: any[], 
    handleUpdateStatus: (id: string, current: string, next: string) => void,
    setSelectedOrder: (order: any) => void
}) {
    const { theme } = useTheme();
    const { hasPermission } = useApp();
    const isLight = theme === "light";
    const canManage = hasPermission("inventory_manage");

    const [boardData, setBoardData] = useState<Record<string, any[]>>({});
    const [isDnDReady, setIsDnDReady] = useState(false);

    useEffect(() => {
        setIsDnDReady(true);
    }, []);

    useEffect(() => {
        const newData: Record<string, any[]> = {
            DRAFT: [], PLANNED: [], IN_PROGRESS: [], COMPLETED: []
        };
        const visibleOrders = orders.filter(o => o.status !== "CANCELED");

        visibleOrders.forEach(o => {
            if (newData[o.status]) newData[o.status].push(o);
        });
        setBoardData(newData);
    }, [orders]);

    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        if (!canManage) return;

        const sourceCol = result.source.droppableId;
        const destCol = result.destination.droppableId;
        
        if (sourceCol === destCol) return;

        const draggedOrderId = result.draggableId;
        
        const sourceOrders = [...boardData[sourceCol]];
        const destOrders = [...boardData[destCol]];
        const [movedOrder] = sourceOrders.splice(result.source.index, 1);
        destOrders.splice(result.destination.index, 0, movedOrder);

        setBoardData({
            ...boardData,
            [sourceCol]: sourceOrders,
            [destCol]: destOrders
        });

        handleUpdateStatus(draggedOrderId, sourceCol, destCol);
    };

    if (!isDnDReady) return <div className="p-10 flex flex-col items-center justify-center opacity-50"><Factory className="w-8 h-8 animate-pulse mb-2 text-slate-400"/><span className="text-[12px] font-black uppercase tracking-widest text-slate-500">Tahta Yükleniyor...</span></div>;

    const columnClass = "bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80";
    const cardClass = "bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800/80 shadow-sm";
    const textValueClass = "text-slate-900 dark:text-white";
    const textLabelClass = "text-slate-500 dark:text-slate-400";

    return (
        <div className="animate-in fade-in duration-300">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-[calc(100vh-220px)] overflow-x-auto pb-4 custom-scroll relative z-10 w-full">
                    {KANBAN_COLUMNS.map(col => {
                        const items = boardData[col.id] || [];

                        return (
                            <div key={col.id} className={`flex flex-col min-w-[340px] w-[340px] rounded-[24px] overflow-hidden shadow-sm ${columnClass}`}>
                                {/* Header */}
                                <div className={`flex items-center justify-between p-4 border-b ${col.borderLight} ${col.bgLight}`}>
                                    <div className="flex items-center gap-2">
                                        <col.icon className={`w-4 h-4 ${col.color}`} />
                                        <h3 className={`text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200`}>{col.title}</h3>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[12px] font-black tracking-widest bg-white/50 dark:bg-black/20 ${col.color}`}>
                                        {items.length}
                                    </div>
                                </div>

                                {/* Body */}
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 p-3 overflow-y-auto custom-scroll space-y-3 transition-colors ${snapshot.isDraggingOver ? "bg-slate-200/40 dark:bg-slate-800/40" : ""}`}
                                        >
                                            {items.map((order, index) => (
                                                <Draggable key={order.id} draggableId={order.id} index={index} isDragDisabled={!canManage}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={(e) => {
                                                                if (e.defaultPrevented) return;
                                                                setSelectedOrder(order);
                                                            }}
                                                            className={`p-5 rounded-[20px] border cursor-pointer select-none transition-all duration-200 
                                                                ${cardClass} 
                                                                ${snapshot.isDragging ? "rotate-2 scale-105 shadow-2xl z-50 ring-2 ring-indigo-500/50 dark:ring-indigo-500/50" : "hover:-translate-y-1 hover:shadow-md hover:border-indigo-400/50 dark:hover:border-indigo-500/50"}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full ${textLabelClass}`}>
                                                                    {order.orderNumber}
                                                                </div>
                                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${textLabelClass}`}>
                                                                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                                                                </div>
                                                            </div>

                                                            <div className={`text-[14px] font-[900] leading-tight mb-4 ${textValueClass}`}>
                                                                {order.product?.name}
                                                            </div>

                                                            <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                                                                <div>
                                                                    <div className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5 ${textLabelClass}`}>HEDEF ADET</div>
                                                                    <div className={`text-[16px] font-[900] tabular-nums ${textValueClass}`}>
                                                                        {order.plannedQuantity}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 opacity-80">
                                                                    <Factory className={`w-3.5 h-3.5 ${textLabelClass}`} />
                                                                    <span className={`text-[11px] font-bold ${textLabelClass}`}>{order.branch}</span>
                                                                </div>
                                                            </div>

                                                            {/* Gecikme Uyarı */}
                                                            {order.status === 'PLANNED' && new Date(order.createdAt) < new Date(Date.now() - 48 * 60 * 60 * 1000) && (
                                                                <div className="mt-4 flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    <span className="text-[10px] font-black tracking-widest uppercase">48 Saati Geçti</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
