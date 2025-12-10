export interface GenerateRequest {
  text: string
  model: 'deepseek' | 'nanobanana'
  style?: 'simple' | 'standard' | 'rich'
}

export interface GenerateResponse {
  cards: Array<{
    id: string
    imageUrl: string
    template: 'simple' | 'standard' | 'rich'
    model: 'deepseek' | 'nanobanana'
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
}
