/**
 * Component-Level Token Mapping - Ensuring consistency across all modules.
 * This file maps semantic tokens to specific component properties.
 */
export const componentTokens = {
  button: {
    primary: {
      bg: 'var(--action-primary-bg)',
      hover: 'var(--action-primary-hover)',
      text: 'var(--action-primary-text)',
    },
    secondary: {
      bg: 'var(--action-secondary-bg)',
      hover: 'var(--action-secondary-hover)',
      text: 'var(--action-secondary-text)',
    },
    ghost: {
      bg: 'var(--action-ghost-bg)',
      hover: 'var(--action-ghost-hover)',
      text: 'var(--text-secondary)',
    }
  },
  card: {
    base: {
      bg: 'var(--card-bg)',
      border: 'var(--card-border)',
      shadow: 'var(--card-shadow)',
    },
    elevated: {
      bg: 'var(--bg-surface)',
      border: 'var(--border-default)',
      shadow: 'var(--shadow-premium)',
    }
  },
  input: {
    base: {
      bg: 'var(--input-bg)',
      border: 'var(--input-border)',
      focus: 'var(--input-border-focus)',
      placeholder: 'var(--input-placeholder)',
      ring: 'var(--input-ring)',
    }
  },
  table: {
    header: 'var(--bg-surface-secondary)',
    rowHover: 'var(--bg-surface-tertiary)',
    divider: 'var(--border-divider)',
  },
  badge: {
     success: { bg: 'var(--state-success-bg)', text: 'var(--state-success-text)', border: 'var(--state-success-border)' },
     warning: { bg: 'var(--state-warning-bg)', text: 'var(--state-warning-text)', border: 'var(--state-warning-border)' },
     error:   { bg: 'var(--state-error-bg)',   text: 'var(--state-error-text)',   border: 'var(--state-error-border)'   },
     info:    { bg: 'var(--state-info-bg)',    text: 'var(--state-info-text)',    border: 'var(--state-info-border)'    },
  }
};
