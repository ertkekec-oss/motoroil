export const rk = {
    replay: (tenantId: string, nonce: string) => `pdks:replay:${tenantId}:${nonce}`,
    dispIp: (displayId: string) => `pdks:disp_ip:${displayId}`,
    rlUser: (tenantId: string, userId: string) => `pdks:rl:${tenantId}:${userId}`,
    sync: (tenantId: string, offlineId: string) => `pdks:sync:${tenantId}:${offlineId}`,
};
