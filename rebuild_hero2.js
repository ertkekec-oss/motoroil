const fs = require('fs');
const file = 'src/app/(app)/catalog/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

const oldHeroRegex = /\{\/\* THE VANGUARD \(Intelligence Map & Search Header\) \*\/\}.*\{\/\* THE MATRIX \(Compact Bento Grid\) \*\/\}/s;

const newHeader = \`
        {/* NEW ELEGANT MAP HERO & SEARCH */}
        <div className="relative w-full bg-[#f8fafc] border border-slate-200 rounded-3xl overflow-hidden mb-12 min-h-[400px] flex flex-col items-center justify-center pt-10 pb-16">
            
            {/* World Map SVG Background (Very Faint) */}
            <div 
                className="absolute inset-x-0 top-0 bottom-0 opacity-[0.04] pointer-events-none mix-blend-multiply bg-center bg-no-repeat bg-contain"
                style={{ 
                    backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')", 
                    backgroundSize: "90%" 
                }}
            ></div>

            {/* Glowing Signals on Map */}
            <div className="absolute w-full h-full inset-0 pointer-events-none perspective-[1000px]">
                {/* Turkiye */}
                <div className="absolute top-[40%] left-[55%] flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center -translate-y-4 animate-bounce-slow">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] animate-pulse"></div>
                    </div>
                </div>
                {/* Europe */}
                <div className="absolute top-[35%] left-[48%] flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-400/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></div>
                    </div>
                </div>
                {/* Asia */}
                <div className="absolute top-[45%] left-[70%] flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 flex items-center justify-center delay-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Elegant Search Container */}
            <div className="relative z-10 w-[95%] max-w-5xl mt-12 mb-6">
                <div className="w-full bg-white rounded-xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.06)] border border-slate-100 p-2 h-16 flex items-center">
                    
                    {/* Industry */}
                    <div className="flex-1 flex items-center h-full px-4 border-r border-slate-100">
                        <Box className="w-5 h-5 text-slate-400 mr-3" />
                        <select className="w-full h-full bg-transparent border-none text-[15px] font-medium text-slate-700 focus:outline-none focus:ring-0 appearance-none cursor-pointer">
                            <option value="">Sektör Seçin</option>
                            <option value="1">Otomotiv & Yedek Parça</option>
                            <option value="2">Endüstriyel Rulmanlar</option>
                            <option value="3">Kimyasallar</option>
                        </select>
                        <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                    </div>

                    {/* Location */}
                    <div className="flex-1 flex items-center h-full px-4 border-r border-slate-100">
                        <Activity className="w-5 h-5 text-slate-400 mr-3" />
                        <select className="w-full h-full bg-transparent border-none text-[15px] font-medium text-slate-700 focus:outline-none focus:ring-0 appearance-none cursor-pointer">
                            <option value="">Lokasyon</option>
                            <option value="tr">Türkiye (Marmara)</option>
                            <option value="eu">Avrupa Ağı</option>
                        </select>
                        <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                    </div>

                    {/* Keyword */}
                    <div className="flex-[1.5] flex items-center h-full px-4">
                        <Search className="w-5 h-5 text-slate-400 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Anahtar kelime (SKU, OEM vs.)" 
                            className="w-full h-full bg-transparent border-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                    </div>

                    {/* Search Button */}
                    <div className="h-full pl-2">
                        <button className="h-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold text-[15px] px-8 rounded-lg flex items-center justify-center gap-2">
                            <Search className="w-4 h-4" /> B2B Ara
                        </button>
                    </div>

                </div>

                {/* Popular Searches */}
                <div className="flex items-center justify-center gap-2 mt-5 text-[13px] font-medium">
                    <span className="text-slate-500">En Çok Arananlar:</span>
                    <a href="#" className="text-slate-600 border-b border-slate-300 hover:text-blue-600 hover:border-blue-600 transition-colors">Motor Yağları</a>
                    <span className="text-slate-300">,</span>
                    <a href="#" className="text-slate-600 border-b border-slate-300 hover:text-blue-600 hover:border-blue-600 transition-colors">Fren Balatası</a>
                    <span className="text-slate-300">,</span>
                    <a href="#" className="text-slate-600 border-b border-slate-300 hover:text-blue-600 hover:border-blue-600 transition-colors">Endüstriyel Rulman</a>
                </div>
            </div>

            {/* Quick Categories Bar (The kibar kutular) */}
            <div className="relative z-10 w-[95%] max-w-6xl mt-8 flex flex-wrap justify-center gap-4">
                {[
                    { title: "Motor & Aksam", jobs: "1,245 Kayıtlı", color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Filtrasyon", jobs: "840 Kayıtlı", color: "text-indigo-500", bg: "bg-indigo-50" },
                    { title: "Endüstriyel Yağlar", jobs: "245 Kayıtlı", color: "text-amber-500", bg: "bg-amber-50" },
                    { title: "Mekanik Rulman", jobs: "1,120 Kayıtlı", color: "text-teal-500", bg: "bg-teal-50" },
                    { title: "Soğutma Sistemi", jobs: "530 Kayıtlı", color: "text-sky-500", bg: "bg-sky-50" },
                    { title: "Ağır Vasıta Fren", jobs: "Yeni Talep Yok", color: "text-slate-400", bg: "bg-slate-50" }
                ].map((c, i) => (
                    <div key={i} className="flex items-center bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-shadow duration-300 rounded-xl p-3 px-5 min-w-[200px] gap-4 cursor-pointer">
                        <div className={\`w-10 h-10 rounded-lg flex items-center justify-center \${c.bg} \${c.color}\`}>
                            <Box className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-slate-800">{c.title}</span>
                            <span className="text-[11.5px] font-medium text-slate-400 mt-0.5">{c.jobs}</span>
                        </div>
                    </div>
                ))}
            </div>

        </div>

        {/* THE MATRIX (Compact Bento Grid) */}
\`

if (oldHeroRegex.test(txt)) {
    txt = txt.replace(oldHeroRegex, newHeader);
    fs.writeFileSync(file, txt);
    console.log('Successfully replaced map map ui component!');
} else {
    console.log('Could not find regex pattern. Writing entire file manually maybe?');
}
