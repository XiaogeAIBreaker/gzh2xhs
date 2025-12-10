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
}

// 生成的卡片数据
export interface GeneratedCard {
  id: string
  imageUrl: string
  template: CardTemplate
  model: AIModel
  size?: '1:1' | '4:5' | '9:16'
}

// 应用状态
export interface AppState {
  inputText: string
  selectedModel: AIModel
  /** 三款式：信息量少/中等/大 */
  selectedStyle?: 'simple' | 'standard' | 'rich'
  isGenerating: boolean
  generatedCards: GeneratedCard[]
  generatedCopytext: string
  error: string | null
}
