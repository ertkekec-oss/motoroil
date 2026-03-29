const fs = require('fs');
let file = 'c:\\Users\\ertke\\OneDrive\\Masaüstü\\periodya\\muhasebeapp\\motoroil\\src\\app\\(app)\\staff\\me\\page.tsx';
let txt = fs.readFileSync(file, 'utf8');

function replaceSection(text, startMarker, endMarker, newContent) {
    let startIdx = text.indexOf(startMarker);
    let endIdx = text.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) return text;
    return text.substring(0, startIdx) + newContent + '\n\n' + text.substring(endIdx);
}

// ==========================================
// 1. DASHBOARD VIEW (ÖZET / PDKS)
// ==========================================
const newDashboardView = `// ─── DASHBOARD VIEW ──────────────────────────────────────────────────
const DashboardView = ({
    handleQrCheckin, handleGpsCheckin, isScannerOpen, setIsScannerOpen, onQrScan, pdksStatus, handleCheckout,
    targets = [], statsData, turnover, shifts = [], payrolls = [], tasks = [], user
}: any) => {
    const activeTasksCount = tasks.filter((t: any) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length;
    const totalTarget = targets?.reduce((sum: any, t: any) => sum + Number(t.targetValue), 0) || 0;
    const totalActual = targets?.reduce((sum: any, t: any) => sum + Number(t.currentValue), 0) || 0;
    const overallProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const totalEstBonus = targets?.reduce((sum: any, t: any) => sum + Number(t.estimatedBonus || 0), 0) || 0;

    const displayAchievement = targets?.length > 0 ? \`%\${overallProgress}\` : (statsData?.stats?.achievement || '%0.0');
    const displayBonus = targets?.length > 0 ? \`₺\${totalEstBonus.toLocaleString('tr-TR')}\` : (statsData?.stats?.bonus || '₺0,00');

    return (
        <div className="flex flex-col animate-in fade-in duration-500 min-h-full gap-6">
            <div className="flex flex-wrap items-center gap-4 shrink-0 mb-4 w-full">
                <div className="flex bg-white dark:bg-slate-800 rounded-[100px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-blue-500">
                        <IconActivity className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Günlük Cirom</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">₺{(turnover || 0).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-slate-800 rounded-[100px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-emerald-500">
                        <IconTrendingUp className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Hedef (Ay)</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayAchievement}</span>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-slate-800 rounded-[100px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-orange-500">
                        <IconClock className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Bekleyen Görev</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{activeTasksCount}</span>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-slate-800 rounded-[100px] pl-3 pr-6 py-2.5 items-center gap-4 w-max shadow-sm transition-transform cursor-default">
                    <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-slate-700/50 flex flex-shrink-0 items-center justify-center text-purple-500">
                        <DollarSign className="w-5 h-5"/>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Kazanılan Prim</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none mt-1">{displayBonus}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                {/* 1. PDKS BOX (Fotograf 1 Tasarimi) */}
                <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-[#64748b]"><IconZap className="w-4 h-4" /> PDKS DOĞRULAMASI</h3>
                        {!pdksStatus?.isWorking ? <span className="text-[10px] uppercase font-bold text-slate-800 tracking-widest">KAPALI</span> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                     </div>
                     <div className="bg-white dark:bg-[#1e293b]/50 rounded-[32px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-8 flex flex-col justify-center min-h-[160px]">
                        {!pdksStatus?.isWorking ? (
                            <div className="flex gap-4 w-full">
                                <button onClick={handleQrCheckin} className="flex-1 flex items-center justify-center gap-3 h-16 bg-[#f8fafc] dark:bg-white/5 hover:bg-slate-100 rounded-[20px] outline-none transition-colors border-none ring-0">
                                    <Printer className="w-5 h-5 text-slate-800 dark:text-slate-300" />
                                    <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Ofis QR (Lokal)</span>
                                </button>
                                <button onClick={handleGpsCheckin} className="flex-1 flex items-center justify-center gap-3 h-16 bg-[#f8fafc] dark:bg-white/5 hover:bg-slate-100 rounded-[20px] outline-none transition-colors border-none ring-0">
                                    <Flag className="w-5 h-5 text-slate-800 dark:text-slate-300" />
                                    <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Saha GPS (Dış)</span>
                                </button>
                            </div>
                        ) : (
                                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                    <div className="flex-1">
                                        <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px] mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> VERİ DOĞRULANDI</p>
                                        <div className="text-xl font-mono font-black text-slate-800">
                                            {pdksStatus.activeSession?.checkIn ? new Date(pdksStatus.activeSession.checkIn).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                                        </div>
                                    </div>
                                    <button onClick={handleCheckout} className="h-12 px-8 bg-rose-600 hover:bg-rose-700 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-none outline-none transition-colors">
                                        PASİFE AL
                                    </button>
                                </div>
                        )}
                     </div>
                </div>

                {/* 2. VARDİYA BOX (Fotograf 1 Tasarimi) */}
                <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-[#64748b]"><IconClock className="w-4 h-4" /> SIRADAKİ VARDİYA</h3>
                     </div>
                     <div className="bg-white dark:bg-[#1e293b]/50 rounded-[32px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] p-8 flex flex-col justify-center min-h-[160px]">
                        {shifts.length > 0 ? (
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white border border-slate-200 dark:border-slate-700 rounded-[24px] flex items-center justify-center">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white">{new Date(shifts[0]?.start).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</span>
                                </div>
                                <div>
                                    <div className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-1">{shifts[0]?.type} VARDİYASI</div>
                                    <p className="text-[12px] font-bold text-slate-600 dark:text-slate-400 font-mono tracking-widest uppercase">
                                        {shifts[0]?.type === 'İzinli' ? 'Tam Gün İzinli' : \`\${new Date(shifts[0]?.start).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - \${new Date(shifts[0]?.end).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}\`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
                                PLANLI VARDİYA BULUNMUYOR
                            </div>
                        )}
                     </div>
                </div>
            </div>
            <BarcodeScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={onQrScan} />
        </div>
    );
};`;
txt = replaceSection(txt, '// ─── DASHBOARD VIEW', '// ─── TARGETS VIEW', newDashboardView);


