import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CosmicBackground from '@/components/CosmicBackground'
import ClientLayout from './ClientLayout'
import Navbar from '@/components/Navbar'
import Toast from '@/components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: '公众号转小红书卡片生成器',
    description: 'AI驱动的跨平台内容创作助手，一键生成小红书爆款视觉卡片',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="zh-CN" className="dark">
            <body
                className={`${inter.className} relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100`}
            >
                <CosmicBackground />
                <Navbar />
                <ClientLayout>{children}</ClientLayout>
                <Toast />
            </body>
        </html>
    )
}
