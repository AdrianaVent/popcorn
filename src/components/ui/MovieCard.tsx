'use client'

type MovieCardProps = {
  title: string
  year: number
  type: 'movie' | 'series'
  gradient: string
}

export default function MovieCard({ title, year, type, gradient }: MovieCardProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg">
      <div className="aspect-2/3 flex items-end p-3" style={{ background: gradient }}>
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-white/85 bg-black/35 px-2 py-0.5 rounded">
          {type === 'movie' ? '🎬' : '📺'} {year}
        </span>
      </div>
      <div className="p-3">
        <p className="text-small font-semibold text-foreground truncate">{title}</p>
      </div>
    </div>
  )
}
