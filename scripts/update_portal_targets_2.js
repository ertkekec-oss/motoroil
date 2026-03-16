const fs = require('fs');
const path = require('path');

const mePagePath = path.join(process.cwd(), 'src', 'app', '(app)', 'staff', 'me', 'page.tsx');
let content = fs.readFileSync(mePagePath, 'utf8');

// 1. Add targets fetching logic to the main StaffPortal function
// Let's find: const [loading, setLoading] = useState(true);
const mainCompRegex = /(export default function StaffPortal\(\) \{[\s\S]*?const \[loading, setLoading\] = useState\(true\);)/;
content = content.replace(mainCompRegex, `$1
    const [targets, setTargets] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetch('/api/staff/targets?mine=true')
                .then(res => res.json())
                .then(data => {
                    if(Array.isArray(data)) setTargets(data);
                })
                .catch(console.error);
                
            fetch('/api/hr/performance/dashboard')
                .then(res => res.json())
                .then(res => {
                    if (res.success) setStatsData(res.data);
                })
                .catch(console.error);
        }
    }, [currentUser?.id]);
`);

// 2. Modify DashboardView signature and props
const dashboardViewRegex = /const DashboardView = \(\{([\s\S]*?)\}: any\) => \(/;
content = content.replace(dashboardViewRegex, `const DashboardView = ({$1, targets = [], statsData, user }: any) => {
    return (`);

// And close the DashboardView properly from `);` to `); }` if needed.
// It is originally `}: any) => (\n... );`
// We need to replace the ending `);` of DashboardView.
const dashboardEndRegex = /<BarcodeScanner[\s\S]*?\/>\s*<\/div>\s*<\/div>\s*\);/;
content = content.replace(dashboardEndRegex, (match) => match.replace(');', '); };'));

// 3. Update the KPI area in DashboardView
const kpiAreaRegex = /<EnterpriseCard className="p-6 border-l-4" borderLeftColor="#3b82f6">[\s\S]*?<\/div>\s*<\/EnterpriseCard>\s*<\/div>/;
content = content.replace(kpiAreaRegex, `<EnterpriseCard className="p-6 border-l-4" borderLeftColor="#3b82f6">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Performans Skoru</h4>
                    <IconActivity className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsData?.leaderboard?.scoreValue || '0.0'}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 w-fit px-2 py-1 rounded">
                    Global Sıra: #{statsData?.leaderboard?.rankGlobal || ' -'}
                </div>
            </EnterpriseCard>

            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#8b5cf6">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hedef Gerçekleşme</h4>
                    <IconTrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsData?.stats?.achievement || '%0'}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">Bu ayki hedefler (Matris)</p>
            </EnterpriseCard>

            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#f59e0b">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kazanılan Prim</h4>
                    <IconClock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsData?.stats?.bonus || '₺0'}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">Dönem biriken tutar</p>
            </EnterpriseCard>

            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#ef4444">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Aylık Ziyaretler</h4>
                    <IconZap className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {targets?.filter((t: any) => t.type === 'VISIT').reduce((acc: number, t: any) => acc + t.currentValue, 0) || 0} <span className="text-lg text-slate-400 font-bold">Adet</span>
                </p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">Saha ziyaret hedefleri</p>
            </EnterpriseCard>
        </div>`);

// 4. Update the ProgressBar area
const targetBarsRegex = /<ProgressBar label="Satış Kotası Gerçekleşme"[\s\S]*?<ProgressBar label="Tahsilat Hedefi" value={0} max={600000} color="#f59e0b" \/>/;
content = content.replace(targetBarsRegex, `{(!targets || targets.length === 0) && (!statsData?.assignments || statsData?.assignments?.length === 0) ? (
                            <div className="text-center text-sm font-semibold text-slate-400 py-6 border border-dashed border-slate-300 dark:border-slate-700/50 rounded-lg">
                                Size atanmış aktif bir personel hedefi bulunmamaktadır.
                            </div>
                        ) : (
                            <>
                            {targets?.map((t: any) => (
                                <ProgressBar 
                                    key={t.id} 
                                    label={t.type === 'TURNOVER' ? (\`💰 Ciro Hedefi (₺\${Number(t.targetValue).toLocaleString()})\`) : (\`📍 Ziyaret Hedefi (\${t.targetValue} Adet)\`)} 
                                    value={t.currentValue} 
                                    max={t.targetValue} 
                                    color={t.type === 'TURNOVER' ? "#3b82f6" : "#10b981"} 
                                />
                            ))}
                            {statsData?.assignments?.map((ass: any) => (
                             <ProgressBar 
                                key={ass.id} 
                                label={\`🎯 Matrix Şirket Hedefi (\${ass.period?.name})\`} 
                                value={ass.performances?.[0]?.actual || 0} 
                                max={ass.target} 
                                color="#8b5cf6" 
                            />
                            ))}
                            </>
                        )}`);

// 5. Inject tags to <DashboardView /> call
content = content.replace(/<DashboardView\s+handleQrCheckin=\{handleQrCheckin\}[\s\S]*?\/>/, (match) => {
    return match.replace('/>', ' targets={targets} statsData={statsData} user={currentUser} />');
});

fs.writeFileSync(mePagePath, content);
console.log("Updated me/page.tsx check OK");
