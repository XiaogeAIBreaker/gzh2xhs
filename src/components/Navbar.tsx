'use client'

import ThemeToggle from './ThemeToggle'
import Link from 'next/link'
import CommandPalette from './CommandPalette'
import { Rocket } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Navbar() {
    return (
        <motion.nav
            className="container mx-auto px-6 pt-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="flex items-center gap-4">
                <div className="rounded-lg px-4 py-2 glass-card shadow-neon flex items-center gap-2">
                    <Rocket size={16} className="text-neon" />
                    <span className="text-sm">公众号转小红书卡片生成器</span>
                </div>
                <Link
                    href="/finance"
                    className="text-xs text-white/70 hover:text-white/90 underline-offset-4 hover:underline"
                >
                    金融分析
                </Link>
            </div>
            <div className="flex items-center gap-4">
                <CommandPalette />
                <ThemeToggle />
            </div>
        </motion.nav>
    )
}
