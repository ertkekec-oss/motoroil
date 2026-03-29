/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // ── Brand ──
                primary: 'var(--action-primary-bg)',
                'primary-hover': 'var(--action-primary-hover)',
                'primary-text': 'var(--action-primary-text)',
                
                // ── Semantic Backgrounds ──
                app: 'var(--bg-app)',
                surface: 'var(--bg-surface)',
                'surface-secondary': 'var(--bg-surface-secondary)',
                'surface-tertiary': 'var(--bg-surface-tertiary)',
                elevated: 'var(--bg-elevated)',

                // ── Semantic Text ──
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'text-muted': 'var(--text-muted)',
                'text-disabled': 'var(--text-disabled)',
                'text-inverse': 'var(--text-inverse)',

                // ── Semantic Borders ──
                'border-default': 'var(--border-default)',
                'border-muted': 'var(--border-muted)',
                'border-strong': 'var(--border-strong)',
                'border-focus': 'var(--border-focus)',
                'border-divider': 'var(--border-divider)',

                // ── Semantic States ──
                'state-success-bg': 'var(--state-success-bg)',
                'state-success-text': 'var(--state-success-text)',
                'state-error-bg': 'var(--state-error-bg)',
                'state-error-text': 'var(--state-error-text)',
                'state-warning-bg': 'var(--state-warning-bg)',
                'state-warning-text': 'var(--state-warning-text)',
                'state-info-bg': 'var(--state-info-bg)',
                'state-info-text': 'var(--state-info-text)',
                'state-alert-bg': 'var(--state-alert-bg)',
                'state-alert-text': 'var(--state-alert-text)',

                // ── Action Buttons ──
                'action-primary-bg': 'var(--action-primary-bg)',
                'action-secondary-bg': 'var(--action-secondary-bg)',
                'action-secondary-hover': 'var(--action-secondary-hover)',

                // ── Input Elements ──
                'input-bg': 'var(--input-bg)',
                'input-border': 'var(--input-border)',
                'input-placeholder': 'var(--input-placeholder)',

                // ── Sidebar Elements ──
                'sidebar-bg': 'var(--sidebar-bg)',
                'sidebar-item-active': 'var(--sidebar-item-active)',
                'sidebar-item-hover': 'var(--sidebar-item-hover)',
                'sidebar-border': 'var(--sidebar-border)',

                // ── Card Elements ──
                'card-bg': 'var(--card-bg)',
                'card-border': 'var(--card-border)',

                // Legacy Fallbacks (Safe Cleanup Layer)
                secondary: 'var(--secondary)',
                success: 'var(--success)',
                danger: 'var(--danger)',
                warning: 'var(--warning)',
                'bg-main': 'var(--bg-main)',
                'bg-card': 'var(--bg-card)',
                'bg-deep': 'var(--bg-deep)',
                'text-main': 'var(--text-main)',
                'border-light': 'var(--border-light)',
            },
            boxShadow: {
                'premium': 'var(--shadow-premium)',
                'enterprise': 'var(--card-shadow)',
                'pos': 'var(--shadow-pos)',
            },
            borderRadius: {
                'md': '14px',
                'lg': '24px',
                'xl': '32px',
            },
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
