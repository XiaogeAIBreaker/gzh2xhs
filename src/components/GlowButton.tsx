type Variant = 'primary' | 'success' | 'danger' | 'neutral'

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

export function GlowButton({ variant = 'primary', loading, disabled, className, children, ...rest }: GlowButtonProps) {
  const base = 'relative w-full py-3 px-4 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-neon disabled:cursor-not-allowed overflow-hidden'
  const palette: Record<Variant, string> = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700',
    success: 'text-white bg-green-600 hover:bg-green-700',
    danger: 'text-white bg-red-600 hover:bg-red-700',
    neutral: 'text-space-fg bg-white/10 hover:bg-white/15',
  }
  const state = disabled ? 'opacity-60' : 'btn-glow shadow-neon'
  return (
    <button className={[base, palette[variant], state, className].filter(Boolean).join(' ')} disabled={disabled} {...rest}>
      <span className="relative z-10">
        {loading ? '处理中…' : children}
      </span>
    </button>
  )
}
