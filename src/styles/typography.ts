export const textStyles = {
  title: {
    size: '2rem',      // 32px
    weight: 700,
    lineHeight: '2.5rem',
  },
  subtitle: {
    size: '1.5rem',    // 24px
    weight: 600,
    lineHeight: '2rem',
  },
  body: {
    size: '1rem',      // 16px
    weight: 400,
    lineHeight: '1.5rem',
  },
  small: {
    size: '0.875rem',  // 14px
    weight: 400,
    lineHeight: '1.25rem',
  },
  caption: {
    size: '0.75rem',   // 12px
    weight: 400,
    lineHeight: '1rem',
  },
} as const

export type TextVariant = keyof typeof textStyles
