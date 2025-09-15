# 小红书卡片生成提示词设计文档

基于项目代码实际实现的**生产级提示词设计**，与 `src/lib/prompts.ts` 完全同步。

## 系统架构概述

### 处理流程
```
文本输入 → AI模型选择 → 第一阶段分析 → 第二阶段渲染 → 图片转换 → 卡片输出
```

### 核心特性
- **两阶段处理**：分析设计 → SVG渲染，确保质量稳定
- **三款式分类**：simple/standard/rich 对应信息密度低/中/高
- **双AI支持**：DeepSeek和NanoBanana使用统一提示词模板
- **完美emoji支持**：通过Playwright浏览器引擎确保emoji正确显示

---

## 第一阶段：内容分析与设计JSON生成

### 系统提示词 (STAGE_A_SYSTEM_PROMPT)

```
你是"小红书封面设计分析器"。
按照用户指定的款式（simple/standard/rich）生成唯一一个设计 JSON；
只输出 JSON，不要任何解释文字。

三款式说明：
- simple（标题为主，信息少）：仅 1–2 行强冲击标题；可选 1–2 个关键词高亮；无需长段正文
- standard（中等信息，清单）：3–5 条要点清单；标题中等偏大，可有 CTA；结构简洁
- rich（信息量大，图解）：6–9 条要点或 2–3 段摘要；可分区/卡片化展示，层级清晰

配色和风格（模型动态给出）：
- 返回 palette：{bg, text, accent, accent2?}；确保对比度≥WCAG AA；
- 根据内容语气和主题自动挑选风格标记 style_tokens（如 halftone、hl_marker、sticker、dashed_card、paper_texture、glow、scallop_header、torn_edge 等）。

输出 JSON Schema：
{
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
}
```

### 用户提示词格式

```
原文：<<<{输入文本}>>>
STYLE_MODE：{simple|standard|rich}
可选主色：{颜色值或留空}
可选强调色：{颜色值或留空}
目标受众：{如"泛用户"、"职场新人"等}
内容意图：{观点表达、知识分享等}
```

---

## 第二阶段：SVG渲染

### 系统提示词 (STAGE_B_SYSTEM_PROMPT)

```
你是"小红书爆款SVG渲染器"。只根据输入的设计 JSON 输出一个 <svg>，
画布固定 width="1080" height="1440" viewBox="0 0 1080 1440"（3:4比例）。禁止输出除 <svg> 外的任何字符。

通用规则：
- 背景填充 palette.bg；文本颜色 palette.text；强调用 palette.accent/或 accent2；
- 字体回退："Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", "Microsoft YaHei", "Arial", sans-serif；
- 每行≤14汉字；使用 <tspan> 自动断行；坐标尽量为整数；
- 重要文本 paint-order: stroke fill; stroke:#000; stroke-width:0.8；
- 仅使用 SVG 原生元素，不使用 <foreignObject>、外链图片或脚本；
- Emoji：直接使用 Unicode 字符；包含 emoji 的文本必须指定包含 emoji 字体的 font-family；
- 覆盖目标：文本+模块覆盖画布 55–75%；不足则放大字号或补齐 bullets。

布局蓝图（layout_blueprint 可选）：
- meme_poster（simple）：标题占比 0.65–0.75，允许标题强调（hl_marker/underline/accent_box）；可加入贴纸/爆炸等装饰。
- hero_checklist_cta / tabs_checklist_cta（standard）：3–5 条 bullets 的卡片/清单；底部 CTA；chips 行可两行。
- info_cards_grid（rich）：2×2 或 1×3 卡片网格；每卡一行标题+一行补充；可配 icon 点缀（几何图形）。

style_tokens 提示：
halftone：点阵 pattern，opacity≈0.15；hl_marker：半透明荧光条；sticker：白描边贴纸；dashed_card：虚线卡片；
paper_texture：轻微纸纹；glow：主体光晕；scallop_header：波浪页眉；torn_edge：撕纸边。
```

### 用户提示词格式

```
样式：{simple|standard|rich}
设计JSON：<<<{第一阶段生成的JSON}>>>
```

---

## 实际代码实现映射

### 核心常量配置 (`src/constants/index.ts`)

```typescript
// 画布尺寸
APP_CONSTANTS.CARD_SIZE = { WIDTH: 1080, HEIGHT: 1440 }

// 字体配置
APP_CONSTANTS.EMOJI_FONTS = [
  "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji",
  "PingFang SC", "Microsoft YaHei", "Arial"
]

// 布局参数
PROMPT_CONSTANTS.LAYOUT = {
  MAX_CHARS_PER_LINE: 14,
  CONTENT_COVERAGE_MIN: 55,
  CONTENT_COVERAGE_MAX: 75,
  TITLE_AREA_RATIO_SIMPLE: 0.65,
  TITLE_AREA_RATIO_SIMPLE_MAX: 0.75
}

// 预定义配色方案
TEMPLATE_COLORS = {
  A: { bg: "#FAFAFA", text: "#1A1A1A", accent: "#FF6B35" },
  B: { bg: "#FFFFFF", text: "#1A1A1A", accent: "#4ECDC4" },
  C: { bg: "#F8F9FA", text: "#2D3748", accent: "#4169E1" },
  // ... A-H 共8套配色
}
```