// ==========================================
// 2. SHIFTS VIEW (VARDİYA PANELİ)
// ==========================================
const newShiftsView = `// ─── SHIFTS VIEW ──────────────────────────────────────────────────────
const ShiftsView = ({ shifts, user }: any) => {
    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm min-h-[400px]">
                <div className="flex items-center justify-center flex-col gap-3 mb-12 mt-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center"><Calendar className="w-5 h-5"/></div>
                    <h3 className="text-[16px] font-black tracking-widest uppercase text-slate-800 dark:text-white">Haftalık Vardiya Planım</h3>
                </div>
                
                {shifts?.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-widest leading-none">VARDİYA BULUNMUYOR</h4>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-6 justify-center">
                        {shifts.map((s: any, idx: number) => (
                            <div key={idx} className="flex flex-col w-[340px] shrink-0 border border-slate-100 dark:border-white/5 rounded-[24px] p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black tracking-widest uppercase text-slate-800 dark:text-white">{new Date(s.start).toLocaleDateString('tr-TR', { weekday: 'long' })}</span>
                                    <IconClock className="w-3.5 h-3.5 text-slate-400"/>
                                </div>
                                <p className="text-[12px] font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-widest">{new Date(s.start).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                <div className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-center text-[12px] font-black tracking-widest text-slate-800 dark:text-white font-mono">
                                    {new Date(s.start).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})} - {new Date(s.end).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};`;
txt = replaceSection(txt, '// ─── SHIFTS VIEW', '// ─── LEAVES VIEW', newShiftsView);


