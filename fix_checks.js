
const fs = require('fs');
const file = 'src/app/api/financials/checks/[id]/status/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    /if \(check.type === 'In'\) \{[\s\S]*const updatedCheck = await prisma.check.update\(\{[\s\S]*data: \{ status \}[\s\S]*\}\);/g,
    function(match) {
        // Wrap the whole block in prisma.
        let inner = match.replace(/prisma\./g, 'tx.');
        // fix createAccountingSlip
        inner = inner.replace(/createAccountingSlip\(\{([\s\S]*?)\}\)/g, 'createAccountingSlip({}, tx)');
        // fix getAccountForKasa
        inner = inner.replace(/getAccountForKasa\(kasaId, branch\)/g, 'getAccountForKasa(kasaId, branch, tx)');
        
        return 'const updatedCheck = await prisma.(async (tx) => {\n        ' + inner + '\n        return tx.check.findUnique({ where: { id } }); // Return updated check from tx\n        });';
    }
);

fs.writeFileSync(file, code);
console.log('Done!');

