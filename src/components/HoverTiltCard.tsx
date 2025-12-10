'use client'

import { useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
}

export default function HoverTiltCard({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = x / rect.width
    const py = y / rect.height
    const rx = (py - 0.5) * -8
    const ry = (px - 0.5) * 8
    setStyle({
      transform: `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`,
      background: `radial-gradient(400px 400px at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.12), transparent 60%)`,
    })
  }

  function onLeave() {
    setStyle({ transform: 'perspective(800px) rotateX(0) rotateY(0)' })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={['tilt-3d', className].filter(Boolean).join(' ')}
    >
      <div className="tilt-inner rounded-xl" style={style}>
        {children}
      </div>
    </div>
  )
}
