import type { ReactNode, ElementType } from 'react'
import type { TextVariant } from '@/styles/typography'
import clsx from 'clsx'

const variantClasses: Record<TextVariant, string> = {
  title:    'text-title font-bold',
  subtitle: 'text-subtitle font-semibold',
  body:     'text-body font-normal',
  small:    'text-small font-normal',
  caption:  'text-caption font-normal',
}

type TextProps = {
  children: ReactNode
  variant?: TextVariant
  as?: ElementType
  className?: string
  align?: 'left' | 'center' | 'right'
  truncate?: boolean
}

export default function Text({
  children,
  variant = 'body',
  as: Component = 'p',
  className,
  align,
  truncate,
}: TextProps) {
  return (
    <Component
      className={clsx(
        'font-sans',
        variantClasses[variant],
        align && `text-${align}`,
        truncate && 'truncate',
        className,
      )}
    >
      {children}
    </Component>
  )
}
