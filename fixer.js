const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// The missing quote in h1
code = code.replace(/text-transparent  style=\{\{/g, 'text-transparent" style={{');

// The <th><tr> -> <thead className="..."><tr>
code = code.replace(/<th className="([^"]*?sticky top-0([^"]*?))">(\s*)<tr/g, '<thead className="$1">\n<tr>');
code = code.replace(/<th className="([^"]*?sticky top-0([^"]*?))">\n(\s*)<tr/g, '<thead className="$1">\n<tr>');

// Any inputs that might have been accidentally given a 12px padding string instead of real replacement
code = code.replace(/className="text-2xl font-black mb-2 bg-clip-text text-transparent  style=\{\{/g, 'className="text-2xl font-black mb-2 bg-clip-text text-transparent" style={{');
code = code.replace(/<h1 className="text-2xl font-black mb-2 bg-clip-text text-transparent  style/g, '<h1 className="text-2xl font-black mb-2 bg-clip-text text-transparent" style');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');

let code2 = fs.readFileSync('src/components/IntegrationsContent.tsx', 'utf8');
code2 = code2.replace(/<th className="([^"]*?sticky top-0([^"]*?))">(\s*)<tr/g, '<thead className="$1">\n<tr>');
code2 = code2.replace(/<th className="([^"]*?sticky top-0([^"]*?))">\n(\s*)<tr/g, '<thead className="$1">\n<tr>');
fs.writeFileSync('src/components/IntegrationsContent.tsx', code2, 'utf8');

console.log('Fixed tags');
