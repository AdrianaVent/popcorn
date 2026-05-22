import { XIcon } from '@/components/icons'

type Props = {
  trailerKey: string
  className?: string
  onClose?: () => void
}

export default function TrailerPlayer({ trailerKey, className, onClose }: Props) {
  return (
    <div className={`relative ${className ?? 'aspect-video border border-border rounded-lg overflow-hidden'}`}>
      <iframe
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full"
        title="Trailer"
      />
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
        >
          <XIcon size={12} />
        </button>
      )}
    </div>
  )
}
