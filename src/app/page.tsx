'use client'

import { AppProvider } from '@/context/AppContext'
import dynamic from 'next/dynamic'
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false })
const Canvas = dynamic(() => import('@/components/Canvas'), { ssr: false })
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { trackClient } from '@/shared/lib/analytics'
import { useSessionId } from '@/hooks/useSessionId'

export default function Home() {
    const sid = useSessionId()
    useEffect(() => {
        const props = sid ? { session_id: sid } : {}
        trackClient('page_view', props as any)
    }, [sid])
    return (
        <AppProvider>
            <main className="min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <motion.div
                        className="flex h-[calc(100vh-4rem)] gap-6"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <motion.div
                            className="glass-card w-[30%] overflow-hidden rounded-xl shadow-neon"
                            initial={{ opacity: 0, x: -12, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <Sidebar />
                        </motion.div>
                        <motion.div
                            className="glass-card glow w-[70%] overflow-hidden rounded-xl shadow-neon"
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
