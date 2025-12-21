from typing import Literal

from pydantic import BaseModel, Field


class Palette(BaseModel):
    bg: str
    text: str
    accent: str
    accent2: str | None = None


class TitleEmphasis(BaseModel):
    text: str
    style: Literal["hl_marker", "accent_box", "underline"]
    color: str | None = None


class Badge(BaseModel):
    text: str
    style: Literal["explosion", "pill", "ribbon"]
    pos: Literal["tl", "tr", "bl", "br"] | None = None


class Bullet(BaseModel):
    icon: Literal["check", "arrow", "number"]
    text: str


class CTA(BaseModel):
    text: str
    style: Literal["tape", "sticker"]


class Modules(BaseModel):
    badges: list[Badge] | None = None
    bullets: list[Bullet] | None = None
    cta: CTA | None = None


class Typography(BaseModel):
    mode: Literal["title_dominant", "balanced", "dense"]
    title_area_ratio: float
    title_font_px: int | None = None
    max_title_lines: int | None = None


class Background(BaseModel):
    texture: Literal["paper", "grid", "none"]
    intensity: float


class Subject(BaseModel):
    image: str | None = None
    cutout: bool | None = None
    outline: bool | None = None


class DesignJSON(BaseModel):
    template_type: Literal["simple", "standard", "rich"]
    palette: Palette
    title_lines: list[str]
    highlights: list[str] | None = None
    content: str | None = None
    layout: Literal["center", "left", "right"] | None = None
    style_tokens: list[str] | None = None
    layout_blueprint: Literal[
        "hero_checklist_cta",
        "tabs_checklist_cta",
        "two_col_subject_cta",
        "meme_poster",
        "notebook_paper",
        "info_cards_grid"
    ] | None = None
    topic_tags: list[str] | None = None
    pillars: list[str] | None = None
    typography: Typography | None = None
    info_density: Literal["low", "medium", "high"] | None = None
    bullet_target: int | None = None
    image_slots: int | None = None
    title_emphasis: list[TitleEmphasis] | None = None
    modules: Modules | None = None
    background: Background | None = None
    subject: Subject | None = None
    decoration_intensity: float | None = None
    content_density: float | None = None


class GenerationOptions(BaseModel):
    styleChoice: Literal["simple", "standard", "rich"] = "standard"
    mainColor: str = ""
    accentColor: str = ""
    audience: str = "泛用户"
    intent: str = ""


class GenerateRequest(BaseModel):
    text: str
    options: GenerationOptions | None = None


class GenerateResponse(BaseModel):
    svgContent: str
    designJson: DesignJSON