// ==========================================
// 3. LEAVES VIEW (İZİNLER PANELİ)
// ==========================================
const newLeavesView = `// ─── LEAVES VIEW ──────────────────────────────────────────────────────
const LeavesView = ({ user }: any) => {
    // Aynı verileri ve print metodunu simüle edelim, gereksizleri kestik, salt UI yazıyoruz.
    const { fetchPersonelData } = useApp();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('Yıllık İzin');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [printableLeave, setPrintableLeave] = useState<any>(null);

    const fetchLeaves = async () => {
        try { const res = await fetch(\`/api/staff/leaves?staffId=\${user.id}\`); const d = await res.json(); setLeaves(d || []); }
        catch (e) { } finally { setLoading(false); }
    };
    useEffect(() => { if (user?.id) fetchLeaves(); }, [user]);

    const handleSubmit = async () => {
        if (!startDate || !endDate || !reason) return toast.error("Tüm alanları doldurunuz.");
        const _s = new Date(startDate); const _e = new Date(endDate);
        if (_s > _e) return toast.error("Bitiş tarihi başlangıçtan önce olamaz.");
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/staff/leaves', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId: user.id, type, startDate, endDate, reason, days: Math.ceil(Math.abs(_e.getTime() - _s.getTime()) / (1000 * 60 * 60 * 24)) + 1 })
            });
            if (res.ok) { toast.success("Talebiniz İK'ya ulaştı."); setStartDate(''); setEndDate(''); setReason(''); fetchLeaves(); }
        } finally { setIsSubmitting(false); }
    };

    const handlePrint = (leave: any) => { setPrintableLeave(leave); setTimeout(() => window.print(), 200); };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 gap-6">
            <style>{printStyles}</style>

            <div className="flex gap-6 items-start">
                {/* 1. YENİ TALEP KUTUSU */}
                <div className="w-[380px] shrink-0 bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-slate-50 dark:border-white/5 flex flex-col gap-6">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Calendar className="w-5 h-5"/>
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-[#64748b]">YENİ TALEP OLUŞTUR</h3>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                           <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">İzin Türü</span>
                           <select className="w-full bg-[#f8fafc] dark:bg-slate-700/50 rounded-[16px] border-none px-4 py-3 text-[12px] font-bold text-slate-800 dark:text-white outline-none ring-0" value={type} onChange={e=>setType(e.target.value)}>
                               <option value="Yıllık İzin">Yıllık Ücretli İzin</option><option value="Mazeret İzni">Mazeret İzni</option><option value="Sağlık İzni">Sağlık İzni</option><option value="Ücretsiz İzin">Ücretsiz İzin</option>
                           </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col gap-2">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Başlangıç Seçimi</span>
                               <input type="date" className="w-full bg-[#f8fafc] dark:bg-slate-700/50 rounded-[16px] border-none px-4 py-3 text-[12px] font-bold text-slate-800 dark:text-white outline-none ring-0 focus:ring-0" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
                           </div>
                           <div className="flex flex-col gap-2">
                               <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Bitiş Seçimi</span>
                               <input type="date" className="w-full bg-[#f8fafc] dark:bg-slate-700/50 rounded-[16px] border-none px-4 py-3 text-[12px] font-bold text-slate-800 dark:text-white outline-none ring-0 focus:ring-0" value={endDate} onChange={e=>setEndDate(e.target.value)}/>
                           </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Dilekçe İçeriği / E-Posta Notu</span>
                           <textarea className="w-full bg-[#f8fafc] dark:bg-slate-700/50 rounded-[20px] border-none px-4 py-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none ring-0 resize-none h-32" placeholder="Ek açıklama..." value={reason} onChange={e=>setReason(e.target.value)}></textarea>
                        </div>

                        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02]">
                            {isSubmitting ? 'GÖNDERİLİYOR...' : 'DİLEKÇEYİ ONAYA SUN'}
                        </button>
                    </div>
                </div>

                {/* 2. İZİN SİCİL TABLOSU */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-slate-50 dark:border-white/5 min-h-[500px]">
                    <div className="flex flex-col items-center justify-center gap-3 mb-10 mt-4">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-2xl flex items-center justify-center"><Clock className="w-5 h-5"/></div>
                        <h3 className="text-[16px] font-black tracking-widest uppercase text-slate-800 dark:text-white">İzin Sicilim</h3>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">BELGE & TÜR</th>
                                <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">TARİH ARALIĞI / SÜRE</th>
                                <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">SİSTEM DURUMU</th>
                                <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">AKSİYONER (İK)</th>
                                <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest text-right border-b border-slate-100 dark:border-white/5">BELGE İŞLEMİ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">ARŞİVDE EVRAK YOK.</td></tr> :
                             leaves.map((l: any) => (
                                <tr key={l.id}>
                                    <td className="py-5 border-b border-slate-50 dark:border-slate-700/50">
                                        <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{l.type}</div>
                                        <div className="text-[9px] font-bold text-slate-400 font-mono tracking-widest mt-1 uppercase">DOC: {l.id.substring(0,8)}</div>
                                    </td>
                                    <td className="py-5 border-b border-slate-50 dark:border-slate-700/50">
                                        <div className="text-[11px] font-black text-slate-800 dark:text-white">{new Date(l.startDate).toLocaleDateString('tr-TR')} - {new Date(l.endDate).toLocaleDateString('tr-TR')}</div>
                                        <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">TOPLAM: {l.days} GÜN</div>
                                    </td>
                                    <td className="py-5 border-b border-slate-50 dark:border-slate-700/50">
                                        <span className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{l.status}</span>
                                    </td>
                                    <td className="py-5 border-b border-slate-50 dark:border-slate-700/50">
                                        <div className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{l.approvedBy || '-'}</div>
                                    </td>
                                    <td className="py-5 border-b border-slate-50 dark:border-slate-700/50 text-right">
                                        <button onClick={() => handlePrint(l)} className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex justify-center items-center gap-2">
                                            <Printer className="w-3.5 h-3.5"/> DİLEKÇE ÇIKTI
                                        </button>
                                    </td>
                                </tr>
                             ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="printable-area" className="hidden">
                 {printableLeave && (
                    <div className="p-10 font-[serif] text-black">
                        <h2 className="text-center text-xl font-bold uppercase mb-10 border-b-2 border-black pb-4">İzin Talep Formu / Dilekçesi</h2>
                        <div className="text-right mb-10">Tarih: {new Date(printableLeave.createdAt).toLocaleDateString('tr-TR')}</div>
                        <p className="text-lg mb-8 leading-relaxed">
                            Kurumunuzda sicil numaralı personeli <strong>{user?.name}</strong> olarak görev yapmaktayım.<br/><br/>
                            <strong>{new Date(printableLeave.startDate).toLocaleDateString('tr-TR')}</strong> ile <strong>{new Date(printableLeave.endDate).toLocaleDateString('tr-TR')}</strong> tarihleri arasında 
                            toplam <strong>{printableLeave.days} gün</strong> süreyle <strong>{printableLeave.type}</strong> kullanmak hususunda gereğini;
                        </p>
                        <p className="text-lg mt-6">Bilgilerinize arz ederim.</p>
                        <div className="mt-16 text-right w-full flex justify-end">
                            <div className="w-[300px] text-center">
                                <p className="font-bold underline mb-16">İmza</p>
                                <p className="font-bold">{user?.name}</p>
                            </div>
                        </div>
                        <div className="mt-20 border-t border-dashed border-black pt-4">
                            <h3 className="font-bold">İK Onayı / Bildirimi</h3>
                            <p className="mt-2">Sistem Durumu: {printableLeave.status}</p>
                            <p>Onaylayan: {printableLeave.approvedBy || '______________'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};`;
