import { brandTokens } from './tokens';

/**
 * Semantic Tokens - Mapping brand colors to application-wide usage.
 * Includes definitions for light and dark modes.
 */
export const semanticTokens = {
  light: {
    // ═══════════════════════════════════════════
    // Backgrounds
    // ═══════════════════════════════════════════
    bg: {
      app: brandTokens.layer[0],
      surface: brandTokens.layer[1],
      surfaceSecondary: brandTokens.layer[2],
      surfaceTertiary: brandTokens.layer[3],
      elevated: brandTokens.layer[1], // For cards floating above app
    },
    // ═══════════════════════════════════════════
    // Text
    // ═══════════════════════════════════════════
    text: {
      primary: brandTokens.neutral[900],   // 111827
      secondary: brandTokens.neutral[600], // 4B5563
      tertiary: brandTokens.neutral[500],  // 6B7280
      muted: brandTokens.neutral[400],     // 9BA3AF
      disabled: brandTokens.neutral[300],
      inverse: '#FFFFFF',
    },
    // ═══════════════════════════════════════════
    // Border
    // ═══════════════════════════════════════════
    border: {
      default: brandTokens.neutral[200], // E1E5EA
      muted: brandTokens.neutral[100],   // F1F3F5
      strong: brandTokens.neutral[300],  // D0D5DD
      focus: brandTokens.primary[600],   // 2563EB
      divider: '#E5E9F0',
    },
    // ═══════════════════════════════════════════
    // States (Semantic Status)
    // ═══════════════════════════════════════════
    state: {
      success: {
        bg: brandTokens.success.bg,
        text: brandTokens.success.text,
        border: brandTokens.success.border,
      },
      warning: {
        bg: brandTokens.warning.bg,
        text: brandTokens.warning.text,
        border: brandTokens.warning.border,
      },
      error: {
        bg: brandTokens.error.bg,
        text: brandTokens.error.text,
        border: brandTokens.error.border,
      },
      info: {
        bg: brandTokens.info.bg,
        text: brandTokens.info.text,
        border: brandTokens.info.border,
      },
      alert: {
        bg: '#FEF2F2', // Specific for total/highlight red BG
        text: brandTokens.error.primary,
      }
    },
    // ═══════════════════════════════════════════
    // Common Components
    // ═══════════════════════════════════════════
    action: {
      primary: {
        bg: brandTokens.primary[600],
        hover: brandTokens.primary[700],
        text: '#FFFFFF',
      },
      secondary: {
        bg: '#E9EDF2',
        hover: '#DCE2EA',
        text: brandTokens.neutral[700],
      },
      ghost: {
        bg: 'transparent',
        hover: brandTokens.layer[3],
        text: brandTokens.neutral[600],
      }
    },
    input: {
      bg: '#FFFFFF',
      border: brandTokens.neutral[300],
      borderFocus: brandTokens.primary[600],
      placeholder: brandTokens.neutral[400],
      ring: 'rgba(37,99,235,0.15)',
    },
    sidebar: {
       bg: '#F4F6F8', // Slightly bluish grey
       itemActive: '#E8F0FF',
       itemHover: '#EEF2F7',
       border: brandTokens.neutral[200],
    },
    card: {
      bg: brandTokens.layer[1],
      border: brandTokens.neutral[300],
      shadow: '0 1px 2px rgba(16, 24, 40, 0.06)',
    }
  },

  dark: {
    // ═══════════════════════════════════════════
    // Backgrounds (Enterprise Navy Standards)
    // ═══════════════════════════════════════════
    bg: {
      app: '#020817', // Optimized Deep Navy
      surface: '#0F172A',
      surfaceSecondary: '#1E293B',
      surfaceTertiary: '#334155',
      elevated: '#1E293B',
    },
    // ═══════════════════════════════════════════
    // Text
    // ═══════════════════════════════════════════
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      tertiary: '#64748B',
      muted: '#475569',
      disabled: '#334155',
      inverse: '#0F172A',
    },
    // ═══════════════════════════════════════════
    // Border
    // ═══════════════════════════════════════════
    border: {
      default: 'rgba(255, 255, 255, 0.06)',
      muted: 'rgba(255, 255, 255, 0.04)',
      strong: 'rgba(255, 255, 255, 0.12)',
      focus: '#3B82F6',
      divider: 'rgba(255, 255, 255, 0.08)',
    },
    // ═══════════════════════════════════════════
    // States (Semantic Status - Dark Adjusted)
    // ═══════════════════════════════════════════
    state: {
      success: {
        bg: 'rgba(16, 185, 129, 0.1)',
        text: '#10B981',
        border: 'rgba(16, 185, 129, 0.2)',
      },
      warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        text: '#F59E0B',
        border: 'rgba(245, 158, 11, 0.2)',
      },
      error: {
        bg: 'rgba(239, 68, 68, 0.1)',
        text: '#EF4444',
        border: 'rgba(239, 68, 68, 0.2)',
      },
      info: {
        bg: 'rgba(14, 165, 233, 0.1)',
        text: '#0EA5E9',
        border: 'rgba(14, 165, 233, 0.2)',
      },
      alert: {
        bg: 'rgba(220, 38, 38, 0.2)',
        text: '#DC2626',
      }
    },
    // ═══════════════════════════════════════════
    // Common Components - Dark Mode Adjustments
    // ═══════════════════════════════════════════
    action: {
      primary: {
        bg: '#2563EB',
        hover: '#1D4ED8',
        text: '#FFFFFF',
      },
      secondary: {
        bg: '#1E293B',
        hover: '#334155',
        text: '#E2E8F0',
      },
      ghost: {
        bg: 'transparent',
        hover: 'rgba(255, 255, 255, 0.05)',
        text: '#94A3B8',
      }
    },
    input: {
      bg: '#0F172A',
      border: 'rgba(255, 255, 255, 0.1)',
      borderFocus: '#2563EB',
      placeholder: '#475569',
      ring: 'rgba(37,99,235,0.25)',
    },
    sidebar: {
       bg: '#0F172A',
       itemActive: 'rgba(37, 99, 235, 0.15)',
       itemHover: 'rgba(255, 255, 255, 0.05)',
       border: 'rgba(255, 255, 255, 0.1)',
    },
    card: {
      bg: '#0F172A',
      border: 'rgba(255, 255, 255, 0.06)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    }
  }
};
