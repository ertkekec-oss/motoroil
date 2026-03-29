const fs = require('fs');
let file = 'src/app/(app)/staff/me/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. O kaba Progress Bar bileşenini çok daha ince, zarif ve "Pill" yapısına oturtalım.
const newProgressBar = `const ProgressBar = ({ label, value, max, color = "#3b82f6" }: any) => {
    const percentage = Math.min((value / max) * 100, 100) || 0;
    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="text-slate-500">{label}</span>
                <span style={{ color }}>%{percentage.toFixed(0)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000 ease-out rounded-full" style={{ width: \`\${percentage}%\`, background: color }} />
            </div>
            <div className="flex justify-end text-[9px] text-slate-400 mt-1 font-bold">
                {Number(value).toLocaleString()} / {Number(max).toLocaleString()}
            </div>
        </div>
    );
};`;
txt = txt.replace(/const ProgressBar = \(\{[\s\S]*?\};\n/m, newProgressBar + '\n');

// Profil header'i boşaltılı kaldı zaten. TopPills ve SoftContainer kalıplarını ekleyelim.
const genericUI = `
const TopPills = ({ pills }: any) => (
    <div className="flex flex-wrap items-center gap-3 shrink-0 mb-6 w-full">
        {pills.map((p: any, i: number) => (
            <div key={i} className="flex bg-white dark:bg-[#1e293b]/50 rounded-[100px] pl-3 pr-6 py-2.5 items-center gap-4 w-max transition-transform cursor-default ring-0 border-none shadow-none">
                <div className={\`w-10 h-10 rounded-full flex items-center justify-center shrink-0 \${p.bg} \${p.color}\`}>
                    {p.icon}
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">{p.title}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">{p.value}</span>
                </div>
            </div>
        ))}
    </div>
);

const SoftContainer = ({ title, icon, children, className="" }: any) => (
    <div className={\`bg-white dark:bg-[#1e293b]/50 rounded-[32px] p-6 lg:p-8 flex flex-col \${className} ring-0 border-none shadow-none\`}>
        {title && (
            <div className="flex items-center gap-2 mb-6 text-[12px] font-black uppercase tracking-widest text-slate-500">
                <span className="text-slate-400">{icon}</span>
                <h3>{title}</h3>
            </div>
        )}
        <div className="flex-1">
            {children}
        </div>
    </div>
);
`;

// Generic UI'ı sayfa başına koyalım
if(!txt.includes('const TopPills')) {
    txt = txt.replace('// ─── DASHBOARD VIEW', genericUI + '\n// ─── DASHBOARD VIEW');
}

// Olası Raporlar & Diğer Kısımlarda EnterpriseSectionHeader kullanımı tamamen SoftContainer'a çevrilmeli.
// Hedefler, Görevler, Vardiya'yı yeniden yazıyoruz.

const targetsStart = txt.indexOf('// ─── TARGETS VIEW');
const tasksStart = txt.indexOf('// ─── TASKS VIEW');
const newTargetsView = `// ─── TARGETS VIEW ────────────────────────────────────────────────────
const TargetsView = ({ targets, statsData, user }: any) => {
    const totalTarget = targets?.reduce((sum: any, t: any) => sum + Number(t.targetValue), 0) || 0;
    const totalActual = targets?.reduce((sum: any, t: any) => sum + Number(t.currentValue), 0) || 0;
    const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const activeTargetsCount = targets?.filter((t: any) => t.status !== 'İptal' && t.currentValue < t.targetValue).length || 0;
    const completedTargetsCount = targets?.filter((t: any) => t.currentValue >= t.targetValue).length || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[
                { title: 'AKTİF HEDEFLER', value: activeTargetsCount, icon: <Target className="w-5 h-5"/>, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500' },
                { title: 'ULAŞILAN HEDEFLER', value: completedTargetsCount, icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500' },
                { title: 'GENEL BAŞARI', value: \`%\${overallProgress}\`, icon: <TrendingUp className="w-5 h-5"/>, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' }
            ]} />

            <SoftContainer title="Dönemsel Performans Tablosu" icon={<Target className="w-5 h-5" />} className="min-h-[400px]">
                {targets?.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Target className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">HEDEF ATAMASI BULUNMUYOR</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Bu dönem için henüz sizin adınıza planlanmış bir performans hedefi yok.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">HEDEF TÜRÜ</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50">DURUM</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 dark:border-slate-800/50">KOTA / GERÇEKLEŞEN</th>
                                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48 border-b border-slate-100 dark:border-slate-800/50 pr-4 text-right">PERFORMANS BARI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                {targets.map((t: any) => {
                                    const progress = t.targetValue > 0 ? Math.round((t.currentValue / t.targetValue) * 100) : 0;
                                    const isCompleted = progress >= 100;
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        {t.type === 'TURNOVER' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{t.title || 'Hedef'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">DÖNEM: {new Date(t.startDate).toLocaleDateString('tr-TR')} - {new Date(t.endDate).toLocaleDateString('tr-TR')}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 align-middle">
                                                {isCompleted ? <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">BAŞARILI</span> : <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">DEVAM EDİYOR</span>}
                                            </td>
                                            <td className="py-4 align-middle text-right">
                                                <div className="text-[13px] font-black text-slate-800 dark:text-white">{t.type === 'TURNOVER' ? \`₺\${Number(t.currentValue).toLocaleString()}\` : t.currentValue}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">/ {t.type === 'TURNOVER' ? \`₺\${Number(t.targetValue).toLocaleString()}\` : t.targetValue}</div>
                                            </td>
                                            <td className="py-4 align-middle pr-4">
                                                <ProgressBar label="" value={t.currentValue} max={t.targetValue} color={isCompleted ? "#10b981" : "#3b82f6"} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </SoftContainer>
            <div className="h-10"></div>
        </div>
    );
};
`;

if (targetsStart !== -1 && tasksStart !== -1) {
    txt = txt.replace(txt.substring(targetsStart, tasksStart), newTargetsView + '\n');
}

const shiftsStart = txt.indexOf('// ─── SHIFTS VIEW');
const profileStart = txt.indexOf('// ─── PROFILE SETTINGS VIEW');
const newShiftsView = `// ─── SHIFTS VIEW ──────────────────────────────────────────────────────
const ShiftsView = ({ shifts, user }: any) => {
    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[
                { title: 'PLANLANMIŞ VARDİYA', value: shifts?.length || 0, icon: <Calendar className="w-5 h-5"/>, bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-500' }
            ]} />
            
            <SoftContainer title="Haftalık Vardiya Planım" icon={<Calendar className="w-5 h-5"/>}>
                {shifts?.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">VARDİYA BULUNMUYOR</h4>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shifts.map((s: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 flex flex-col gap-4 border-none ring-0 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center mb-1">
                                    <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">{new Date(s.start).toLocaleDateString('tr-TR', { weekday: 'long' })}</span>
                                    <span>{new Date(s.start).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}</span>
                                </div>
                                <div className="text-[16px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-none">{s.type} VARDİYASI</div>
                                <div className="text-[16px] font-mono font-black text-slate-600 dark:text-slate-300 mt-2">
                                    {new Date(s.start).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - {new Date(s.end).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SoftContainer>
            <div className="h-10"></div>
        </div>
    );
};
`;

if (shiftsStart !== -1 && profileStart !== -1) {
    txt = txt.replace(txt.substring(shiftsStart, profileStart), newShiftsView + '\n');
}

const leavesStart = txt.indexOf('// ─── LEAVES VIEW');
const newTasksView = `// ─── TASKS VIEW ──────────────────────────────────────────────────────
const TasksView = ({ user, tasks=[], fetchTasks, loading }: any) => {
    const [subTab, setSubTab] = useState<'pending' | 'completed' | 'all'>('pending');
    
    const displayTasks = tasks.filter((t: any) => {
        if (subTab === 'pending') return t.status !== 'Tamamlandı' && t.status !== 'İptal';
        if (subTab === 'completed') return t.status === 'Tamamlandı';
        return true;
    });

    const pendingCount = tasks.filter((t: any) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length || 0;
    const completedCount = tasks.filter((t: any) => t.status === 'Tamamlandı').length || 0;

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <TopPills pills={[
                { title: 'BEKLEYEN GÖREV', value: pendingCount, icon: <Clock className="w-5 h-5"/>, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' },
                { title: 'TAMAMLANAN', value: completedCount, icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-500' }
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SoftContainer title="Bana Atanan Görevler" icon={<Briefcase className="w-5 h-5"/>} className="min-h-[400px]">
                    <div className="flex gap-2 mb-6">
                        <button onClick={() => setSubTab('pending')} className={\`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors border-none ring-0 shadow-none \${subTab==='pending' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'}\`}>Devam Edenler</button>
                        <button onClick={() => setSubTab('completed')} className={\`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors border-none ring-0 shadow-none \${subTab==='completed' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'}\`}>Tamamlandı</button>
                    </div>
                    {displayTasks.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                            <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">GÖREV BULUNMUYOR</h4>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {displayTasks.map((t: any) => (
                                <div key={t.id} className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border-none ring-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest leading-snug pr-4">{t.title}</div>
                                        {t.priority === 'HIGH' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full shrink-0">YÜKSEK</span>}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.status}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </SoftContainer>

                <SoftContainer title="Görev Rapor Merkezi" icon={<FileText className="w-5 h-5"/>} className="min-h-[400px]">
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-400 gap-3 text-center py-20">
                        <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
                        <h4 className="text-[12px] font-black uppercase tracking-widest mt-2 block leading-none">LİSTEDEN BİR GÖREV SEÇEREK RAPOR EKRANINI AÇIN</h4>
                    </div>
                </SoftContainer>
            </div>
            <div className="h-10"></div>
        </div>
    );
};
`;
if (tasksStart !== -1 && leavesStart !== -1) {
    txt = txt.replace(txt.substring(tasksStart, leavesStart), newTasksView + '\n');
}

// ─── REPORTS VIEW REWRITE ──────────────────────────────────────────────────
const reportsStart = txt.indexOf('// ─── REPORTS VIEW');
const reportsEnd = txt.indexOf('// ─── MAIN PAGE');
if (reportsStart !== -1 && reportsEnd !== -1) {
    // We rewrite the ReportsView to use SoftContainer and TopPills (if any), removing EnterpriseSectionHeader
    let reportsTxt = txt.substring(reportsStart, reportsEnd);
    reportsTxt = reportsTxt.replace(/<EnterpriseSectionHeader title="Dönemsel Operasyon Raporu & KPI" icon="📊" \/>/g, '');
    reportsTxt = reportsTxt.replace(/<EnterpriseCard className="h-full flex flex-col min-h-\[400px\]">/g, 
        '<SoftContainer title="Dönemsel Operasyon Raporu & KPI" icon={<TrendingUp className="w-5 h-5"/>} className="min-h-[400px] w-full">');
    reportsTxt = reportsTxt.replace(/<\/EnterpriseCard>/g, '</SoftContainer>');
    reportsTxt = reportsTxt.replace(/<div className="p-4 border-b border-default[\s\S]*?<\/div>/, (match) => {
        return `<div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                 <div className="flex gap-4 w-full sm:w-auto">
                    <EnterpriseInput label="Operasyon Başlangıcı" type="date" value={dateRange.startDate} onChange={(e:any) => setDateRange({ ...dateRange, startDate: e.target.value })} />
                    <EnterpriseInput label="Operasyon Bitişi" type="date" value={dateRange.endDate} onChange={(e:any) => setDateRange({ ...dateRange, endDate: e.target.value })} />
                 </div>
              </div>`;
    });
    // Remove the generic white background from report body
    reportsTxt = reportsTxt.replace(/<div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-surface dark:bg-\[\#0f172a\]">/g, '<div className="flex-1">');
    // Fix error message layout
    reportsTxt = reportsTxt.replace(/<div className="py-8 text-center text-\[10px\] font-black uppercase tracking-widest text-state-alert-text bg-state-alert-bg\/30 rounded-sm border border-state-alert-border">/g, 
        '<div className="py-12 flex flex-col items-center justify-center text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-none ring-0">');
    txt = txt.replace(txt.substring(reportsStart, reportsEnd), reportsTxt);
}

fs.writeFileSync(file, txt);
console.log('Tüm sekmeler (Görevler, Hedefler, Vardiya, Raporlar) tam SoftContainer formatına getirildi.');
