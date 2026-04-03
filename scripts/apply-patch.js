const fs = require('fs');

let c = fs.readFileSync('src/app/(app)/service/[id]/ServiceDetailClient.tsx', 'utf8');

c = c.replace(
  "body: JSON.stringify({ status: 'COMPLETED' })",
  "body: JSON.stringify({ status: 'COMPLETED', nextKm_or_Use: nextKm ? Number(nextKm) : undefined, nextMaintenanceAt: nextDate ? new Date(nextDate).toISOString() : undefined })"
);

c = c.replace(
  /<div className="flex gap-3">[\s\n]*<button disabled=\{isFinishing\}/,
  `<div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sonraki Servis KM (Opsiyonel)</label>
                                <input type="number" value={nextKm} onChange={e => setNextKm(e.target.value)} className="w-full h-12 px-4 rounded-[12px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[13px] font-bold focus:border-emerald-500 outline-none" placeholder="Örn: 15000" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sonraki Servis Tarihi (Opsiyonel)</label>
                                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full h-12 px-4 rounded-[12px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[13px] font-bold focus:border-emerald-500 outline-none" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button disabled={isFinishing}`
);

fs.writeFileSync('src/app/(app)/service/[id]/ServiceDetailClient.tsx', c);
