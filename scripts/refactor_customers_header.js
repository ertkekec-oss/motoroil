const fs = require('fs');
const file = 'src/app/(app)/customers/page.tsx';
let data = fs.readFileSync(file, 'utf8');

const regex = /\{?\/\* ═══════════════ LİSTE BAŞLIĞI VE ARAMA ═══════════════ \*\/\}?[\s\S]*?<div className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white\/5">[\s\S]*?<div className="flex items-center gap-4">[\s\S]*?<h3 className="text-\[13px\] font-black text-slate-800 dark:text-white uppercase tracking-widest">Kayıt Listesi<\/h3>[\s\S]*?<div className=\{\`flex p-1 rounded-full border \$\{isLight \? 'bg-slate-50 border-slate-200' : 'bg-slate-900\/50 border-slate-800'\}\`\}>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setViewMode\('grid'\)\}[\s\S]*?>[\s\S]*?<Grid className="w-4 h-4" \/>[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setViewMode\('list'\)\}[\s\S]*?>[\s\S]*?<List className="w-4 h-4" \/>[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">[\s\S]*?<select[\s\S]*?onChange=\{\(e\) => setClassFilter\(e\.target\.value\)\}[\s\S]*?>[\s\S]*?<option value="all">Tüm Sınıflar<\/option>[\s\S]*?\{custClasses\.map\(c => <option key=\{c\} value=\{c\}>\{c\}<\/option>\)\}[\s\S]*?<\/select>[\s\S]*?<div className="relative w-full md:w-\[260px\]">[\s\S]*?<Search className="absolute left-3 top-1\/2 -translate-y-1\/2 w-4 h-4 text-slate-400" \/>[\s\S]*?<input[\s\S]*?type="text"[\s\S]*?value=\{searchTerm\}[\s\S]*?onChange=\{\(e\) => handleSearchChange\(e\.target\.value\)\}[\s\S]*?placeholder="Müşteri, VKN, Telefon..."[\s\S]*?\/>[\s\S]*?<\/div>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setIsModalOpen\(true\)\}[\s\S]*?>[\s\S]*?<Plus className="w-4 h-4" \/>[\s\S]*?YENİ MÜŞTERİ[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const replacement = `{/* ═══════════════ LİSTE BAŞLIĞI VE ARAMA ═══════════════ */}
                <div className="p-4 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-4">
                        <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest hidden sm:block">Kayıt Listesi</h3>
                        <div className={\`flex p-1 rounded-full border \${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}\`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={\`w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors \${viewMode === 'grid'
                                    ? (isLight ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-800 text-blue-400')
                                    : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')
                                    }\`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={\`w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors \${viewMode === 'list'
                                    ? (isLight ? 'bg-white shadow-sm text-blue-600' : 'bg-slate-800 text-blue-400')
                                    : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')
                                    }\`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-none justify-start sm:justify-end">
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="h-[36px] bg-white dark:bg-[#0f172a] border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-[8px] text-[12px] font-bold px-3 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm w-auto min-w-[120px]"
                        >
                            <option value="all">Sınıf Seç</option>
                            {custClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        
                        <div className="relative w-full sm:w-[240px] shrink-0 min-w-[150px] flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Ara..."
                                className="w-full pl-9 pr-4 h-[36px] bg-white dark:bg-black/20 rounded-[8px] border border-slate-200 dark:border-white/10 text-[12px] font-bold outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 shadow-sm text-slate-800 dark:text-white"
                            />
                        </div>
                        
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            YENİ
                        </button>
                    </div>
                </div>`;

data = data.replace(regex, replacement);

fs.writeFileSync(file, data);
console.log('Customer Search row refactored to wrap nicely without stacking');
