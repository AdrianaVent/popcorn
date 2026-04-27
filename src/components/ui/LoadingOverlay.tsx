type Props = {
  message: string
}

export default function LoadingOverlay({ message }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 px-10 py-8 bg-card border border-border rounded-2xl shadow-2xl">
        <div className="w-8 h-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        <span className="text-sm font-medium text-foreground">{message}</span>
      </div>
    </div>
  )
}
