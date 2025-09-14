# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Development:**
```bash
npm run dev      # Start development server (auto-detects available port)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint code checks
```

**Playwright Setup (Required for emoji rendering):**
```bash
npm install playwright
npx playwright install chromium
```

## Architecture Overview

This is a Next.js 14 application that converts WeChat public account articles into Xiaohongshu (Little Red Book) style cards using AI services.

### Core Processing Pipeline

```
Input Text → AI Service Selection → AI Analysis (2-stage) → SVG Generation → PNG Rendering → Card Output
```

**Stage A (Analysis):** AI extracts content and generates design JSON with template type (A-H), color palette, and content structure.

**Stage B (Rendering):** AI converts design JSON into SVG markup with proper emoji support.

### Key Architecture Components

**AI Services (`src/services/`):**
- **Modular Design**: Independent `DeepSeekService` and `NanoBananaService` classes
- **No Fallback Logic**: User-selected model failure results in direct error (no auto-switching)
- **Service Factory**: `createAIService(model)` creates appropriate service instance
- **Unified Interface**: Both services implement `AIService` abstract class
- Template validation for 8 card types (A-H classification system)

**Image Rendering (`src/lib/image-converter.ts`):**
- **Critical:** Uses Playwright browser engine instead of Sharp for emoji support
- `convertSvgToPng()` - Wraps SVG in HTML page and screenshots with Chromium
- Emoji fonts: Configured via `APP_CONSTANTS.EMOJI_FONTS`

**API Routes:**
- `/api/generate` - Simplified generation endpoint, no complex fallback logic
- `/api/export` - Batch card export as ZIP

**State Management:**
- **React Context**: `AppProvider` and `useApp()` hook for global state
- **Custom Hooks**: `useCardGeneration()` and `useExport()` for business logic
- **No Props Drilling**: Components access state through Context

### Template System (A-H Classification)

The app generates cards based on 8 template types:
- **A-H types** defined in `DesignJSON` interface
- Each type has different layout, color schemes, and content emphasis
- Templates determined by AI analysis of input content sentiment/structure

### Environment Variables

Required in `.env.local`:
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
APICORE_AI_KEY=your_nanobanana_api_key_here
```

Optional environment variables:
```
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
NANOBANANA_API_URL=https://kg-api.cloud/v1/chat/completions
TURSO_DATABASE_URL=your_database_url_here
TURSO_AUTH_TOKEN=your_database_token_here
```

## Critical Technical Details

**Emoji Rendering Solution:**
- Problem: Sharp library cannot render Unicode emoji characters
- Solution: Playwright wraps SVG in HTML with emoji fonts and screenshots
- Performance impact: +300ms per card, +100MB memory usage
- Fonts used: Configured in `APP_CONSTANTS.EMOJI_FONTS` array

**AI Processing (Simplified Architecture):**
- **No More Fallback Chain**: Each AI service operates independently
- **Direct Error Handling**: Service failure results in immediate error response
- **Two-Stage Processing**: Both DeepSeek and NanoBanana use analysis → rendering pipeline
- **JSON Cleaning**: Responses are cleaned of markdown wrappers but no fallback generation

**Memory Management:**
- Playwright browser instances must be properly closed in finally blocks
- Each generation spawns new Chromium process
- Monitor for browser process leaks in production

## Development Guidelines

**When Adding New AI Models:**
- Create new service class in `src/services/` extending `AIService`
- Follow two-stage pattern: analysis JSON → SVG generation
- Implement `process(text: string): Promise<AIServiceResult>` method
- Add new model to `AIModel` union in `src/types/index.ts`
- Update `createAIService()` factory function

**When Modifying Card Templates:**
- Update `CardTemplate` type (A-H letters only) in `src/types/index.ts`
- Ensure simplified `DesignJSON` interface supports new template requirements
- Update `TEMPLATE_COLORS` constant in `src/constants/index.ts`
- Test emoji rendering with Playwright pipeline

**Error Handling Philosophy:**
- **Fail Fast**: No complex fallback chains, let errors surface to users
- **Clear Messages**: Provide specific error information for debugging
- **Service Isolation**: Each AI service handles its own errors independently
- **User Feedback**: Always inform users of specific failure reasons

## Performance Considerations

- Playwright adds ~500ms per card generation
- Memory usage: ~150MB per Chromium instance
- Consider implementing browser instance pooling for high-load scenarios
- SVG optimization happens before Playwright rendering

## File Structure Context

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts    # Simplified card generation API
│   │   └── export/route.ts      # Batch download API
│   ├── page.tsx                 # Main UI with AppProvider
│   ├── layout.tsx               # Next.js layout
│   └── globals.css              # Global styles
├── services/
│   ├── types.ts                 # AI service interfaces and base class
│   ├── deepseek.ts              # DeepSeek AI service implementation
│   ├── nanobanana.ts            # NanoBanana AI service implementation
│   ├── copytext.ts              # Xiaohongshu copytext generation
│   └── index.ts                 # Service factory and exports
├── hooks/
│   ├── useCardGeneration.ts     # Card generation business logic
│   └── useExport.ts             # Export functionality
├── context/
│   └── AppContext.tsx           # React Context + Reducer state management
├── components/
│   ├── Sidebar.tsx              # Input controls (UI only)
│   ├── Canvas.tsx               # Card preview area (UI only)
│   └── CardPreview.tsx          # Individual card display
├── lib/
│   ├── image-converter.ts       # Playwright SVG→PNG conversion
│   ├── prompts.ts               # AI prompt templates
│   └── config.ts                # Environment configuration
├── constants/
│   └── index.ts                 # App constants and template colors
└── types/
    └── index.ts                 # Simplified TypeScript definitions
```