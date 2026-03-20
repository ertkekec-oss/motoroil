const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/network/catalog/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add Pagination state
if (!content.includes('const [page, setPage]')) {
    content = content.replace(
        'const [products, setProducts] = useState<any[]>([])',
        'const [products, setProducts] = useState<any[]>([])\n    const [page, setPage] = useState(1)\n    const [totalPages, setTotalPages] = useState(1)'
    );
}

// 2. FetchCatalog to use page and limit=16
content = content.replace(
    /const res = await fetch\(\`\/api\/network\/catalog\?q=\$\{encodeURIComponent\(q\)\}&category=\$\{encodeURIComponent\(activeCat\)\}\`\)/g,
    'const res = await fetch(`/api/network/catalog?q=${encodeURIComponent(q)}&category=${encodeURIComponent(activeCat)}&page=${page}&take=16`)'
);

content = content.replace(
    'if (res.ok && data.ok) {\n                setProducts(data.products || [])\n            }',
    'if (res.ok && data.ok) {\n                setProducts(data.products || [])\n                if (data.pagination) setTotalPages(data.pagination.totalPages || 1)\n            }'
);

// 3. Add effect dependency on page
content = content.replace(
    /return \(\) => clearTimeout\(timer\)\n    \}, \[q, activeCat\]\)/g,
    'return () => clearTimeout(timer)\n    }, [q, activeCat, page])'
);

// reset page to 1 when search or category changes
if (!content.includes('useEffect(() => { setPage(1) }, [q, activeCat])')) {
    content = content.replace(
        'const fetchCatalog = async () => {',
        'useEffect(() => { setPage(1) }, [q, activeCat])\n\n    const fetchCatalog = async () => {'
    );
}

// 4. Update Render Logic
const newRender = `                        <div className="space-y-12">
                            {/* Grid Array (First 8 items with image or just the first 8) */}
                            {(() => {
                                const imageProducts = products.filter(p => !!p.image).slice(0, 8);
                                const noImageProducts = products.filter(p => !p.image);
                                
                                // eyer yeteri kadar fill yoksa 16'ya tamamla gibi karmaşık logic yerine
                                // direkt "imageProducts" ve kalanlar "noImageProducts"
                                // User says: "her sıra 4 görseli olan ürün olacak şekilde 2 sıra listele" => 8 columns exactly
                                // "kalan 4 ürün alanı ikiye böl, 1 alana 4 ürün yanına 4 ürün listele (görseli olmayanlar)"
                                
                                
                                const leftList = noImageProducts.slice(0, Math.ceil(noImageProducts.length / 2));
                                const rightList = noImageProducts.slice(Math.ceil(noImageProducts.length / 2));

                                return (
                                    <>
                                        {imageProducts.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {imageProducts.map(p => (
                                                    <div key={p.id} className="group bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col relative">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-transparent group-hover:from-blue-500/20 group-hover:via-blue-500/20 transition-colors duration-500" />
                                                        <div className="h-48 bg-slate-50/50 border-b border-slate-100 flex items-center justify-center p-6 relative">
                                                            <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-300">
                                                                <img src={p.image} alt={p.name} className="w-full h-full object-contain filter drop-shadow-sm mix-blend-multiply" />
                                                            </div>
                                                        </div>
                                                        <div className="p-5 flex flex-col flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase bg-slate-100 px-2 py-0.5 rounded-md">{p.sku || "N/A"}</span>
                                                                {(p.minOrderQty > 1) && (
                                                                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">MOQ: {p.minOrderQty}</span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                                            <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100/50">
                                                                <div>
                                                                    <div className="text-[12px] font-medium text-slate-500 mb-0.5">Size Özel</div>
                                                                    <div className="text-lg font-bold text-slate-900 tracking-tight">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</div>
                                                                    <div className="text-[12px] text-slate-500 mt-1 flex items-center gap-1.5"><div className={\`w-1.5 h-1.5 rounded-full \${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}\`} /> Stok: {p.stock > 0 ? <span className="font-medium text-slate-700">{p.stock} adet</span> : "Tükendi"}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => router.push('/network/catalog/' + p.id)} className="h-10 px-3 rounded-xl text-[13px] font-semibold flex items-center justify-center bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm" title="İncele"><Info className="w-4 h-4" strokeWidth={2} /></button>
                                                                    <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={\`h-10 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center min-w-[80px] gap-2 transition-all active:scale-95 border \${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : p.stock < (p.minOrderQty || 1) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm'}\`}>
                                                                        {addingToCart === p.id ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Eklendi</> : <><Plus className="w-4 h-4" strokeWidth={2.5} /> Ekle</>}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {noImageProducts.length > 0 && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                                                {/* Left List */}
                                                <div className="flex flex-col gap-3">
                                                    {leftList.map(p => (
                                                        <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden group">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                                                            <div className="flex-1 min-w-0 pl-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{p.sku || "N/A"}</span>
                                                                    <div className={\`w-1.5 h-1.5 rounded-full \${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}\`} />
                                                                </div>
                                                                <h4 className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</h4>
                                                            </div>
                                                            <div className="flex flex-col items-end pr-2 text-right shrink-0">
                                                                <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-4">
                                                                <button onClick={() => router.push('/network/catalog/' + p.id)} className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"><Info className="w-[18px] h-[18px]" strokeWidth={2} /></button>
                                                                <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={\`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors border \${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600' : p.stock < (p.minOrderQty || 1) ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}\`}>
                                                                    {addingToCart === p.id ? <Check className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Right List */}
                                                <div className="flex flex-col gap-3">
                                                    {rightList.map(p => (
                                                        <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition-colors shadow-sm relative overflow-hidden group">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                                                            <div className="flex-1 min-w-0 pl-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">{p.sku || "N/A"}</span>
                                                                    <div className={\`w-1.5 h-1.5 rounded-full \${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}\`} />
                                                                </div>
                                                                <h4 className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</h4>
                                                            </div>
                                                            <div className="flex flex-col items-end pr-2 text-right shrink-0">
                                                                <span className="font-black text-slate-900 text-[15px]">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.priceResolved)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-100 pl-4">
                                                                <button onClick={() => router.push('/network/catalog/' + p.id)} className="w-[38px] h-[38px] rounded-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors border border-slate-200"><Info className="w-[18px] h-[18px]" strokeWidth={2} /></button>
                                                                <button disabled={addingToCart === p.id || p.stock < (p.minOrderQty || 1)} onClick={() => addToCart(p, Math.max(1, p.minOrderQty || 1))} className={\`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors border \${addingToCart === p.id ? 'bg-emerald-600 text-white border-emerald-600' : p.stock < (p.minOrderQty || 1) ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}\`}>
                                                                    {addingToCart === p.id ? <Check className="w-[18px] h-[18px]" strokeWidth={2.5} /> : <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        
                        {/* Pagination Buttons */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <button 
                                    className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold disabled:opacity-50 text-slate-600"
                                    disabled={page <= 1} onClick={() => setPage(page - 1)}
                                >
                                    Önceki
                                </button>
                                <div className="text-sm font-semibold text-slate-600 px-4">
                                    Sayfa {page} / {totalPages}
                                </div>
                                <button 
                                    className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold disabled:opacity-50 text-slate-600"
                                    disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                >
                                    Sonraki
                                </button>
                            </div>
                        )}`;

const oldRenderStart = '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">';
const oldRenderEndRegex = /\{\/\* Footer Text \*\/\}/g;

const startIdx = content.indexOf(oldRenderStart);
let endIdx = -1;
let match;
while ((match = oldRenderEndRegex.exec(content)) !== null) {
    endIdx = match.index;
    break;
}

if (startIdx !== -1 && endIdx !== -1) {
    // Replace the block inside `) : (` down to `{/* Footer Text */}`
    // Backing up just before `}` of the map block is tricky, let's just use string slicing
    const contentBefore = content.substring(0, startIdx);
    const contentAfter = content.substring(endIdx);
    
    // Actually wait, let's remove the ending `</div>\n                    )}` 
    // And attach our new render logic which comes inside the `) : (`
    const endMatch = contentBefore.lastIndexOf(') : (');
    if (endMatch !== -1) {
        content = contentBefore.substring(0, endMatch + 5) + '\n' + newRender + '\n                    )}\n                </div>\n\n                ' + contentAfter;
    }
} else {
    console.log("Could not find old render block!");
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('SUCCESS: UI Render logic rewritten!');
