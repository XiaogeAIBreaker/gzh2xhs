export interface GenerateRequest {
  text: string
  model: 'deepseek' | 'nanobanana'
  style?: 'simple' | 'standard' | 'rich'
  size?: '1:1' | '4:5' | '9:16'
}

export interface GenerateResponse {
  cards: Array<{
    id: string
    imageUrl: string
    template: 'simple' | 'standard' | 'rich'
    model: 'deepseek' | 'nanobanana'
    size?: '1:1' | '4:5' | '9:16'
  }>
  copytext: string
  success: boolean
  error?: string
  details?: string
}

export interface ExportImageItem {
  id: string
  dataUrl: string
}

export interface ExportRequest {
  images: ExportImageItem[]
  /** 可选：导出命名前缀 */
  namePrefix?: string
}
