const fs = require('fs');
const path = require('path');

const perfPagePath = path.join(__dirname, 'src', 'app', '(app)', 'staff', 'performance', 'page.tsx');
let content = fs.readFileSync(perfPagePath, 'utf8');

// 1. We need to add standard targets fetching to this component
const hookRegex = /const \[data, setData\] = useState\<any>\(null\);/g;
content = content.replace(hookRegex, `const [data, setData] = useState<any>(null);\n    const [standardTargets, setStandardTargets] = useState<any[]>([]);`);

const fetchRegex = /fetch\('\/api\/hr\/performance\/dashboard'\)[\s\S]*?\.catch\(\(\) => setLoading\(false\)\);/g;
content = content.replace(fetchRegex, `Promise.all([
            fetch('/api/hr/performance/dashboard').then(r => r.json()),
            fetch('/api/staff/targets?mine=true').then(r => r.json())
        ]).then(([hrRes, targetsData]) => {
            if (hrRes.success) setData(hrRes.data);
            if (Array.isArray(targetsData)) setStandardTargets(targetsData);
            setLoading(false);
        }).catch(() => setLoading(false));`);

// 2. We need to optionally show the dashboard even if `data.assignments` is missing, IF there are standardTargets!
const checkRegex = /if \(!data \|\| !data\.assignments \|\| data\.assignments\.length === 0\) \{/g;
content = content.replace(checkRegex, `if ((!data || !data.assignments || data.assignments.length === 0) && standardTargets.length === 0) {`);

// 3. We need to inject the view for standard targets.
// The best place is below the KPI cards or AI target section.
// AI target area string: {/* AI Targets Area */}
const aiSectionRegex = /\{\/\* AI Targets Area \*\/\}/;
content = content.replace(aiSectionRegex, `{/* Standard Targets Area */}
                {standardTargets.length > 0 && (
                    <div className="md:col-span-4 mt-6">
                        <EnterpriseCard>
                            <EnterpriseSectionHeader title="Aktif Operasyonel Hedefler" subtitle="Dönemlik atanmış olan mağaza veya saha operasyon performansı." icon={<Target />} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {standardTargets.map((t: any) => {
                                    const progress = t.targetValue > 0 ? Math.min((t.currentValue / t.targetValue) * 100, 100) : 0;
                                    return (
                                        <div key={t.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="font-bold text-[13px] uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                    {t.type === 'TURNOVER' ? '💰 CİRO HEDEFİ' : '📍 ZİYARET HEDEFİ'}
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-500 uppercase">
                                                    %{progress.toFixed(0)}
                                                </div>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: \`\${progress}%\` }} />
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                                <span>Gerçekleşen: {t.type === 'TURNOVER' ? \`₺\${Number(t.currentValue).toLocaleString()}\` : \`\${t.currentValue} Adet\`}</span>
                                                <span className="text-slate-700 dark:text-slate-300 font-black">Hedef: {t.type === 'TURNOVER' ? \`₺\${Number(t.targetValue).toLocaleString()}\` : \`\${t.targetValue} Adet\`}</span>
                                            </div>
                                            {t.estimatedBonus > 0 && (
                                                <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 flex justify-center w-full rounded">
                                                    Tahmini Prim/Bonus: ₺{Number(t.estimatedBonus).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </EnterpriseCard>
                    </div>
                )}
                
                {data?.assignments?.length > 0 && (
                {/* AI Targets Area */}`);

// We need to gracefully handle displayData if `data` is null but we had standard targets
const displayDataRegex = /const displayData = data;/;
content = content.replace(displayDataRegex, `const displayData = data || { stats: { target: 0, actual: 0, achievement: 0, bonus: 0 }, achievements: [], leaderboard: {}, aiSuggested: {} };`);

// And close the bracket for `data?.assignments?.length > 0 && (` that was opened above
// Right before the ending `</div>\n        </EnterprisePageShell>`
const closeBracketRegex = /<\/EnterpriseCard>\s*<\/div>\s*<\/div>\s*<\/EnterprisePageShell>/;
content = content.replace(closeBracketRegex, `</EnterpriseCard>\n                </div>\n                )}\n            </div>\n        </EnterprisePageShell>`);


fs.writeFileSync(perfPagePath, content);
console.log("Updated performance/page.tsx check OK");
