import { PROMPT_CONSTANTS } from '../constants'
import type { GenerationOptions } from '../types'

/**
 * 提示词配置
 */
const PROMPT_CONFIG = {
    /** 款式说明 */
    STYLE_DESCRIPTIONS: {
        simple: '仅 1–2 行强冲击标题；可选 1–2 个关键词高亮；无需长段正文',
        standard: '3–5 条要点清单；标题中等偏大，可有 CTA；结构简洁',
        rich: '6–9 条要点或 2–3 段摘要；可分区/卡片化展示，层级清晰',
    },

    /** JSON Schema 模板 */
    JSON_SCHEMA: `{
  "template_type": "simple" | "standard" | "rich",
  "palette": { "bg": string, "text": string, "accent": string, "accent2"?: string },
  "title_lines": string[],
  "highlights"?: string[],
  "content"?: string,
  "layout"?: "center" | "left" | "right",
  "style_tokens"?: string[],
  "layout_blueprint"?: "hero_checklist_cta" | "tabs_checklist_cta" | "two_col_subject_cta" | "meme_poster" | "notebook_paper" | "info_cards_grid",
  "topic_tags"?: string[],
  "pillars"?: string[],
  "typography"?: { "mode": "title_dominant" | "balanced" | "dense", "title_area_ratio": number, "title_font_px"?: number, "max_title_lines"?: number },
  "info_density"?: "low" | "medium" | "high",
  "bullet_target"?: number,
  "image_slots"?: number,
  "title_emphasis"?: Array<{ "text": string, "style": "hl_marker" | "accent_box" | "underline", "color"?: string }>,
  "modules"?: {
    "badges"?: Array<{ "text": string, "style": "explosion" | "pill" | "ribbon", "pos"?: "tl" | "tr" | "bl" | "br" }>,
    "bullets"?: Array<{ "icon": "check" | "arrow" | "number", "text": string }>,
    "cta"?: { "text": string, "style": "tape" | "sticker" }
  },
  "background"?: { "texture": "paper" | "grid" | "none", "intensity": number },
  "subject"?: { "image"?: string, "cutout"?: boolean, "outline"?: boolean },
  "decoration_intensity"?: number,
  "content_density"?: number
}`,

    /** SVG 渲染规则 */
    SVG_RULES: {
        CANVAS: `width="${PROMPT_CONSTANTS.CANVAS.WIDTH}" height="${PROMPT_CONSTANTS.CANVAS.HEIGHT}" viewBox="${PROMPT_CONSTANTS.CANVAS.VIEWBOX}"`,
        FONT_FAMILY: PROMPT_CONSTANTS.FONT_FAMILY,
        MAX_CHARS_PER_LINE: PROMPT_CONSTANTS.LAYOUT.MAX_CHARS_PER_LINE,
        CONTENT_COVERAGE: `${PROMPT_CONSTANTS.LAYOUT.CONTENT_COVERAGE_MIN}–${PROMPT_CONSTANTS.LAYOUT.CONTENT_COVERAGE_MAX}%`,
    },
} as const

// =============================================================================
// 核心提示词模板
// =============================================================================

/**
 * 第一阶段系统提示词：内容分析和设计JSON生成
 */
export const STAGE_A_SYSTEM_PROMPT = `你是"小红书封面设计分析器"。
按照用户指定的款式（simple/standard/rich）生成唯一一个设计 JSON；
只输出 JSON，不要任何解释文字。

三款式说明：
- simple（标题为主，信息少）：${PROMPT_CONFIG.STYLE_DESCRIPTIONS.simple}
- standard（中等信息，清单）：${PROMPT_CONFIG.STYLE_DESCRIPTIONS.standard}
- rich（信息量大，图解）：${PROMPT_CONFIG.STYLE_DESCRIPTIONS.rich}

配色和风格（模型动态给出）：
- 返回 palette：{bg, text, accent, accent2?}；确保对比度≥WCAG AA；
- 根据内容语气和主题自动挑选风格标记 style_tokens（如 ${PROMPT_CONSTANTS.STYLE_TOKENS.join('、')} 等）。

输出 JSON Schema：
${PROMPT_CONFIG.JSON_SCHEMA}`

/**
 * 第二阶段系统提示词：SVG渲染
 */
