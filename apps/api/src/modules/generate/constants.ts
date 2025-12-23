export const APP_CONSTANTS = {
    // 内容限制
    MAX_TEXT_LENGTH: 2000,
    MIN_SVG_CONTENT_LENGTH: 100,

    // 卡片尺寸
    CARD_SIZE: {
        WIDTH: 1080,
        HEIGHT: 1440,
    },
    SVG_SIZE: {
        WIDTH: 1080,
        HEIGHT: 1440,
    },

    // 字体配置
    EMOJI_FONTS: [
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Noto Color Emoji',
        'PingFang SC',
        'Microsoft YaHei',
        'Arial',
    ],

    // 处理超时配置
    TIMEOUTS: {
        PLAYWRIGHT_RENDER: 1000,
        API_REQUEST: 30000,
    },

    // 浏览器配置
    BROWSER_CONFIG: {
        HEADLESS: true,
        ARGS: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
} as const

// 错误消息常量
export const ERROR_MESSAGES = {
    // 输入验证错误
    EMPTY_INPUT: '请输入要转换的内容',
    TEXT_TOO_LONG: '内容长度不能超过2000字',

    // API调用错误
    API_CALL_FAILED: 'API调用失败',
    API_EMPTY_RESPONSE: 'API返回空内容',
    NETWORK_ERROR: '网络错误，请检查连接',

    // 数据处理错误
    INVALID_JSON: '返回的JSON格式无效',
    INVALID_SVG: '未返回有效的SVG内容',
    SVG_TOO_SMALL: '返回的SVG内容太小或无效',

    // 图片处理错误
    IMAGE_CONVERSION_FAILED: '图片转换失败',
    BASE64_INVALID: 'Base64数据无效',

    // 通用错误
    UNKNOWN_ERROR: '未知错误',
    SERVER_ERROR: '服务器内部错误，请重试',
    GENERATION_FAILED: '生成失败',
    COPYTEXT_GENERATION_FAILED: '文案生成失败，请重试',
} as const

// 提示词常量
export const PROMPT_CONSTANTS = {
    // 画布配置 - 使用APP_CONSTANTS中的尺寸定义
    CANVAS: {
        get WIDTH() {
            return APP_CONSTANTS.CARD_SIZE.WIDTH
        },
        get HEIGHT() {
            return APP_CONSTANTS.CARD_SIZE.HEIGHT
        },
        ASPECT_RATIO: '3:4',
        get VIEWBOX() {
            return `0 0 ${APP_CONSTANTS.CARD_SIZE.WIDTH} ${APP_CONSTANTS.CARD_SIZE.HEIGHT}`
        },
    },

    // 字体配置 - 使用APP_CONSTANTS中的字体定义
    get FONT_FAMILY() {
        return `"${APP_CONSTANTS.EMOJI_FONTS.join('", "')}", sans-serif`
    },

    // 布局配置
    LAYOUT: {
        MAX_CHARS_PER_LINE: 14,
        CONTENT_COVERAGE_MIN: 55,
        CONTENT_COVERAGE_MAX: 75,
        TITLE_AREA_RATIO_SIMPLE: 0.65,
        TITLE_AREA_RATIO_SIMPLE_MAX: 0.75,
    },

    // 样式标记
    STYLE_TOKENS: [
        'halftone',
        'hl_marker',
        'sticker',
        'dashed_card',
        'paper_texture',
        'glow',
        'scallop_header',
        'torn_edge',
    ],
} as const
