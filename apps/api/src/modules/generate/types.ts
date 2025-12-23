// AI模型类型
export type AIModel = 'deepseek' | 'nanobanana'

// 卡片模板类型（三款式：信息密度导向）
export type CardTemplate = 'simple' | 'standard' | 'rich'

// 色彩方案
export interface ColorPalette {
    bg: string
    text: string
    accent: string
}

// JSON设计稿结构 (A-H型分类) - 清理后的核心字段
export interface DesignJSON {
    template_type: CardTemplate
    palette: ColorPalette
    title_lines: string[]
    content?: string
    highlights?: string[]
    layout?: 'center' | 'left' | 'right'
    style_tokens?: string[]
    layout_blueprint?: string
    topic_tags?: string[]
    pillars?: string[]
    typography?: any
    info_density?: string
    bullet_target?: number
    image_slots?: number
    title_emphasis?: any[]
    modules?: any
    background?: any
    subject?: any
    decoration_intensity?: number
    content_density?: number
}

// AI服务处理结果接口
export interface AIServiceResult {
    /** 生成的SVG内容 */
    svgContent: string
    /** 设计配置JSON */
    designJson: DesignJSON
}

// AI服务配置接口
export interface AIServiceConfig {
    /** API密钥 */
    apiKey: string
    /** API服务地址 */
    apiUrl: string
    /** 模型名称 */
    model: string
}

// 生成选项接口
export interface GenerationOptions {
    /** 用户选择的款式：simple(信息少)/standard(中)/rich(多) */
    styleChoice?: 'simple' | 'standard' | 'rich'
    /** 主要颜色 */
    mainColor?: string
    /** 强调颜色 */
    accentColor?: string
    /** 目标受众 */
    audience?: string
    /** 内容意图 */
    intent?: string
}

// API消息接口
export interface AIMessage {
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{ type: string; text: string }>
}

// API请求配置
export interface APIRequestConfig {
    model: string
    messages: AIMessage[]
    temperature: number
    max_tokens: number
}

// 生成的卡片数据
export interface GeneratedCard {
    id: string
    imageUrl: string
    template: CardTemplate
    model: AIModel
    size?: '1:1' | '4:5' | '9:16'
}
