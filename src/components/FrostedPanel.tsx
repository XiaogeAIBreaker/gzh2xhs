interface Props {
  children: React.ReactNode
  className?: string
}

export default function FrostedPanel({ children, className }: Props) {
  return (
    <div className={['glass-card rounded-xl shadow-neon', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
