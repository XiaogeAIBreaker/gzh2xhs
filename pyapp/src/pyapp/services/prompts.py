# Constants
CANVAS_WIDTH = 1080
CANVAS_HEIGHT = 1440
CANVAS_ASPECT_RATIO = "3:4"
CANVAS_VIEWBOX = f"0 0 {CANVAS_WIDTH} {CANVAS_HEIGHT}"

FONT_FAMILY = "Noto Sans SC, system-ui, sans-serif"
MAX_CHARS_PER_LINE = 18

CONTENT_COVERAGE_MIN = 35
CONTENT_COVERAGE_MAX = 65

STYLE_TOKENS = [
    "halftone", "hl_marker", "sticker", "dashed_card", 
    "paper_texture", "glow", "scallop_header", "torn_edge"
]

STYLE_DESCRIPTIONS = {
    "simple": "仅 1–2 行强冲击标题；可选 1–2 个关键词高亮；无需长段正文",
    "standard": "3–5 条要点清单；标题中等偏大，可有 CTA；结构简洁",
    "rich": "6–9 条要点或 2–3 段摘要；可分区/卡片化展示，层级清晰",
}

JSON_SCHEMA = """{
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
}"""

SVG_RULES = {
    "CANVAS": f'width="{CANVAS_WIDTH}" height="{CANVAS_HEIGHT}" viewBox="{CANVAS_VIEWBOX}"',
    "FONT_FAMILY": FONT_FAMILY,
    "MAX_CHARS_PER_LINE": MAX_CHARS_PER_LINE,
    "CONTENT_COVERAGE": f"{CONTENT_COVERAGE_MIN}–{CONTENT_COVERAGE_MAX}%",
}

# System Prompts

STAGE_A_SYSTEM_PROMPT = f"""你是"小红书封面设计分析器"。
按照用户指定的款式（simple/standard/rich）生成唯一一个设计 JSON；
只输出 JSON，不要任何解释文字。

三款式说明：
- simple（标题为主，信息少）：{STYLE_DESCRIPTIONS['simple']}
- standard（中等信息，清单）：{STYLE_DESCRIPTIONS['standard']}
- rich（信息量大，图解）：{STYLE_DESCRIPTIONS['rich']}

配色和风格（模型动态给出）：
- 返回 palette：{{bg, text, accent, accent2?}}；确保对比度≥WCAG AA；
- 根据内容语气和主题自动挑选风格标记 style_tokens（如 { "、".join(STYLE_TOKENS) } 等）。

输出 JSON Schema：
{JSON_SCHEMA}"""

STAGE_B_SYSTEM_PROMPT = f"""你是"小红书爆款SVG渲染器"。只根据输入的设计 JSON 输出一个 <svg>，
画布固定 {SVG_RULES['CANVAS']}（{CANVAS_ASPECT_RATIO}比例）。禁止输出除 <svg> 外的任何字符。

通用规则：
- 背景填充 palette.bg；文本颜色 palette.text；强调用 palette.accent/或 accent2；
- 字体回退：{SVG_RULES['FONT_FAMILY']}；
- 每行≤{SVG_RULES['MAX_CHARS_PER_LINE']}汉字；使用 <tspan> 自动断行；坐标尽量为整数；
- 重要文本 paint-order: stroke fill; stroke:#000; stroke-width:0.8；
- 仅使用 SVG 原生元素，不使用 <foreignObject>、外链图片或脚本；
- Emoji：直接使用 Unicode 字符；包含 emoji 的文本必须指定包含 emoji 字体的 font-family；
- 覆盖目标：文本+模块覆盖画布 {SVG_RULES['CONTENT_COVERAGE']}；不足则放大字号或补齐 bullets。

布局蓝图（layout_blueprint 可选）：
- meme_poster（simple）：标题占比 0.3–0.45，允许标题强调（hl_marker/underline/accent_box）；可加入贴纸/爆炸等装饰。
- hero_checklist_cta / tabs_checklist_cta（standard）：3–5 条 bullets 的卡片/清单；底部 CTA；chips 行可两行。
- info_cards_grid（rich）：2×2 或 1×3 卡片网格；每卡一行标题+一行补充；可配 icon 点缀（几何图形）。

style_tokens 提示：
halftone：点阵 pattern，opacity≈0.15；hl_marker：半透明荧光条；sticker：白描边贴纸；dashed_card：虚线卡片；
paper_texture：轻微纸纹；glow：主体光晕；scallop_header：波浪页眉；torn_edge：撕纸边。
"""


def create_stage_a_user_prompt(text: str, options: dict) -> str:
    style_choice = options.get("styleChoice", "standard")
    main_color = options.get("mainColor", "")
    accent_color = options.get("accentColor", "")
    audience = options.get("audience", "泛用户")
    intent = options.get("intent", "")

    return f"""原文：<<<{text}>>>
STYLE_MODE：{style_choice}
可选主色：{main_color}
可选强调色：{accent_color}
目标受众：{audience}
内容意图：{intent}"""


def create_stage_b_user_prompt(design_json: str, style_choice: str = "standard") -> str:
    return f"样式：{style_choice}\n设计JSON：<<<{design_json}>>>"
