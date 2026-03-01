const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/(app)/settings/page.tsx');

const formsDir = 'src/app/(app)/settings/_components/forms';
if (!fs.existsSync(formsDir)) {
    fs.mkdirSync(formsDir, { recursive: true });
}

// Map tab names to component names
const tabComponents = {
    'company': 'CompanyProfileForm',
    'integrations': 'IntegrationsPanel',
    'branches': 'BranchesPanel',
    'profile': 'AccountPanel',
    'invoice': 'InvoiceSettingsPanel',
    'services': 'ServiceFeesPanel',
    'taxes': 'TaxesPanel',
    'expenses': 'SalesExpensesPanel',
    'campaigns': 'CampaignPointsPanel',
    'definitions': 'DefinitionsListPanel',
    'notifications': 'NotificationSettingsPanel',
    'backup': 'CloudBackupPanel',
    'logs': 'AuditLogsPanel',
    'system': 'MailSettingsPanel',
    'SystemReset': 'SystemResetPanel', // Maybe 'reset' is what's used
    'reset': 'SystemResetPanel'
};

const settingsPage = sourceFile.getFunction('SettingsPage');
const returnStatement = settingsPage.getStatements().find(s => s.getKind() === SyntaxKind.ReturnStatement);

const returnExpr = returnStatement.getExpression();

// Extract ALL variables in the scope to pass down as a generic 'props'
// A simplistic way is just to pass `props: any` and instruct the child component to destructure EVERYTHING
// We won't try to selectively extract them because it's too error prone.
const allIdentifiers = Array.from(new Set(sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).map(d => d.getText())));
// Actually just pass `...sharedProps` inside `page.tsx` and we don't care about unused children destructuring

// Find all JSX Expressions like `{activeTab === 'company' && (<div ...>...</div>)}`
const jsxExpressions = returnExpr.getDescendantsOfKind(SyntaxKind.JsxExpression);
let componentsCreated = [];

jsxExpressions.forEach(expr => {
    const binaryExpr = expr.getExpressionIfKind(SyntaxKind.BinaryExpression);
    if (binaryExpr && binaryExpr.getOperatorToken().getKind() === SyntaxKind.AmpersandAmpersandToken) {
        const left = binaryExpr.getLeft();
        const right = binaryExpr.getRight();

        // Check if left is activeTab === '...'
        if (left.getKind() === SyntaxKind.BinaryExpression && left.getText().includes('activeTab') && left.getRight().getKind() === SyntaxKind.StringLiteral) {
            const tabName = left.getRight().getLiteralValue();

            const compName = tabComponents[tabName] || (tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Panel');
            const compFile = `${formsDir}/${compName}.tsx`;

            let blockStr = right.getText();

            // Refactor away inline styles inside blockStr per prompt instructions
            // Remove style={{ ... }} 
            // e.g. style={{ fontSize: '14px', background: "var(--danger)" }} -> ""
            blockStr = blockStr.replace(/style=\{\{.*?\}\}/g, '');
            // Simple string replacement for old specific tokens if needed
            blockStr = blockStr.replace(/bg-\[\#E64A00\]/g, 'bg-blue-600');
            blockStr = blockStr.replace(/rgba\(255\,\s*85\,\s*0\,[^\)]+\)/g, 'rgba(36,123,254,0.3)');

            // Build the new child component file
            const childCode = `import React from 'react';\n\nexport default function ${compName}(props: any) {\n    const { activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, ...rest } = props;\n\n    return (\n        ${blockStr}\n    );\n}\n`;

            fs.writeFileSync(compFile, childCode, 'utf8');
            console.log(`Created ${compFile}`);
            componentsCreated.push(compName);

            // Replace the right side of the binary expression with `<CompName {...sharedProps} />`
            right.replaceWithText(`<${compName} {...sharedProps} />`);
        }
    }
});

// Write the sharedProps declaration
// To guarantee zero undefined variables in lexical scopes, let's just make `sharedProps` dump the entire scope of the page into a generic object before the return statement.
const propsStr = `
    const sharedProps = { 
        activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, 
        newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, 
        newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, 
        referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, 
        newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings,
        customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses,
        kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa,
        newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods,
        serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings,
        branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults,
        users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates,
        notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions,
        showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, currentUser, profilePass, setProfilePass, handlePasswordChange
    };
`;

// Inject sharedProps before `return (`
const stmts = settingsPage.getStatements();
const returnIndex = stmts.findIndex(s => s.getKind() === SyntaxKind.ReturnStatement);
settingsPage.insertStatements(returnIndex, propsStr);

// Inject imports for all the newly created components at the very beginning of the file (after "use client";)
const imports = componentsCreated.map(name => `import ${name} from './_components/forms/${name}';`).join('\n');
sourceFile.insertStatements(1, imports);

// We should also remove inline styles from the leftover SettingsPage JSX
const pageJSXStr = returnExpr.getText();
const sanitizedPageJSXStr = pageJSXStr.replace(/style=\{\{.*?\}\}/g, '');
returnExpr.replaceWithText(sanitizedPageJSXStr);

project.saveSync();
console.log('Successfully completed Settings refactor execution via ts-morph.');
