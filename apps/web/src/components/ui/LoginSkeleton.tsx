export default function LoginSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex justify-center">
        <div className="w-85 h-34 rounded bg-border/40 animate-pulse" />
      </div>
      <div className="h-5 rounded bg-border/40 animate-pulse" />
      <div className="flex flex-col gap-4">
        <div className="h-14 rounded bg-border/40 animate-pulse" />
        <div className="h-14 rounded bg-border/40 animate-pulse" />
        <div className="h-10 rounded-md bg-border/60 animate-pulse" />
      </div>
    </div>
  )
}
