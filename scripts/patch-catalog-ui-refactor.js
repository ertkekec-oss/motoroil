const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/network/catalog/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Extract logic to before return
const logicStr = `
    const imageProducts = products.filter(p => !!p.image).slice(0, 8);
    const noImageProducts = products.filter(p => !p.image);
    const leftList = noImageProducts.slice(0, Math.ceil(noImageProducts.length / 2));
    const rightList = noImageProducts.slice(Math.ceil(noImageProducts.length / 2));
`;
content = content.replace('    return (', logicStr + '\n    return (');

// 2. Remove IIFE wrapper
const iifeStart = `{(() => {
                                    const imageProducts = products.filter(p => !!p.image).slice(0, 8);
                                    const noImageProducts = products.filter(p => !p.image);
                                    
                                    // eyer yeteri kadar fill yoksa 16'ya tamamla gibi karmaşık logic yerine
                                    // direkt "imageProducts" ve kalanlar "noImageProducts"
                                    // User says: "her sıra 4 görseli olan ürün olacak şekilde 2 sıra listele" => 8 columns exactly
                                    // "kalan 4 ürün alanı ikiye böl, 1 alana 4 ürün yanına 4 ürün listele (görseli olmayanlar)"
                                    
                                    
                                    const leftList = noImageProducts.slice(0, Math.ceil(noImageProducts.length / 2));
                                    const rightList = noImageProducts.slice(Math.ceil(noImageProducts.length / 2));

                                    return (
                                        <>`;
content = content.replace(iifeStart, '<>');

const iifeEnd = `                                        </>
                                    );
                                })()}`;
content = content.replace(iifeEnd, '</>');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('SUCCESS: Refactored UI logic to top of component!');
