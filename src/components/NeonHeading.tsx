import { motion } from 'framer-motion'

interface Props {
  title: string
  subtitle?: string
  className?: string
}

export default function NeonHeading({ title, subtitle, className }: Props) {
  return (
    <div className={className}>
      <motion.h1
        className="text-3xl font-semibold tracking-tight md:text-4xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="bg-gradient-to-r from-neon-blue via-accent to-neon-blue bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(96,165,250,0.45)]">
          {title}
        </span>
      </motion.h1>
      {subtitle && (
        <motion.p
          className="mt-2 text-sm opacity-80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
