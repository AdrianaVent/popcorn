import type { ReactNode, ElementType } from 'react'
import { textStyles, type TextVariant } from '@/styles/typography'
import clsx from 'clsx'

type TextProps = {
  children: ReactNode
  variant?: TextVariant
  as?: ElementType
  className?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  truncate?: boolean
}

export default function Text({
  children,
  variant = 'body',
  as: Component = 'p',
  className,
  color,
  align,
  truncate
}: TextProps) {
  const style = textStyles[variant]

  return (
    <Component
      className={clsx('font-sans', className)}
      style={{
        fontSize: style.size,
        fontWeight: style.weight,
        lineHeight: style.lineHeight,
        color,
        textAlign: align,
        whiteSpace: truncate ? 'nowrap' : undefined,
        overflow: truncate ? 'hidden' : undefined,
        textOverflow: truncate ? 'ellipsis' : undefined,
      }}
    >
      {children}
    </Component>
  )
}
