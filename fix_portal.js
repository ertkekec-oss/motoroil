const fs = require('fs');
const f = 'src/app/(app)/staff/me/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Fix Printing classes for Payroll and Leaves
c = c.replace(/className="hidden"/g, 'className="hidden print:block"');

// 2. Fix Payroll data binding
c = c.replace(/pr\.basePay/g, 'pr.grossSalary');

// 3. Fix Task Selection in TasksView
const tasksViewDef = `const TasksView = ({ user, tasks=[], fetchTasks, loading }: any) => {
    const [subTab, setSubTab] = useState<'pending' | 'completed' | 'all'>('pending');`;
const tasksViewRep = `const TasksView = ({ user, tasks=[], fetchTasks, loading }: any) => {
    const [subTab, setSubTab] = useState<'pending' | 'completed' | 'all'>('pending');
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const markAsCompleted = async () => {
        if(!selectedTask) return;
        try {
            const res = await fetch(\`/api/staff/tasks/\${selectedTask.id}\`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: 'Tamamlandı' }) });
            if(res.ok) { fetchTasks(); setSelectedTask({ ...selectedTask, status: 'Tamamlandı' }); }
        } catch(e) {}
    };`;
c = c.replace(tasksViewDef, tasksViewRep);

const trClick = `className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[54px] group cursor-pointer"`;
const trClickRep = `onClick={() => setSelectedTask(t)} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[54px] group cursor-pointer"`;
c = c.replace(new RegExp(trClick.replace(/[.*+?^$\/{}()|\[\]\\]/g, '\\$&'), 'g'), trClickRep);

const tasksRightPanel = `<div className="flex-1 flex items-center justify-center flex-col text-slate-400 gap-3 text-center py-20">
                        <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
                        <h4 className="text-[12px] font-black uppercase tracking-widest mt-2 block leading-none">LİSTEDEN BİR GÖREV SEÇEREK RAPOR EKRANINI AÇIN</h4>
                    </div>`;
const tasksRightPanelRep = `{selectedTask ? (
                        <div className="p-6 flex flex-col h-full animate-in fade-in duration-300">
                            <h2 className="text-[14px] font-black uppercase tracking-widest text-slate-800 dark:text-white mb-2">{selectedTask.title}</h2>
                            <div className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-6">DURUM: <span className="text-blue-500">{selectedTask.status}</span></div>
                            
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-white/5 whitespace-pre-wrap text-[13px] font-medium text-slate-700 dark:text-slate-300">
                                {selectedTask.description || 'Görevin detaylı açıklaması bulunmuyor.'}
                            </div>
                            
                            <div className="mt-6 flex justify-end gap-3 shrink-0">
                                {selectedTask.status !== 'Tamamlandı' && (
                                    <button onClick={markAsCompleted} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-[12px] text-[11px] uppercase tracking-widest shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                                        Tamamlandı Olarak Raporla
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        ${tasksRightPanel}
                    )}`;
c = c.replace(tasksRightPanel, tasksRightPanelRep);

// 4. Fix Prim (Tahmini) logic
// Replace estimatedBonus with dynamic evaluation: 
// if target is reached or close to reach, check targetValue and currentValue against bonusAmount
c = c.replace(/const totalEstBonus = targets\?\.reduce.*?;/g, `const totalEstBonus = targets?.reduce((sum: any, t: any) => {
        let earned = 0;
        const progress = t.targetValue > 0 ? (t.currentValue / t.targetValue) : 0;
        if (progress >= 1) earned += Number(t.bonusAmount || 0);
        else earned += Number(t.estimatedBonus || 0);
        return sum + earned;
    }, 0) || 0;`);

fs.writeFileSync(f, c);
console.log('done fixing data bindings');
