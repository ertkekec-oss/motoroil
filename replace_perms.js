const fs = require('fs');
const path = require('path');

const map = {
    'pos_access': 'sales_pos_view',
    'sales_archive': 'sales_history_view',
    'discount_auth': 'sales_discount_approve',
    'price_override': 'sales_price_override',
    'return_create': 'sales_return_create',
    'credit_sales': 'sales_credit_allow',
    'field_sales_access': 'sales_field_access',
    'field_sales_admin': 'sales_field_admin',
    'service_view': 'service_view',
    'service_create': 'service_manage',
    'service_complete': 'service_manage',
    'offer_create': 'sales_offer_create',
    'offer_approve': 'sales_offer_approve',
    'inventory_view': 'inventory_view',
    'inventory_edit': 'inventory_manage',
    'inventory_transfer': 'inventory_transfer',
    'stock_correction': 'inventory_adjust',
    'finance_view': 'finance_dashboard_view',
    'finance_transactions': 'finance_transactions_view',
    'accounting_manage': 'finance_transactions_manage',
    'expense_create': 'finance_expense_create',
    'finance_reports': 'finance_reports_view',
    'customer_view': 'crm_customer_view',
    'customer_edit': 'crm_customer_manage',
    'customer_delete': 'crm_customer_delete',
    'supplier_view': 'crm_supplier_view',
    'supplier_edit': 'crm_supplier_manage',
    'ecommerce_view': 'sales_ecommerce_view',
    'ecommerce_manage': 'sales_ecommerce_manage',
    'staff_manage': 'hr_staff_manage',
    'settings_manage': 'admin_settings_manage',
    'admin_view': 'admin_dashboard_view',
    'security_access': 'admin_security_view',
    'delete_records': 'admin_delete_records',
    'create_staff': 'hr_staff_manage',
    'create_bank': 'finance_transactions_manage',
    'approve_products': 'inventory_manage',
    'approve_transfers': 'inventory_transfer',
    'hr_view': 'hr_staff_view',
    'hr_manage': 'hr_staff_manage',
    'payroll_manage': 'hr_payroll_manage',
    'shift_manage': 'hr_shift_leave_manage',
    'tax_manage': 'finance_tax_manage',
    'mizan_export': 'finance_reports_view',
    'e_invoice': 'finance_einvoice_manage',
    'branch_isolation': 'restriction_branch_isolation',
    'audit_view': 'admin_security_view',
    'reports_view': 'finance_reports_view',
    'b2b_manage': 'sales_b2b_manage'
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
                processDir(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            for (const [oldPerm, newPerm] of Object.entries(map)) {
                // Ignore cases where the oldPerm is part of a larger string if possible, or just exact match
                // We are matching exact strings inside quotes
                const regex1 = new RegExp(`'${oldPerm}'`, 'g');
                content = content.replace(regex1, `'${newPerm}'`);
                const regex2 = new RegExp(`"${oldPerm}"`, 'g');
                content = content.replace(regex2, `"${newPerm}"`);
            }
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

const dirToProcess = path.resolve('c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src');
processDir(dirToProcess);
console.log('Done!');
