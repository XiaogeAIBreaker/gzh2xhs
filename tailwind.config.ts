import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          DEFAULT: '#0b0f19',
          fg: '#e5e7eb',
        },
        neon: {
          DEFAULT: '#60a5fa',
          blue: '#60a5fa',
          pink: '#f0abfc',
          green: '#34d399',
          orange: '#f59e0b',
        },
        accent: {
          DEFAULT: '#f0abfc',
        },
        glass: {
          bg: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.15)',
        },
      },
      boxShadow: {
        'neon-sm': '0 0 12px rgba(96,165,250,0.45)',
        neon: '0 0 24px rgba(96,165,250,0.35)',
        'neon-lg': '0 0 36px rgba(96,165,250,0.45)',
        glow: '0 0 32px rgba(240,171,252,0.35), 0 0 12px rgba(96,165,250,0.45)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.06)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        grid: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        aurora: 'linear-gradient(120deg, transparent 0%, rgba(96,165,250,0.25) 40%, rgba(240,171,252,0.25) 60%, transparent 100%)',
        noise: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\"><filter id=\"n\"><feTurbulence baseFrequency=\"0.7\" numOctaves=\"2\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>')",
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.55' },
        },
        float: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
          '100%': { transform: 'translateY(0)' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gridMove: {
          '0%': { backgroundPosition: '0 0, 0 0' },
          '100%': { backgroundPosition: '80px 0, 0 80px' },
        },
        parallaxX: {
          '0%': { transform: 'translateX(-2%)' },
          '50%': { transform: 'translateX(2%)' },
          '100%': { transform: 'translateX(-2%)' },
        },
        parallaxY: {
          '0%': { transform: 'translateY(-2%)' },
          '50%': { transform: 'translateY(2%)' },
          '100%': { transform: 'translateY(-2%)' },
        },
      },
      animation: {
        aurora: 'aurora 12s ease-in-out infinite',
        twinkle: 'twinkle 6s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shine: 'shine 2.5s linear infinite',
        gridMove: 'gridMove 16s linear infinite',
        parallaxX: 'parallaxX 18s ease-in-out infinite',
        parallaxY: 'parallaxY 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
