type Props = { label: string; value: string | number; suffix?: string }

export default function StatChip({ label, value, suffix }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-lg bg-primary/8 hc:bg-muted hc:border hc:border-border flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <span className="text-xl font-bold text-primary hc:text-foreground tabular-nums leading-none">{value}</span>
        {suffix && <span className="text-sm text-primary hc:text-foreground leading-none">{suffix}</span>}
      </div>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground text-center leading-tight mt-0.5">{label}</span>
    </div>
  )
}