export const STAGE_B_SYSTEM_PROMPT = `你是"小红书爆款SVG渲染器"。只根据输入的设计 JSON 输出一个 <svg>，
画布固定 ${PROMPT_CONFIG.SVG_RULES.CANVAS}（${PROMPT_CONSTANTS.CANVAS.ASPECT_RATIO}比例）。禁止输出除 <svg> 外的任何字符。

通用规则：
- 背景填充 palette.bg；文本颜色 palette.text；强调用 palette.accent/或 accent2；
- 字体回退：${PROMPT_CONFIG.SVG_RULES.FONT_FAMILY}；
- 每行≤${PROMPT_CONFIG.SVG_RULES.MAX_CHARS_PER_LINE}汉字；使用 <tspan> 自动断行；坐标尽量为整数；
- 重要文本 paint-order: stroke fill; stroke:#000; stroke-width:0.8；
- 仅使用 SVG 原生元素，不使用 <foreignObject>、外链图片或脚本；
- Emoji：直接使用 Unicode 字符；包含 emoji 的文本必须指定包含 emoji 字体的 font-family；
- 覆盖目标：文本+模块覆盖画布 ${PROMPT_CONFIG.SVG_RULES.CONTENT_COVERAGE}；不足则放大字号或补齐 bullets。

布局蓝图（layout_blueprint 可选）：
- meme_poster（simple）：标题占比 ${PROMPT_CONSTANTS.LAYOUT.TITLE_AREA_RATIO_SIMPLE}–${PROMPT_CONSTANTS.LAYOUT.TITLE_AREA_RATIO_SIMPLE_MAX}，允许标题强调（hl_marker/underline/accent_box）；可加入贴纸/爆炸等装饰。
- hero_checklist_cta / tabs_checklist_cta（standard）：3–5 条 bullets 的卡片/清单；底部 CTA；chips 行可两行。
- info_cards_grid（rich）：2×2 或 1×3 卡片网格；每卡一行标题+一行补充；可配 icon 点缀（几何图形）。

style_tokens 提示：
halftone：点阵 pattern，opacity≈0.15；hl_marker：半透明荧光条；sticker：白描边贴纸；dashed_card：虚线卡片；
paper_texture：轻微纸纹；glow：主体光晕；scallop_header：波浪页眉；torn_edge：撕纸边。
`

// =============================================================================
// 提示词生成函数
// =============================================================================

/**
 * 创建第一阶段用户提示词
 * @param text 原始文本内容
 * @param options 生成选项
 * @returns 格式化的用户提示词
 */
export function createStageAUserPrompt(text: string, options: GenerationOptions = {}): string {
    const {
        styleChoice = 'standard',
        mainColor = '',
        accentColor = '',
        audience = '泛用户',
        intent = '',
    } = options

    return `原文：<<<${text}>>>
STYLE_MODE：${styleChoice}
可选主色：${mainColor}
可选强调色：${accentColor}
目标受众：${audience}
内容意图：${intent}`
}

/**
 * 创建第二阶段用户提示词
 * @param designJson 设计JSON字符串
 * @param styleChoice 可选的样式选择
 * @returns 格式化的用户提示词
 */
export function createStageBUserPrompt(
    designJson: string,
    styleChoice: 'simple' | 'standard' | 'rich' = 'standard',
): string {
    return `样式：${styleChoice}\n设计JSON：<<<${designJson}>>>`
}

// =============================================================================
// AI服务统一接口 - 所有AI服务使用相同的提示词模板
// =============================================================================

/**
 * DeepSeek AI服务提示词
 */
export const DEEPSEEK_STAGE_A_SYSTEM = STAGE_A_SYSTEM_PROMPT
export const DEEPSEEK_STAGE_B_SYSTEM = STAGE_B_SYSTEM_PROMPT

/**
 * NanoBanana AI服务提示词 - 复用通用模板
 */
export const NANOBANANA_STAGE_A_SYSTEM = STAGE_A_SYSTEM_PROMPT
export const NANOBANANA_STAGE_B_SYSTEM = STAGE_B_SYSTEM_PROMPT

/**
 * NanoBanana专用提示词创建函数（为保持向后兼容性）
 */
export function createNanoBananaStageAUserPrompt(
    text: string,
    options?: GenerationOptions,
): string {
    return createStageAUserPrompt(text, options)
}

export function createNanoBananaStageBUserPrompt(
    designJson: string,
    styleChoice?: 'simple' | 'standard' | 'rich',
): string {
    return createStageBUserPrompt(designJson, styleChoice)
}

// =============================================================================
// 其他提示词模板
// =============================================================================

/**
 * 遗留的一次性提示词（保留作为参考）
 */
export const NANOBANANA_LEGACY_PROMPT = `你是"小红书卡片SVG生成器"。根据内容和款式（simple/standard/rich）直接输出 <svg>。
画布: ${PROMPT_CONSTANTS.CANVAS.WIDTH}×${PROMPT_CONSTANTS.CANVAS.HEIGHT}；仅输出 SVG 代码，无任何解释。`

/**
 * 小红书文案生成提示词配置
 */
const COPYTEXT_CONFIG = {
    MIN_LENGTH: 150,
    MAX_LENGTH: 300,
    REQUIREMENTS: [
        '开头要有吸引人的钩子，引起用户好奇心',
        '使用小红书流行的表达方式和emoji',
        '内容要简洁有力，突出核心价值',
        '结尾要有互动性，引导用户点赞、收藏、评论',
        '整体长度控制在150-300字',
        '适当使用话题标签 #话题#',
        '体现小红书用户喜欢的真实、有用、有趣的特点',
    ],
} as const

/**
 * 小红书文案生成提示词
 */
export const XIAOHONGSHU_COPYTEXT_PROMPT = `请根据以下公众号内容，生成一段小红书爆款文案。

要求：
${COPYTEXT_CONFIG.REQUIREMENTS.map((req, index) => `${index + 1}. ${req}`).join('\n')}

原内容：{{CONTENT}}`
