const fs = require('fs');
const content = fs.readFileSync('src/app/(app)/staff/me/page.tsx', 'utf-8');

const importReplacement = `import { IconRefresh, IconTrash } from '@/components/icons/PremiumIcons';\nimport { Calendar, MessageSquare, Briefcase, FileText, CheckCircle2, UserCircle, Flag, XCircle } from 'lucide-react';`;
const newContent1 = content.replace("import {\n    IconActivity,", importReplacement + "\nimport {\n    IconActivity,");

const tasksViewCode = `
const MyTasksView = ({ user }: any) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(\`/api/staff/tasks?staffId=\${user?.id}\`);
            if (res.ok) setTasks(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchTasks();
    }, [user?.id]);

    const handleSendFeedback = async (statusOverride?: string) => {
        if (!selectedTask) return;
        setIsUpdating(true);
        try {
            if (feedback.trim()) {
                await fetch(\`/api/staff/tasks/\${selectedTask.id}/feedback\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: feedback, isFromStaff: true })
                });
            }
            if (statusOverride) {
                await fetch(\`/api/staff/tasks/\${selectedTask.id}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: statusOverride })
                });
            }
            toast.success("Bilgiler iletildi!");
            setFeedback('');
            fetchTasks();
            setSelectedTask(null); // Return to list after submit
        } catch(e) {
            toast.error("İşlem başarısız.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 min-h-[500px]">
            <div className="lg:col-span-1">
                <EnterpriseCard className="h-full flex flex-col">
                    <EnterpriseSectionHeader title="Atanan Görevlerim" icon="📋" />
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading ? (
                            <p className="text-center text-sm font-semibold text-slate-400 p-8">Yükleniyor...</p>
                        ) : tasks.length === 0 ? (
                            <p className="text-center text-sm font-semibold text-slate-400 p-8">Sizi bekleyen görev yok.</p>
                        ) : (
                            tasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className={\`w-full text-left p-4 rounded-xl border transition-all \${selectedTask?.id === task.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-400'}\`}
                                >
                                    <h4 className="text-[14px] font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{task.title}</h4>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <span className={
                                            task.status === 'Tamamlandı' ? 'text-emerald-600' :
                                            task.status === 'İptal' ? 'text-slate-500' : 'text-amber-500'
                                        }>{task.status}</span>
                                        <span className="flex items-center gap-1"><Flag className="w-3 h-3"/> {task.priority}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </EnterpriseCard>
            </div>

            <div className="lg:col-span-2">
                <EnterpriseCard className="h-full flex flex-col overflow-hidden">
                    <EnterpriseSectionHeader title="Görev Detayı & İşlemler" icon="⚡" />
                    {!selectedTask ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-50">
                            <Briefcase className="w-16 h-16 text-slate-400 mb-4" />
                            <p className="font-bold text-slate-500 uppercase tracking-widest text-[13px]">Detayları görmek için listeden görev seçin.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                                <h2 className="text-[18px] font-black text-slate-900 dark:text-white mb-2">{selectedTask.title}</h2>
                                {selectedTask.dueDate && (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 w-max rounded-lg border border-rose-200 dark:border-rose-500/20">
                                        <Calendar className="w-4 h-4"/> Son Teslim: {new Date(selectedTask.dueDate).toLocaleDateString('tr-TR')}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {selectedTask.description && (
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Yönetici Notu & Açıklama</h4>
                                        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedTask.description}</p>
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Bildirim Geçmişi</h4>
                                    {selectedTask.feedbacks?.length === 0 ? (
                                        <p className="text-[11px] font-medium text-slate-400 italic">Henüz yorum yok.</p>
                                    ) : (
                                        selectedTask.feedbacks?.map((fb: any) => (
                                            <div key={fb.id} className={\`p-4 rounded-xl max-w-[85%] \${fb.isFromStaff ? 'bg-amber-50 dark:bg-amber-500/10 ml-auto border border-amber-200 dark:border-amber-500/20 text-right' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}\`}>
                                                <div className={\`flex justify-between items-center mb-2 \${fb.isFromStaff && 'flex-row-reverse'}\`}>
                                                    <span className="text-[12px] font-black text-slate-900 dark:text-white opacity-80">{fb.isFromStaff ? user?.name : 'Yönetim / İK'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(fb.createdAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month:'2-digit' })}</span>
                                                </div>
                                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{fb.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                                {selectedTask.status === 'Tamamlandı' ? (
                                    <div className="bg-emerald-50 text-emerald-600 font-bold text-[12px] p-4 text-center rounded-lg border border-emerald-200 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-5 h-5"/> BU GÖREV YÖNETİCİ ONAYIYLA KAPATILMIŞTIR.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <textarea
                                            className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-[13px] font-medium outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-all resize-none shadow-inner text-slate-900 dark:text-white"
                                            placeholder="Yöneticinize görev hakkında durum bildirimi veya not yazın..."
                                            value={feedback}
                                            onChange={e => setFeedback(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSendFeedback()}
                                                disabled={isUpdating || !feedback.trim()}
                                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                            >
                                                Sadece Yorum Gönder
                                            </button>
                                            <button 
                                                onClick={() => handleSendFeedback('İncelemede')}
                                                disabled={isUpdating || selectedTask.status === 'İncelemede'}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4"/> TAMAMLADIM / ONAYA GÖNDER
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </EnterpriseCard>
            </div>
        </div>
    );
};
`;

let newContent2 = newContent1.replace("const ProfileSettingsView = ", tasksViewCode + "\n\nconst ProfileSettingsView = ");

newContent2 = newContent2.replace("const [activeTab, setActiveTab] = useState<'dashboard' | 'leave' | 'profile'>('dashboard');", "const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'leave' | 'profile'>('dashboard');");

const tasksTabCode = `
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={\`\${activeTab === 'tasks'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2\`}
                                >
                                    <Briefcase className="w-4 h-4" /> Görevlerim
                                </button>
`;

newContent2 = newContent2.replace("Genel Durum\n                                </button>", "Genel Durum\n                                </button>" + tasksTabCode);

newContent2 = newContent2.replace("{activeTab === 'leave' && <LeaveRequestView", "{activeTab === 'tasks' && <MyTasksView user={currentUser} />}\n                {activeTab === 'leave' && <LeaveRequestView");

fs.writeFileSync('src/app/(app)/staff/me/page.tsx', newContent2);
