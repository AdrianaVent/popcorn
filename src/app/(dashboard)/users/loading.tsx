import PageSkeleton from '@/components/ui/PageSkeleton'

export default function Loading() {
  return (
    <PageSkeleton
      titleWidth="w-16"
      hasImage={false}
      cols={5}
      headerButtons={[
        { width: 'w-24' },
        { width: 'w-20' },
        { width: 'w-8' },
      ]}
    />
  )
}
