const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/(app)/settings/page.tsx');

const formsDir = 'src/app/(app)/settings/_components/forms';
if (!fs.existsSync(formsDir)) {
    fs.mkdirSync(formsDir, { recursive: true });
}

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
    'reset': 'SystemResetPanel'
};

const settingsPage = sourceFile.getFunction('SettingsPage');
const returnStatement = settingsPage.getStatements().find(s => s.getKind() === SyntaxKind.ReturnStatement);
const returnExpr = returnStatement.getExpression();

const jsxExpressions = returnExpr.getDescendantsOfKind(SyntaxKind.JsxExpression).reverse();
let componentsCreated = [];

jsxExpressions.forEach(expr => {
    if (expr.wasForgotten()) return;

    const binaryExpr = expr.getExpressionIfKind(SyntaxKind.BinaryExpression);
    if (binaryExpr && binaryExpr.getOperatorToken().getKind() === SyntaxKind.AmpersandAmpersandToken) {
        const left = binaryExpr.getLeft();
        const right = binaryExpr.getRight();

        if (left.getKind() === SyntaxKind.BinaryExpression && left.getText().includes('activeTab') && left.getRight().getKind() === SyntaxKind.StringLiteral) {
            const tabName = left.getRight().getLiteralValue();

            const compName = tabComponents[tabName] || (tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Panel');
            const compFile = `${formsDir}/${compName}.tsx`;

            let blockStr = right.getText();
            blockStr = blockStr.replace(/style=\{\{.*?\}\}/g, '');
            blockStr = blockStr.replace(/bg-\[\#E64A00\]/g, 'bg-blue-600');
            blockStr = blockStr.replace(/rgba\(255\,\s*85\,\s*0\,[^\)]+\)/g, 'rgba(36,123,254,0.3)');

            const childCode = `import React from 'react';\n\nexport default function ${compName}(props: any) {\n    const { activeTab, setActiveTab, appSettings, tempCompanyInfo, setTempCompanyInfo, isSaving, handleSaveCompany, newCampaign, setNewCampaign, editingCampaignId, setEditingCampaignId, addCampaign, startEditingCampaign, deleteCampaign, newCoupon, setNewCoupon, showCouponModal, setShowCouponModal, couponSearch, setCouponSearch, couponPage, setCouponPage, exportCouponsExcel, exportCouponsPDF, totalCouponPages, paginatedCouponsList, referralSettings, setReferralSettings, saveReferralSettings, coupons, refreshCoupons, newKdv, setNewKdv, invoiceSettings, updateInvoiceSettings, customers, custClasses, setCustClasses, suppliers, suppClasses, setSuppClasses, kasalar, setKasalar, newKasa, setNewKasa, editingKasa, setEditingKasa, kasalarTotalBalance, isProcessingKasa, showKasaModal, setShowKasaModal, handleSaveKasa, handleDeleteKasa, startEditingKasa, newPaymentMethod, setNewPaymentMethod, paymentMethods, updatePaymentMethods, serviceSettings, updateServiceSettings, localServiceSettings, setLocalServiceSettings, handleSaveServiceSettings, branches, newBranch, setNewBranch, editingBranchId, setEditingBranchId, addBranch, editBranch, deleteBranch, branchDefaults, updateBranchDefault, saveBranchDefaults, users, refreshStaff, newUser, setNewUser, addUser, deleteUser, editingUserPerms, setEditingUserPerms, availablePermissions, permissionTemplates, notifSettings, setNotifSettings, saveNotifSettings, logs, isLogsLoading, fetchLogs, smtpSettings, setSmtpSettings, resetOptions, setResetOptions, showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, kasalarLoading, currentUser, profilePass, setProfilePass, handlePasswordChange, resetSettings, ...rest } = props;\n\n    return (\n        ${blockStr}\n    );\n}\n`;

            fs.writeFileSync(compFile, childCode, 'utf8');
            console.log(`Created ${compFile}`);
            componentsCreated.push(compName);

            right.replaceWithText(`<${compName} {...sharedProps} />`);
        }
    }
});

const propsStr = `
    const sharedProps: any = { 
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
        showSuccess, showError, showWarning, showConfirm, definitionTab, setDefinitionTab, campaignSubTab, setCampaignSubTab, refreshKasalar, refreshBranches, currentUser, profilePass, setProfilePass, handlePasswordChange,
        kasalarTotalBalance: kasalar?.reduce((a,b) => a+b.balance, 0) || 0
    };
`;

const stmts = settingsPage.getStatements();
const rIndex = stmts.findIndex(s => s.getKind() === SyntaxKind.ReturnStatement);
settingsPage.insertStatements(rIndex, propsStr);

// Clean up inline styles in page.tsx itself via string replacement
const newReturn = returnStatement.getText().replace(/style=\{\{.*?\}\}/g, '');
returnStatement.replaceWithText(newReturn);

const imports = Array.from(new Set(componentsCreated)).map(name => `import ${name} from './_components/forms/${name}';`).join('\n');
sourceFile.insertStatements(1, imports);

project.saveSync();
console.log('Successfully completed Settings refactor execution via ts-morph.');
