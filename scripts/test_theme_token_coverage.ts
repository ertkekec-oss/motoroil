import * as fs from 'fs';
import * as path from 'path';

/**
 * Audit Script for Design Token System
 * This script scans the codebase for hardcoded hex colors and legacy slate/gray shades.
 */

const SECTIONS = ['src/app', 'src/components', 'src/services'];
const HEX_REGEX = /#([A-Fa-f0-9]{3}){1,2}\b/g;
const LEGACY_CLASSES = [
    'slate-', 'gray-', 'zinc-', 'neutral-', 'stone-',
    'bg-[#', 'text-[#', 'border-[#', 'ring-[#', 'shadow-[#',
    'bg-white', 'text-white', 'bg-black', 'text-black'
];

function auditDir(dir: string, results: string[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                auditDir(fullPath, results);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach((line, i) => {
                let match;
                // Check HEX
                while ((match = HEX_REGEX.exec(line)) !== null) {
                    results.push(`HEX: ${fullPath}:${i + 1} -> ${match[0]}`);
                }
                
                // Check Legacy Classes
                LEGACY_CLASSES.forEach(cls => {
                    if (line.includes(cls)) {
                        results.push(`LEGACY: ${fullPath}:${i + 1} -> Found "${cls}"`);
                    }
                });
            });
        }
    }
}

const auditResults: string[] = [];
const projectRoot = process.cwd();

console.log('--- PERIODYA DESIGN TOKEN AUDIT ---');
SECTIONS.forEach(section => {
    const fullPath = path.join(projectRoot, section);
    if (fs.existsSync(fullPath)) {
        console.log(`Auditing ${section}...`);
        auditDir(fullPath, auditResults);
    }
});

const reportPath = path.join(projectRoot, 'design_token_audit.md');
const reportContent = `
# Design Token Audit Report
Generated on: ${new Date().toLocaleString()}

## Summary
- **Total findings:** ${auditResults.length}
- **HEX matches:** ${auditResults.filter(r => r.startsWith('HEX')).length}
- **Legacy classes:** ${auditResults.filter(r => r.startsWith('LEGACY')).length}

## Details
\`\`\`
${auditResults.join('\n')}
\`\`\`
`;

fs.writeFileSync(reportPath, reportContent);
console.log(`Audit complete. Report saved to: ${reportPath}`);
