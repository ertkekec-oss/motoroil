const fs = require('fs');

const editorFile = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/(app)/admin/cms/editor/[pageId]/EditorClient.tsx';
let editorContent = fs.readFileSync(editorFile, 'utf8');

// Replace ImageUploadField with standard inputs
editorContent = editorContent.replace(
    /<ImageUploadField value=\{activeBlock\.content\.integB1Img \|\| ''\} onChange=\{val => updateBlockData\('integB1Img', val\)\} \/>/g,
    `<input placeholder="Geniş Resim URL (E-Ticaret Yönetimi)" value={activeBlock.content.integB1Img || ''} onChange={e => updateBlockData('integB1Img', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />`
);

editorContent = editorContent.replace(
    /<ImageUploadField value=\{activeBlock\.content\.integB2Img \|\| ''\} onChange=\{val => updateBlockData\('integB2Img', val\)\} \/>/g,
    `<input placeholder="Dikey Resim URL (Focus)" value={activeBlock.content.integB2Img || ''} onChange={e => updateBlockData('integB2Img', e.target.value)} className="w-full bg-slate-900 border border-slate-700/50 rounded p-1.5 text-[10px] text-white mt-1" />`
);

fs.writeFileSync(editorFile, editorContent);
console.log('REMOVED ImageUploadField');
