"use client";

import StaffManagementContent from "@/components/StaffManagementContent";

export default function StaffPage() {
    return (
        <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-main)' }}>
            <div style={{ padding: '40px' }}>
                <StaffManagementContent />
            </div>
        </div>
    );
}
