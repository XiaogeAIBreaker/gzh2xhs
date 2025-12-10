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
        },
        accent: {
          DEFAULT: '#f0abfc',
        },
      },
      boxShadow: {
        'neon-sm': '0 0 12px rgba(96,165,250,0.45)',
        neon: '0 0 24px rgba(96,165,250,0.35)',
        'neon-lg': '0 0 36px rgba(96,165,250,0.45)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        grid: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        aurora: 'linear-gradient(120deg, transparent 0%, rgba(96,165,250,0.25) 40%, rgba(240,171,252,0.25) 60%, transparent 100%)',
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
      },
      animation: {
        aurora: 'aurora 12s ease-in-out infinite',
        twinkle: 'twinkle 6s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shine: 'shine 2.5s linear infinite',
        gridMove: 'gridMove 16s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
