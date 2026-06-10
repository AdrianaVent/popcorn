'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { CardId } from '@/store/homeStore'

type Props = {
  id: CardId
  isDragMode: boolean
  children: React.ReactNode
}

export default function DraggableCard({ id, isDragMode, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isDragMode,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="relative overflow-hidden"
    >
      {children}
      {isDragMode && (
        <>
          <div className="absolute inset-0 rounded-xl bg-background/20 z-10 pointer-events-none" />
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="absolute inset-0 z-20 flex items-center justify-center rounded-xl cursor-grab active:cursor-grabbing touch-none outline-none"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary border border-primary shadow-md hc:bg-red-600 hc:border-red-600 hc:shadow-none pointer-events-none">
              <GripVertical size={20} strokeWidth={1.5} className="text-primary-foreground hc:text-white" aria-hidden="true" />
            </span>
          </button>
        </>
      )}
    </div>
  )
}
