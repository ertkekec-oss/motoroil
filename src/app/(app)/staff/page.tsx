"use client";

import StaffManagementContent from "@/components/StaffManagementContent";

export default function StaffPage() {
    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans dark:bg-[#020617] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900/40 dark:via-[#020617] dark:to-[#020617]">
            <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8">
                <StaffManagementContent />
            </div>
        </div>
    );
}
