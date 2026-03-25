const fs = require('fs');
const file = 'src/app/(app)/catalog/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const oldHeroRegex = /\{\/\* ADVANCED SEARCH CONSOLE \*\/\}.*\{\/\* THE MATRIX \(Compact Bento Grid\) \*\/\}/s;

const newHero = \`{/* THE VANGUARD (Intelligence & Search Header) */}
                <div className="relative w-full rounded-[2rem] overflow-hidden bg-[#f4f7f9] border border-slate-200 mb-12 shadow-[inset_0_2px_15px_rgba(0,0,0,0.02)] min-h-[320px] flex object-cover flex-col items-center justify-end pb-8">
                    
                    {/* Visionary Map Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                        {/* Pure CSS dot matrix to emulate a minimalist map density */}
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
                        
                        {/* Abstract World SVG Paths representing trade routes */}
                        <svg className="absolute w-full h-full opacity-30" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid slice">
                            <path d="M 200 150 Q 400 50, 600 200 T 900 100" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" className="animate-[dash_30s_linear_infinite]" />
                            <path d="M 100 220 Q 500 280, 800 80" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                        </svg>
                    </div>

                    {/* Nodes (Glowing Ping Indicators) */}
                    <div className="absolute w-full h-full inset-0 pointer-events-none">
                        {/* Europe/Marmara Node */}
                        <div className="absolute top-[25%] left-[30%] flex flex-col items-center animate-bounce-slow">
                            <div className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg mb-1 relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                                2,437 <span className="text-emerald-400 font-normal ml-0.5">Talepler</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-white shadow-[0_0_15px_rgba(30,41,59,0.3)] flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            </div>
                        </div>
                        
                        {/* Asia/Anatolia Node */}
                        <div className="absolute top-[40%] right-[35%] flex flex-col items-center">
                            <div className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg mb-1 relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-rose-500">
                                1,723 <span className="text-rose-200 font-normal ml-0.5">Acil</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                            </div>
                        </div>

                        {/* MENA Node */}
                        <div className="absolute top-[60%] right-[45%] flex flex-col items-center">
                            <div className="bg-amber-400 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg mb-1 relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-amber-400">
                                948 <span className="font-normal opacity-80 ml-0.5">Tedarik</span>
                            </div>
                            <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Watermark */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center select-none pointer-events-none opacity-80">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">periodya <span className="text-slate-400 font-bold uppercase tracking-widest text-2xl">Hub</span></h1>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-[0.2em] mt-2">Global B2B Liquid Trade Network</p>
                    </div>

                    {/* Floating Search Console */}
                    <div className="relative z-10 w-11/12 max-w-4xl bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.06)] p-2 hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                        <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            
                            {/* Search Keyword */}
                            <div className="flex-1 w-full flex flex-col py-1.5 px-4 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-indigo-500 transition-colors">B2B Terminal</label>
                                <div className="flex items-center">
                                    <input 
                                        type="text" 
                                        placeholder="OEM, SKU veya İsim Arayın..." 
                                        className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-medium focus:outline-none focus:ring-0"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="flex-1 w-full flex flex-col py-1.5 px-4 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-indigo-500 transition-colors">Kategori Süzgeci</label>
                                <div className="flex items-center">
                                    <select className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-0 appearance-none">
                                        <option value="">Tüm Kategoriler</option>
                                        <option value="motor-yaglari">Otomotiv & Yedek Parça</option>
                                        <option value="fren">Endüstriyel Rulmanlar</option>
                                        <option value="lastik">Kimyasallar & Yağlar</option>
                                    </select>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 rotate-90 ml-2 shrink-0 pointer-events-none" />
                                </div>
                            </div>

                            {/* Location Filter */}
                            <div className="flex-1 w-full flex flex-col py-1.5 px-4 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-indigo-500 transition-colors">Ağ Lokasyonu</label>
                                <div className="flex items-center">
                                    <select className="w-full bg-transparent border-none p-0 text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-0 appearance-none">
                                        <option value="">Global Ağ (Tümü)</option>
                                        <option value="tr-marmara">Marmara Lojistik Ağı</option>
                                        <option value="tr-ege">Ege İhracat Ağı</option>
                                        <option value="avrupa">Avrupa Merkez</option>
                                    </select>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 rotate-90 ml-2 shrink-0 pointer-events-none" />
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="w-full md:w-auto p-1.5 shrink-0">
                                <button className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-widest px-8 h-[46px] rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_5px_15px_rgba(30,41,59,0.2)] hover:shadow-[0_8px_20px_rgba(30,41,59,0.3)]">
                                    <Search className="w-4 h-4" /> Tara
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* THE MATRIX (Compact Bento Grid) */}\`;

if (oldHeroRegex.test(txt)) {
    txt = txt.replace(oldHeroRegex, newHero);
    fs.writeFileSync(file, txt);
    console.log('Success resolving map header UI');
} else {
    console.log('Regex failed to match');
}
