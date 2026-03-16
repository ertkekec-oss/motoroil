const fs = require('fs');

try {
    let content = fs.readFileSync('src/components/StaffManagementContent.tsx', 'utf-8');

    // Add state for selected role
    if (!content.includes("selectedRoleForPermissions")) {
        content = content.replace(
            "const [activeTab, setActiveTab] = useState<'list' | 'roles' | 'tasks' | 'targets' | 'shifts' | 'leaves' | 'pdks' | 'puantaj' | 'payroll' | 'documents'>('list');",
            "const [activeTab, setActiveTab] = useState<'list' | 'roles' | 'tasks' | 'targets' | 'shifts' | 'leaves' | 'pdks' | 'puantaj' | 'payroll' | 'documents'>('list');\n    const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState('Sistem Yöneticisi');"
        );
    }

    // Now replace the entire Roles view
    const rolesTabStart = "{/* --- ROLES TAB (BÖLÜNMÜŞ GÖRÜNÜM / MATRİS) --- */}";
    const performanceTabStart = "{/* --- PERFORMANCE TAB (KPI KARTLARI + TABLO) --- */}";

    const startIdx = content.indexOf(rolesTabStart);
    const endIdx = content.indexOf(performanceTabStart, startIdx);

    const newRolesCode = `
            {/* --- ROLES TAB (BÖLÜNMÜŞ GÖRÜNÜM / MATRİS) --- */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 min-h-[600px]">
                    {/* Sol Panel: Rol Listesi */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm p-6 flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mevcut Kurumsal Roller</h3>
                                <div className="group/tt relative inline-flex items-center justify-center">
                                    <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/10 text-slate-400 flex items-center justify-center cursor-help text-[11px] font-bold">?</span>
                                    <div className="opacity-0 invisible group-hover/tt:opacity-100 group-hover/tt:visible absolute bottom-full -right-2 mb-2 w-[240px] p-3 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-lg text-slate-700 dark:text-slate-300 text-[12px] z-50 text-left">
                                        <div className="font-bold text-slate-900 dark:text-white mb-1">Kurumsal Roller</div>
                                        Seçtiğiniz rolün taşıdığı tüm kurumsal yetkileri sağ taraftan detaylıca görüntüleyebilir ve yetki matrisini güncelleyebilirsiniz.
                                    </div>
                                </div>
                            </div>
                            <div className="relative mb-5 flex-shrink-0">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                <input type="text" placeholder="Rol ara..." className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-xl text-[13px] outline-none focus:border-blue-500 transition-all font-medium" />
                            </div>
                            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pb-4 pr-2">
                                {Object.keys(roleTemplates)?.map((roleName, idx) => {
                                    const isSelected = selectedRoleForPermissions === roleName;
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSelectedRoleForPermissions(roleName)}
                                            className={\`flex items-center justify-between p-4 rounded-xl border transition-all text-left w-full \${isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 shadow-sm' : 'bg-white dark:bg-[#0f172a] border-slate-100 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e293b]'}\`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={\`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner \${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}\`}>
                                                    {roleName.includes('Yönetici') || roleName.includes('Admin') ? '👑' : roleName.includes('Satış') ? '📍' : roleName.includes('Şube') ? '🏢' : roleName.includes('İK') || roleName.includes('İnsan') ? '👥' : '👤'}
                                                </div>
                                                <div>
                                                    <div className={\`text-[14px] font-black \${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}\`}>{roleName}</div>
                                                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 tracking-widest uppercase">{roleTemplates[roleName].length} Yetki İzni</div>
                                                </div>
                                            </div>
                                            <div className={\`w-2 h-2 rounded-full \${isSelected ? 'bg-blue-600 dark:bg-blue-400 animate-pulse' : 'bg-emerald-500'}\`}></div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button className="mt-4 w-full h-11 flex-shrink-0 bg-slate-50 dark:bg-[#1e293b] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold tracking-widest uppercase rounded-[12px] text-[11px] transition-colors flex items-center justify-center gap-2">
                                <span className="text-lg">+</span> YENİ ROL ŞABLONU OLUŞTUR
                            </button>
                        </div>
                    </div>
                    {/* Sağ Panel: Yetki Matrisi */}
                    <div className="lg:col-span-2 flex flex-col h-full">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-[20px] shadow-sm flex-1 flex flex-col overflow-hidden h-[600px]">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-[#1e293b] gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg border-2 border-slate-50 dark:border-slate-900 shrink-0">
                                        🛡️
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedRoleForPermissions} Rolü Yetkileri</h3>
                                        <p className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mt-1">
                                            {selectedRoleForPermissions === 'Sistem Yöneticisi' ? 'Tüm modüllere sınırsız kurumsal erişim' : \`\${roleTemplates[selectedRoleForPermissions]?.length || 0} Adet Tanımlanmış Mikro Yetki\`}
                                        </p>
                                    </div>
                                </div>
                                <button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest uppercase rounded-xl text-[11px] shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0">
                                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                    DEĞİŞİKLİKLERİ KAYDET
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#0f172a]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                    {Object.entries(
                                        allPermissions.reduce((acc, perm) => {
                                            if (!acc[perm.category]) acc[perm.category] = [];
                                            acc[perm.category].push(perm);
                                            return acc;
                                        }, {} as Record<string, typeof allPermissions>)
                                    ).map(([category, perms]) => {
                                        const typeSafePerms = perms as Array<{id: string, label: string, category: string}>;
                                        const totalPerms = typeSafePerms.length;
                                        const selectedPermsLength = typeSafePerms.filter(p => selectedRoleForPermissions === 'Sistem Yöneticisi' ? true : roleTemplates[selectedRoleForPermissions]?.includes(p.id)).length;
                                        const isAllSelected = selectedPermsLength === totalPerms;
                                        return (
                                            <div key={category} className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <span className="text-blue-500 text-sm">✦</span> {category}
                                                    </h4>
                                                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors">
                                                        <input type="checkbox" checked={selectedRoleForPermissions === 'Sistem Yöneticisi' || isAllSelected} readOnly className="w-3.5 h-3.5 rounded-sm border-slate-300 text-blue-600 cursor-pointer" />
                                                        TÜMÜ
                                                    </label>
                                                </div>
                                                <div className="flex flex-col gap-2.5">
                                                    {typeSafePerms.map(perm => {
                                                        const isChecked = selectedRoleForPermissions === 'Sistem Yöneticisi' ? true : roleTemplates[selectedRoleForPermissions]?.includes(perm.id);
                                                        return (
                                                            <label key={perm.id} className={\`flex items-start gap-3 p-3.5 rounded-xl border \${isChecked ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20 shadow-sm' : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 hover:border-slate-300 transition-colors'} cursor-pointer group\`}>
                                                                <div className="pt-0.5 shrink-0">
                                                                    <input type="checkbox" checked={isChecked || false} readOnly className={\`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all \${isChecked ? 'ring-2 ring-blue-500/20' : ''}\`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <span className={\`text-[13px] font-bold block mb-1 transition-colors \${isChecked ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'}\`}>{perm.label}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis">{perm.id}</span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
`;

    if (startIdx !== -1 && endIdx !== -1) {
        let finalContent = content.slice(0, startIdx) + newRolesCode + '\n            ' + content.slice(endIdx);
        fs.writeFileSync('src/components/StaffManagementContent.tsx', finalContent);
        console.log("Roles replacement done!");
    } else {
        console.error("Could not find start or end index.");
        console.error("Start Index:", startIdx);
        console.error("End Index:", endIdx);
    }
} catch (error) {
    console.error("Error writing script:", error);
}
