
/**
 * Global API Client helper to automatically inject impersonation headers
 * if a Platform Admin has selected a target tenant.
 */
export const getActiveTenantId = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('periodya_activeTenantId');
    }
    return null;
};

export const apiFetch = async (url: string, options: any = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Inject Target Tenant ID for Impersonation
    const tenantId = getActiveTenantId();
    if (tenantId) {
        headers['x-target-tenant-id'] = tenantId;
    }

    return fetch(url, {
        ...options,
        headers
    });
};