### TypeScript接口定义 (`src/types/index.ts`)

```typescript
// 核心设计JSON结构（简化版）
export interface DesignJSON {
  template_type: 'simple' | 'standard' | 'rich'
  palette: { bg: string; text: string; accent: string }
  title_lines: string[]
  content?: string
  highlights?: string[]
  layout?: 'center' | 'left' | 'right'
}

// 生成选项
export interface GenerationOptions {
  styleChoice?: 'simple' | 'standard' | 'rich'
  mainColor?: string
  accentColor?: string
  audience?: string
  intent?: string
}
```

### AI服务实现 (`src/services/`)

```typescript
// DeepSeek服务 (两阶段处理)
export class DeepSeekService extends AIService {
  async process(text: string, options?: GenerationOptions): Promise<AIServiceResult> {
    // 第一阶段：分析与设计JSON生成
    const designJson = await this.executeStageA(text, options)

    // 第二阶段：SVG渲染
    const svgContent = await this.executeStageB(designJson, options)

    return { svgContent, designJson }
  }
}

// NanoBanana服务 (复用相同提示词模板)
export class NanoBananaService extends AIService {
  // 使用相同的process()逻辑和提示词模板
}
```

---

## API调用流程

### 请求格式 (POST /api/generate)

```json
{
  "text": "公众号文章内容",
  "model": "deepseek" | "nanobanana",
  "style": "simple" | "standard" | "rich"
}
```

### 响应格式

```json
{
  "success": true,
  "cards": [
    {
      "id": "uuid",
      "imageUrl": "data:image/png;base64,xxx",
      "template": "standard",
      "model": "deepseek"
    }
  ],
  "copytext": "生成的小红书文案"
}
```

### 处理流程

1. **输入验证**：检查文本长度 (≤2000字符)、模型类型
2. **AI服务调用**：
   - Stage A: 文本分析 → 设计JSON
   - Stage B: JSON → SVG代码
3. **图像转换**：
   - SVG → PNG: 使用 Playwright (支持emoji)
   - Base64 → PNG: 使用 Sharp (多策略处理)
4. **错误处理**：统一使用 ERROR_MESSAGES 常量

---

## 图像渲染技术细节

### SVG到PNG转换 (`src/lib/image-converter.ts`)

```typescript
// 使用Playwright解决emoji渲染问题
export async function convertSvgToPng(svgContent: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  // 创建HTML包装，包含emoji字体
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", sans-serif; }
          svg { width: 1080px; height: 1440px; }
        </style>
      </head>
      <body>${svgContent}</body>
    </html>
  `

  // 浏览器截图 → PNG
  const pngBuffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1440 }
  })

  return pngBuffer
}
```

---

## 质量保证标准

### 输出验证清单

- [ ] SVG包含正确的 width="1080" height="1440" viewBox="0 0 1080 1440"
- [ ] 配色方案对比度≥WCAG AA标准
- [ ] 每行文字≤14个汉字，正确使用 `<tspan>` 换行
- [ ] Emoji使用Unicode字符且指定正确字体
- [ ] 文本覆盖率在55-75%范围内
- [ ] 重要文本使用描边效果 (stroke-width:0.8)

### 错误处理规范

```typescript
// 统一错误信息 (ERROR_MESSAGES 常量)
const ERROR_MESSAGES = {
  EMPTY_INPUT: '请输入要转换的内容',
  TEXT_TOO_LONG: '内容长度不能超过2000字',
  API_CALL_FAILED: 'AI API调用失败',
  INVALID_JSON: '返回的JSON格式无效',
  INVALID_SVG: '未返回有效的SVG内容',
  IMAGE_CONVERSION_FAILED: '图片转换失败'
}
```

---

## 开发调试指南

### 本地测试方法

```bash
# 启动开发服务器
npm run dev

# 测试API调用
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "测试文章内容",
    "model": "deepseek",
    "style": "standard"
  }'
```

### 常见问题排查

1. **Emoji显示异常**
   - 确认安装 Playwright: `npx playwright install chromium`
   - 检查字体配置是否包含emoji字体

2. **AI API调用失败**
   - 验证 `.env.local` 中的API密钥配置
   - 检查API服务可用性和配额

3. **SVG渲染错误**
   - 验证JSON格式是否符合DesignJSON接口
   - 检查画布尺寸和字体配置

4. **图片转换失败**
   - 确认服务器内存充足 (建议≥2GB)
   - 检查Playwright浏览器进程是否正常关闭

---

## 版本同步信息

**文档版本**: 2024-09-15 (重构后)
**代码依赖**:
- `src/lib/prompts.ts` - 提示词模板定义
- `src/constants/index.ts` - 配置常量管理
- `src/types/index.ts` - TypeScript类型定义
- `src/services/` - AI服务实现

**更新策略**: 当上述文件变更时，需同步更新本文档

---

*本文档与项目代码实现保持100%同步，可直接用于生产环境部署和AI模型调优。*