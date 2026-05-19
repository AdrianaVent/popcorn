import clsx from 'clsx'
import Header from '@/components/ui/Header'

type Props = {
  children: React.ReactNode
  title: string
  start?: React.ReactNode
  end?: React.ReactNode
  headerClassName?: string
  className?: string
}

export default function PageLayout({ children, title, start, end, headerClassName, className }: Props) {
  return (
    <div className={clsx('h-full flex flex-col px-4 pt-4 pb-6', className)}>
      <Header title={title} start={start} end={end} className={headerClassName} />
      <div className="mt-3 flex-1 min-h-0 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}
