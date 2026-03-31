const fs = require('fs');
const file = 'src/app/(app)/customers/[id]/CustomerDetailClient.tsx';
let data = fs.readFileSync(file, 'utf8');

const regex = /const \[searchTerm, setSearchTerm\] = useState\(\\'\\'\\);\s*\\n\s*const \[searchTerm, setSearchTerm\] = useState\(''\);/;
const regex2 = /const \[searchTerm, setSearchTerm\] = useState\(\\?'\\?'\);\s*\\n\s*const \[searchTerm, setSearchTerm\] = useState\(''\);/;

// Wait, let's just do a string replacement targeting exactly what is seen
data = data.replace('    const [searchTerm, setSearchTerm] = useState(\\\'\\\');\\n    const [searchTerm, setSearchTerm] = useState(\\'\\');', '    const [searchTerm, setSearchTerm] = useState(\\'\\');');

// Alternatively replace line by line
const lines = data.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("useState(\\'\\');\\n")) {
        // Skip this malformed line that contains a literal \n
        continue;
    }
    // Check if the current line itself has the literal \n text
    if (lines[i].includes("\\n    const [searchTerm, setSearchTerm] = useState('');")) {
        lines[i] = lines[i].replace("\\n    const [searchTerm, setSearchTerm] = useState('');", "");
    }
    // Also if the line is exactly "    const [searchTerm, setSearchTerm] = useState(\\'\\');"
    if (lines[i] === "    const [searchTerm, setSearchTerm] = useState(\\'\\');") {
        lines[i] = "    const [searchTerm, setSearchTerm] = useState('');";
    }
    
    // Also handle this literal string in the file: const [searchTerm, setSearchTerm] = useState(\'\');\n    const [searchTerm, setSearchTerm] = useState('');
    if (lines[i].includes("useState(\\'\\');\\n    const [searchTerm, setSearchTerm] = useState('')")) {
        lines[i] = "    const [searchTerm, setSearchTerm] = useState('');";
    }
    newLines.push(lines[i]);
}

let result = newLines.join('\n');
// one more global cleanup for exact match seen in output
result = result.replace("const [searchTerm, setSearchTerm] = useState(\\'\\');\\n    const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');");

fs.writeFileSync(file, result);
console.log('Fixed');
