const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/(app)/inventory/components/ProductWizardModal.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const regex = /{currentStep === 5 && \([\s\S]*?<StepConnectedProducts[^>]*\/>\s*\)}/g;
const replacement = `{currentStep === 5 && (
                        <StepConnectedProducts mode={mode} data={data} onChange={onChange} setCurrentStep={setCurrentStep} />
                    )}
                    {currentStep === 6 && (
                        <StepB2BDetails mode={mode} data={data} onChange={(dataArgs) => onChange({ target: { name: 'description', value: dataArgs.description } })} />
                    )}`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    console.log('SUCCESS: Render logic injected.');
    
    fs.writeFileSync(targetPath, content, 'utf8');
} else {
    console.log('ERROR: Regex failed.');
}

const target2 = /onChange={e => onChange\(\{ \.\.\.data, description: e.target.value \}\)}/g;
const rep2 = `onChange={e => onChange({ description: e.target.value })}`;
if (target2.test(content)) {
    content = content.replace(target2, rep2);
    console.log('SUCCESS: StepB2BDetails onChange fixed.');
    fs.writeFileSync(targetPath, content, 'utf8');
}
