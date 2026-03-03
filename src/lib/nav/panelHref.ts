export function getPanelHref(role?: string | null, isDealer?: boolean): string {
    if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN') return '/admin/dashboard';
    if (isDealer) return '/network';
    return '/dashboard';
}
