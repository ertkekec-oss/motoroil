const fs = require('fs');
const file = 'src/app/(app)/inventory/page.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
  'const [categories, setCategories] = useState<any[]>([]);',
  'const [categories, setCategories] = useState<any[]>([]);\n  const [globalCategories, setGlobalCategories] = useState<any[]>([]);'
);

txt = txt.replace(
  'fetch("/api/settings/attributes")',
  'fetch("/api/catalog/global-categories").then(r => r.json()).then(d => { if(d.success) setGlobalCategories(d.categories || d.data); }).catch(console.error);\n\n    fetch("/api/settings/attributes")'
);

txt = txt.replace(
  'categories={dbCategories}',
  'categories={dbCategories}\n        globalCategories={globalCategories}'
);

txt = txt.replace(
  'category: "Motosiklet",\n    type: "Diğer",',
  'category: "",\n    type: "Ürün",'
);

fs.writeFileSync(file, txt);
console.log("Done patching page.tsx");
