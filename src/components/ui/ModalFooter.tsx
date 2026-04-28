import { ReactNode } from 'react'
import clsx from 'clsx'

type ModalFooterProps = {
  children: ReactNode
  className?: string
}

export default function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={clsx(
      'flex items-center justify-end gap-2',
      'px-6 py-4 border-t border-border bg-card',
      className,
    )}>
      {children}
    </div>
  )
}
