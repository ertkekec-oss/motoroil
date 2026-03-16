
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
    const headers = { ...options.headers };

    // Auto-inject JSON Content-Type if body is present and not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Inject Target Tenant ID for Impersonation
    const tenantId = getActiveTenantId();
    if (tenantId) {
        headers['x-target-tenant-id'] = tenantId;
    }

    // Inject Active Branch Context if present in localStorage
    if (typeof window !== 'undefined') {
        const activeBranch = localStorage.getItem('periodya_activeBranch') || localStorage.getItem('motoroil_activeBranch');
        if (activeBranch) {
            // Encode to prevent "TypeError: Invalid character in header content" 
            // if branch name contains non-ASCII (e.g., "Şube", "Merkez")
            headers['x-active-branch'] = encodeURIComponent(activeBranch);
        }
    }

    return fetch(url, {
        ...options,
        headers
    });
};
