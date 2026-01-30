/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                success: 'var(--success)',
                danger: 'var(--danger)',
                warning: 'var(--warning)',
                'bg-main': 'var(--bg-main)',
                'bg-card': 'var(--bg-card)',
                'bg-deep': 'var(--bg-deep)',
                'text-main': 'var(--text-main)',
                'text-muted': 'var(--text-muted)',
                'border-light': 'var(--border-light)',
            },
        },
    },
    plugins: [],
}
