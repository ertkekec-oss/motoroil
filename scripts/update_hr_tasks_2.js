const fs = require('fs');

try {
    let code = fs.readFileSync('src/app/(app)/staff/_components/HrTasksTab.tsx', 'utf-8');

    // 1. Add state parameters for filters and pagination
    if (!code.includes("const [filterStatus, setFilterStatus] = useState('Devam Edenler');")) {
        const stateAnchor = "const [isUpdating, setIsUpdating] = useState(false);";
        code = code.replace(
            stateAnchor,
            `${stateAnchor}
    const [filterStatus, setFilterStatus] = useState('Devam Edenler'); // 'Tümü', 'Devam Edenler', 'Tamamlandı'
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 10;`
        );
    }

    // 2. Change logic for staffTasks
    const staffTasksLogicOriginal = "const staffTasks = tasks.filter(t => t.staff.name === selectedPerson?.name);";
    const newStaffTasksLogic = `
    const baseStaffTasks = selectedPerson === null || selectedPerson?.id === 'ALL' ? tasks : tasks.filter(t => t.staff.name === selectedPerson?.name);
    
    // Apply Filters
    const filteredTasks = baseStaffTasks.filter(t => {
        if (filterStatus === 'Tümü') return true;
        if (filterStatus === 'Tamamlandı') return t.status === 'Tamamlandı';
        return t.status !== 'Tamamlandı' && t.status !== 'İptal';
    });

    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
    const paginatedStaffTasks = filteredTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);
`;

    if (code.includes(staffTasksLogicOriginal)) {
        code = code.replace(staffTasksLogicOriginal, newStaffTasksLogic);
    }

    // 3. Update the left menu
    const leftAnchorTarget = `</button>
                        );
                    })}
                    {filteredStaff.length === 0 && (`;
    const leftReplacement = `</button>
                        );
                    })}
                    <button
                        onClick={() => { setSelectedPerson({ id: 'ALL', name: 'Tüm Personeller' } as any); setActiveTask(null); setIsCreatingTask(false); setCurrentPage(1); }}
                        className={\`w-full flex items-center justify-between p-3 rounded-xl transition-all border mt-2 \${selectedPerson?.id === 'ALL' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 border-slate-100 dark:border-white/5'}\`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black text-[14px]">
                                📋
                            </div>
                            <div className="text-left">
                                <div className="text-[14px] font-bold text-slate-900 dark:text-white">Tüm Görevleri Gör</div>
                                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">Tüm Filtre</div>
                            </div>
                        </div>
                    </button>
                    {filteredStaff.length === 0 && (`
    if (!code.includes("Tüm Görevleri Gör")) {
        code = code.replace(leftAnchorTarget, leftReplacement);
    }

    // 4. Update isCreatingTask ternary issue
    const rightPanelRegex = /\{\!selectedPerson \? \([\s\S]*?\) \: isCreatingTask \? \(/m;
    const rightPanelReplace = `{isCreatingTask ? (`;
    code = code.replace(rightPanelRegex, rightPanelReplace);

// 5. Update the staff render list
const staffTasksRenderOriginal = \`                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#0f172a] shadow-sm font-black text-blue-600 text-[18px] flex items-center justify-center border border-slate-200 dark:border-white/5">
                                    {selectedPerson.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-[18px] font-black text-slate-900 dark:text-white">{selectedPerson.name}</h2>
                                    <p className="text-[12px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">{selectedPerson.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreatingTask(true)}
                                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-black text-[12px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                <Plus className="w-4 h-4" /> Yeni Görev Ata
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] custom-scrollbar">
                            {staffTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 opacity-60">
                                    <Briefcase className="w-12 h-12 text-slate-400 mb-3" />
                                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Bu personelin henüz atanmış görevi yok.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {staffTasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => setActiveTask(task)}
                                            className="text-left bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm hover:border-blue-500 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-[15px] font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 pr-4">{task.title}</h3>
                                                <span className={\`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap \${getStatusColor(task.status)}\`}>{task.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={\`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest \${getPriorityColor(task.priority)}\`}>
                                                    <Flag className="w-3 h-3" /> {task.priority}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" /> Teslim: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 ml-auto">
                                                    <MessageSquare className="w-3.5 h-3.5" /> {task.feedbacks?.length || 0} Yorum
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>\`
    const staffTasksRenderNew = \`                    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#1e293b] flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[12px] bg-white dark:bg-[#0f172a] shadow-sm font-black text-blue-600 text-[18px] flex items-center justify-center border border-slate-200 dark:border-white/5">
                                    {(selectedPerson?.name || "T").charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-[18px] font-black text-slate-900 dark:text-white">{selectedPerson?.name || 'Tüm Görevler'}</h2>
                                    <p className="text-[12px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">{selectedPerson?.role || 'Genel Bakış'}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="flex bg-slate-200/50 dark:bg-[#0f172a] p-1 rounded-lg border border-slate-200 dark:border-white/5">
                                    {['Devam Edenler', 'Tamamlandı', 'Tümü'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                            className={\`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all \${filterStatus === status ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'}\`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setIsCreatingTask(true)}
                                    disabled={!selectedPerson || selectedPerson.id === 'ALL'}
                                    className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-[12px] font-black text-[12px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 shrink-0"
                                >
                                    <Plus className="w-4 h-4" /> Yeni Görev Ata
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] custom-scrollbar">
                            {paginatedStaffTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 opacity-60">
                                    <Briefcase className="w-12 h-12 text-slate-400 mb-3" />
                                    <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Bu filtreye uygun sonuç bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {paginatedStaffTasks.map((task: any) => (
                                        <button
                                            key={task.id}
                                            onClick={() => setActiveTask(task)}
                                            className="text-left bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm hover:border-blue-500 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-[15px] font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 pr-4">{task.title}</h3>
                                                <span className={\`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap \${getStatusColor(task.status)}\`}>{task.status}</span>
                                            </div>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <span className={\`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest \${getPriorityColor(task.priority)}\`}>
                                                    <Flag className="w-3 h-3" /> {task.priority}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 px-2 py-1 rounded-md shrink-0">
                                                    <UserCircle className="w-3.5 h-3.5" /> {task.staff?.name}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" /> Teslim: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 ml-auto uppercase tracking-widest">
                                                    <MessageSquare className="w-3.5 h-3.5" /> {task.feedbacks?.length || 0} Yorum
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] flex items-center justify-between text-[11px] font-bold text-slate-500 shrink-0">
                                <button 
                                    disabled={currentPage === 1} 
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:bg-slate-100 transition-colors disabled:opacity-50 tracking-widest uppercase"
                                >GERİ</button>
                                <span>SAYFA {currentPage} / {totalPages}</span>
                                <button 
                                    disabled={currentPage === totalPages} 
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 hover:bg-slate-100 transition-colors disabled:opacity-50 tracking-widest uppercase"
                                >İLERİ</button>
                            </div>
                        )}
                    </div>\`

    if (code.includes(staffTasksRenderOriginal)) {
        code = code.replace(staffTasksRenderOriginal, staffTasksRenderNew);
        console.log("staffTasksRender replaced");
    }

    if (!code.includes("useState<Staff | null>({ id: 'ALL', name: 'Tüm Görevler' } as any)")) {
        code = code.replace("const [selectedPerson, setSelectedPerson] = useState<Staff | null>(null);", "const [selectedPerson, setSelectedPerson] = useState<Staff | null>({ id: 'ALL', name: 'Tüm Görevler', role: 'Genel Bakış' } as any);");
    }

    fs.writeFileSync('src/app/(app)/staff/_components/HrTasksTab.tsx', code);
    console.log("HrTasksTab replaced successfully.");
} catch (e) {
    console.error("Error updating HrTasksTab:", e);
}