txt = replaceSection(txt, '// ─── LEAVES VIEW', '// ─── REPORTS VIEW', newLeavesView);


// ==========================================
// 4. PAYROLL VIEW (BORDRO PANELİ)
// ==========================================
const newPayrollView = `// ─── PAYROLL VIEW ───────────────────────────────────────────────────
const PayrollView = ({ payrolls, user }: any) => {
    const [printablePayroll, setPrintablePayroll] = useState<any>(null);
    const handlePrint = (pr: any) => { setPrintablePayroll(pr); setTimeout(() => window.print(), 200); };

    return (
        <div className="flex flex-col animate-in fade-in duration-500 w-full mb-8">
            <style>{printStyles}</style>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm min-h-[500px]">
                <div className="flex flex-col items-center justify-center gap-3 mb-12 mt-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center"><IconActivity className="w-5 h-5"/></div>
                    <h3 className="text-[16px] font-black tracking-widest uppercase text-slate-800 dark:text-white">Geçmiş Bordro ve Hakedişlerim</h3>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">DÖNEM & REFERANS</th>
                            <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">NET HAKEDİŞ (TRY)</th>
                            <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">BRÜT & EK NİTELİKLER</th>
                            <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-white/5">SİSTEM & İŞLEM DURUMU</th>
                            <th className="pb-4 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest text-right border-b border-slate-100 dark:border-white/5">BELGE GÖRÜNTÜLEME</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrolls.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">AKTİF BORDRO KAYDI BULUNMAMAKTADIR.</td></tr> :
                         payrolls.map((pr: any) => (
                            <tr key={pr.id}>
                                <td className="py-6 border-b border-slate-50 dark:border-slate-700/50">
                                    <div className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{pr.period}</div>
                                    <div className="text-[9px] font-bold text-slate-400 font-mono tracking-widest mt-1 uppercase">REF:{pr.id.substring(0,8)}</div>
                                </td>
                                <td className="py-6 border-b border-slate-50 dark:border-slate-700/50">
                                    <div className="text-[14px] font-black text-slate-800 dark:text-white tracking-widest">₺{Number(pr.netPay).toLocaleString('tr-TR')}</div>
                                </td>
                                <td className="py-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col gap-1 mt-1">
                                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Brüt: ₺{Number(pr.basePay).toLocaleString('tr-TR')}</div>
                                    <div className="text-[10px] font-bold text-slate-800 dark:text-slate-300">Aylık Prim: + ₺{Number(pr.bonus).toLocaleString('tr-TR')}</div>
                                </td>
                                <td className="py-6 border-b border-slate-50 dark:border-slate-700/50">
                                    <span className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{pr.status || 'BEKLİYOR'}</span>
                                </td>
                                <td className="py-6 border-b border-slate-50 dark:border-slate-700/50 text-right">
                                    <button onClick={() => handlePrint(pr)} className="px-5 py-2 border border-slate-300 dark:border-slate-600 rounded-full text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex justify-center items-center gap-2">
                                        <Printer className="w-3.5 h-3.5"/> PUSULA ÇIKTI
                                    </button>
                                </td>
                            </tr>
                         ))
                        }
                    </tbody>
                </table>
            </div>

            <div id="printable-area" className="hidden">
                {printablePayroll && (
                    <div className="p-10 font-sans text-black border-2 border-slate-800 m-8 rounded-xl shadow-none">
                        <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">Bordro Pusulası</h1>
                                <p className="text-sm font-bold mt-2 uppercase text-slate-600">Dönem: {printablePayroll.period}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-bold text-lg">{user?.name}</h3>
                                <p className="text-sm">Personel ID: {user?.id.slice(0, 8)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-12 border-b-2 border-slate-900 pb-8">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold">Brüt Kesinleşmiş Maaş:</span> <span>₺{Number(printablePayroll.basePay).toLocaleString()}</span></div>
                                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold">Performans / Prim Eklentisi:</span> <span>+ ₺{Number(printablePayroll.bonus).toLocaleString()}</span></div>
                                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold">Özel Kesintiler:</span> <span>- ₺{Number(printablePayroll.deductions).toLocaleString()}</span></div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-2">Net Ödenecek Hakediş</span>
                                <span className="text-4xl font-black text-slate-800">₺{Number(printablePayroll.netPay).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-sm font-medium text-slate-600 text-center italic mt-20">
                            Bu belge sistem tarafından otomatik oluşturulmuştur. <br/>
                            Durum: <strong>{printablePayroll.status || 'HESAPLANDI'}</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};`;
txt = replaceSection(txt, '// ─── PAYROLL VIEW', '// ─── SETTINGS VIEW', newPayrollView);

fs.writeFileSync(file, txt);
console.log('MUTLAK REFERANS TASARIMI (BEYAZ, PÜRÜZSÜZ, GÖLGELİ HAPLAR, KALIN TABLOLAR YOK) A-Z BAŞARIYLA YAZILDI.');
