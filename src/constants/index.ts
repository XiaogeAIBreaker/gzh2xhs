// 应用常量
export const APP_CONSTANTS = {
  MAX_TEXT_LENGTH: 2000,
  CARD_SIZE: {
    WIDTH: 1080,
    HEIGHT: 1440,
  },
  SVG_SIZE: {
    WIDTH: 1242,
    HEIGHT: 1656,
  },
  EMOJI_FONTS: [
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Noto Color Emoji",
    "PingFang SC",
    "Microsoft YaHei",
    "Arial",
  ],
} as const

// API配置
export const API_CONFIG = {
  DEEPSEEK: {
    API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    MODEL: 'deepseek-chat',
  },
  NANOBANANA: {
    API_URL: process.env.NANOBANANA_API_URL || 'https://kg-api.cloud/v1/chat/completions',
    MODEL: 'gpt-5-chat-latest',
  },
} as const

// 模板颜色配置
export const TEMPLATE_COLORS = {
  A: { bg: "#FAFAFA", text: "#1A1A1A", accent: "#FF6B35" },
  B: { bg: "#FFFFFF", text: "#1A1A1A", accent: "#4ECDC4" },
  C: { bg: "#F8F9FA", text: "#2D3748", accent: "#4169E1" },
  D: { bg: "#F8F9FA", text: "#1A1A1A", accent: "#4ECDC4" },
  E: { bg: "linear-gradient(135deg, #6C7CE7, #A8E6CF)", text: "#1A1A1A", accent: "#FFD700" },
  F: { bg: "#FFF8DC", text: "#2D3748", accent: "#FF6B6B" },
  G: { bg: "#FFFEF7", text: "#1A1A1A", accent: "#FFEB3B" },
  H: { bg: "#FFFFFF", text: "#1A1A1A", accent: "#FF4444" },
} as const