// Utility function to check if user is system admin
export function isSystemAdmin(currentUser: any): boolean {
    if (!currentUser) return true; // null = system owner

    const role = currentUser.role?.toUpperCase() || '';

    // Check for admin roles
    return role === 'SUPER_ADMIN' ||
        role === 'ADMIN' ||
        role === 'SİSTEM SAHİBİ' ||
        role === 'SISTEM YÖNETİCİSİ' ||
        role.includes('ADMIN') ||
        role.includes('MÜDÜR');
}

// Check if user has specific permission
export function hasAdminPermission(currentUser: any, permission: string): boolean {
    if (isSystemAdmin(currentUser)) return true;

    const permissions = currentUser?.permissions || [];
    return permissions.includes('ALL') || permissions.includes(permission);
}
