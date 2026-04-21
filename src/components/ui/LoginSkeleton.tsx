const skeletonStyle = {
  borderRadius: '0.25rem',
  background: 'rgba(128,128,128,0.15)',
  animation: 'pulse 1.5s ease-in-out infinite',
}

export default function LoginSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '21.25rem', height: '8.5rem', ...skeletonStyle }} />
      </div>
      <div style={{ height: '1.25rem', ...skeletonStyle }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ height: '3.5rem', ...skeletonStyle }} />
        <div style={{ height: '3.5rem', ...skeletonStyle }} />
        <div style={{ height: '2.5rem', borderRadius: '0.375rem', background: 'rgba(128,128,128,0.2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
