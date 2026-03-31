const fs = require('fs');
const file = 'src/app/(app)/suppliers/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// 1. Remove the huge Top Banner "Enterprise Oval Tabs & Header Replacement"
data = data.replace(/\{\/\* Enterprise Oval Tabs & Header Replacement \*\/\}\s*<div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-\[#0f172a\] p-2 rounded-\[20px\] mb-6 border border-slate-200 dark:border-white\/5 shadow-sm relative z-10 w-full">\s*<div className="flex bg-slate-100 dark:bg-\[#1e293b\]\/50 p-1\.5 rounded-full w-full md:w-auto overflow-x-auto shadow-inner border border-slate-200\/50 dark:border-white\/5 custom-scroll">[\s\S]*?<\/div>\s*<\/div>/, '');

// 2. Insert the Tabs right above {/* Controls */} but inside a nice clean wrapper, and modify Controls to match the flex-wrap pattern of Customers.
const oldControlsRegex = /\{\/\* Controls \*\/\}\s*<div className="flex flex-col gap-4">/g;

data = data.replace(oldControlsRegex,
`{/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-2 mb-2 w-full overflow-x-auto custom-scroll">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={\`px-4 py-1.5 text-[12px] font-bold rounded-[6px] transition-all whitespace-nowrap \${
                isActive
                  ? "bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-white/10"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent"
              }\`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">`
);

// 3. Rewrite the internal Controls search row to be responsive flex-wrap with the Yeni Tedarikçi button
const searchRowRegex = /<div className="flex justify-between items-center gap-4">\s*\{\/\* Search Box \*\/\}\s*(<div className="relative flex-1 max-w-\[600px\]">[\s\S]*?<\/div>)\s*<div className="flex gap-2">[\s\S]*?<button\s*onClick=\{\(\) => setShowFilters\(!showFilters\)\}[\s\S]*?>[\s\S]*?<Filter className="w-4 h-4" \/>\s*Filtreler\s*<\/button>\s*(<div className=\{\`flex p-1 rounded-\[10px\] border \$\{isLight \? "bg-slate-50 border-slate-200" : "bg-slate-900\/50 border-slate-800"\}\`\}>[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/;

data = data.replace(searchRowRegex, 
`<div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <h3 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest hidden sm:block">Kayıt Listesi</h3>
             $2
          </div>
          
          <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-none justify-start sm:justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={\`h-[36px] px-4 rounded-[8px] text-[12px] font-semibold border flex items-center gap-2 transition-all shadow-sm \${showFilters
                  ? isLight
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-blue-900/20 border-blue-800/50 text-blue-400"
                  : isLight
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                }\`}
            >
              <Filter className="w-4 h-4" />
              Filtreler
            </button>

            $1

            <button
               onClick={() => setIsModalOpen(true)}
               className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
            >
               <Plus className="w-4 h-4" />
               YENİ
            </button>
          </div>
        </div>`
);

// 4. Also fix the View Mode Buttons matching Müşteri (Grid, List button shape inside the `p-1 rounded` container)
data = data.replace(
  /w-8 h-8 flex items-center/g,
  `w-7 h-7 flex items-center`
);

data = data.replace(/<div className=\{\`flex p-1 rounded-\[10px\]/g, `<div className={\`flex p-1 rounded-full`);


fs.writeFileSync(file, data);
console.log('Suppliers Page fixed');
