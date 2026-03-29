import { semanticTokens } from './semantic';
import { brandTokens } from './tokens';

/**
 * Design Token System - Main Export
 * Provides programmatic access to tokens and theme-specific values.
 */
export const theme = {
  tokens: brandTokens,
  semantic: semanticTokens,
  
  // Utility to get semantic tokens for a specific mode
  getSemantic: (mode: 'light' | 'dark' = 'light') => semanticTokens[mode],
  
  // Design system constants
  typography: {
    fontSans: ['Outfit', 'Inter', 'sans-serif'].join(', '),
  },
  radius: {
    sm: '8px',
    md: '14px',
    lg: '24px',
    xl: '32px',
    full: '9999px',
  },
  shadow: {
    premium: '0 20px 50px -12px rgba(0, 0, 0, 0.08)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  }
};

export default theme;
