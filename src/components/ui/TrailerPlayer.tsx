import { useTranslation } from 'react-i18next'
import { XIcon } from '@/components/icons'

type Props = {
  trailerKey: string
  className?: string
  onClose?: () => void
}

export default function TrailerPlayer({ trailerKey, className, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <div className={`relative ${className ?? 'aspect-video border border-border rounded-lg overflow-hidden'}`}>
      <iframe
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full"
        title={t('common.trailer')}
      />
      {onClose && (
        <button
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 hc:bg-black text-white hover:bg-black/80 hc:hover:bg-black transition-colors cursor-pointer"
        >
          <span aria-hidden="true"><XIcon size={12} /></span>
        </button>
      )}
    </div>
  )
}
