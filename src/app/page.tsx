'use client'

import { AppProvider } from '@/context/AppContext'
import { Sidebar } from '@/components/Sidebar'
import { Canvas } from '@/components/Canvas'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <AppProvider>
      <main className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            className="flex gap-6 h-[calc(100vh-4rem)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.div
              className="w-[30%] glass-card rounded-xl shadow-neon overflow-hidden"
              initial={{ opacity: 0, x: -12, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Sidebar />
            </motion.div>
            <motion.div
              className="w-[70%] glass-card rounded-xl shadow-neon overflow-hidden glow"
              initial={{ opacity: 0, x: 12, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            >
              <Canvas />
            </motion.div>
          </motion.div>
        </div>
      </main>
    </AppProvider>
  )
}
