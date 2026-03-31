const fs = require('fs');
const path = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(path, 'utf8');

const lines = data.split('\n');
const newLines = lines.map(line => {
    if (line.includes('const [searchTerm, setSearchTerm] = useState')) {
        return "    const [searchTerm, setSearchTerm] = useState('');";
    }
    return line;
});

fs.writeFileSync(path, newLines.join('\n'));
console.log('Fixed');
