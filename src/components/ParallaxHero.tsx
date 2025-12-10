'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface Props {
  children: React.ReactNode
}

export default function ParallaxHero({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const fgY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.8, 0.3])

  return (
    <div ref={ref} className="glass-card relative overflow-hidden rounded-2xl shadow-neon">
      <div className="absolute inset-0">
        <motion.div style={{ y: bgY }} className="absolute inset-0" />
        <motion.div style={{ y: fgY }} className="absolute inset-0" />
        <div className="absolute inset-0" />
      </div>

      <div className="relative px-6 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </div>

      <motion.div
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute -inset-6"
      >
        <div
          className="rounded-2xl blur-2xl"
          style={{
            background:
              'radial-gradient(140px 140px at 20% 30%, rgba(96,165,250,0.35), transparent 60%), radial-gradient(200px 200px at 80% 60%, rgba(240,171,252,0.35), transparent 60%)',
          }}
        />
      </motion.div>
    </div>
  )
}
