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

**Stage A (Analysis):** AI extracts content and generates design JSON with template type (simple/standard/rich), color palette, and content structure.

**Stage B (Rendering):** AI converts design JSON into SVG markup with proper emoji support.

### Recent Architecture Improvements (Code Refactoring)

**Unified Constants System:**

- All configuration centralized in `src/constants/index.ts`
- Eliminated hardcoded values across the codebase
- `APP_CONSTANTS`, `API_CONFIG`, `TEMPLATE_COLORS`, `ERROR_MESSAGES`, `PROMPT_CONSTANTS`

**Enhanced Error Handling:**

- Standardized error messages through `ERROR_MESSAGES` constant
- Comprehensive logging system in `AIService` base class
- Consistent error propagation across all services

**Improved Type Safety:**

- Unified `GenerationOptions` interface (eliminated duplication)
- Enhanced TypeScript definitions with proper inheritance
- Removed unused interfaces and consolidated types

### Key Architecture Components

**AI Services (`src/services/`):**

- **Modular Design**: Independent `DeepSeekService` and `NanoBananaService` classes extending `AIService` base class
- **No Fallback Logic**: User-selected model failure results in direct error (no auto-switching)
- **Service Factory**: `createAIService(model)` creates appropriate service instance
- **Unified Interface**: Both services implement standardized `AIService` abstract class with:
    - `callAPI()` - Common API calling logic with error handling
    - `cleanJsonResponse()` - JSON cleaning and validation
    - `extractSvgContent()` - SVG extraction and validation
    - `logError()` / `logInfo()` - Consistent logging patterns
- Template validation for style types (simple/standard/rich classification system)

**Image Rendering (`src/lib/image-converter.ts`):**

- **Critical:** Uses Playwright browser engine instead of Sharp for emoji support
- `convertSvgToPng()` - Wraps SVG in HTML page and screenshots with Chromium
- `convertBase64ToPng()` - Multi-method Sharp processing with fallback strategies
- **Configuration Centralized**: All rendering config moved to `APP_CONSTANTS` and `IMAGE_CONVERTER_CONFIG`
- **Error Handling**: Standardized error messages and proper resource cleanup
- Emoji fonts: Configured via `APP_CONSTANTS.EMOJI_FONTS` array

**API Routes:**

- `/api/generate` - Simplified generation endpoint, no complex fallback logic
- `/api/export` - Batch card export as ZIP

**State Management:**

- **React Context**: `AppProvider` and `useApp()` hook for global state
- **Enhanced Context**: Added `useAppSelector()` and `useAppActions()` convenience hooks
- **Custom Hooks**: `useCardGeneration()` and `useExport()` for business logic
- **Improved Actions**: Semantic action naming and better state validation
- **No Props Drilling**: Components access state through Context

### Template System (Style Classification)

The app generates cards based on 3 style types:

- **simple**: 1-2 strong impact title lines with minimal content
- **standard**: 3-5 point checklist with moderate information density
- **rich**: 6-9 points or 2-3 content sections with high information density
- Style selection determined by AI analysis of input content structure and complexity
- **Color Schemes**: Centralized in `TEMPLATE_COLORS` constant with 8 predefined palettes (A-H)
- Templates use standardized `GenerationOptions` interface for consistent configuration

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

**AI Processing (Enhanced Architecture):**

- **No Fallback Chain**: Each AI service operates independently with clear error boundaries
- **Unified Error Handling**: Standardized error messages from `ERROR_MESSAGES` constant
- **Two-Stage Processing**: Both DeepSeek and NanoBanana use analysis → rendering pipeline
- **Enhanced Logging**: Comprehensive logging at each processing stage via `AIService` base class
- **JSON Cleaning**: Robust response cleaning with multiple fallback patterns
- **Configuration-Driven**: Prompts managed through `PROMPT_CONFIG` for maintainability

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

**Error Handling Philosophy (Enhanced):**

- **Fail Fast**: No complex fallback chains, let errors surface to users with clear context
- **Centralized Messages**: All error messages defined in `ERROR_MESSAGES` constant for consistency
- **Service Isolation**: Each AI service handles its own errors via `AIService` base class methods
- **Comprehensive Logging**: Detailed error logging with context via `logError()` method
- **User Feedback**: Standardized error responses with specific failure reasons
- **Type Safety**: Error handling with proper TypeScript types and validation

## Performance Considerations

- Playwright adds ~500ms per card generation
- Memory usage: ~150MB per Chromium instance
- Consider implementing browser instance pooling for high-load scenarios
- SVG optimization happens before Playwright rendering
- **Post-Refactoring**: Reduced memory leaks through better resource cleanup and centralized config

## Code Refactoring Summary (Latest)

### Key Improvements Achieved

**1. Eliminated Code Duplication:**

- Removed duplicate interfaces (`PromptGenerationOptions` → unified `GenerationOptions`)
- Centralized canvas size definitions (removed from multiple files)
- Unified browser configuration (single source in `APP_CONSTANTS`)

**2. Constants Centralization:**

- **`src/constants/index.ts`** now contains all configuration:
    - `APP_CONSTANTS` - Core app settings (sizes, timeouts, fonts)
    - `API_CONFIG` - API endpoints and default parameters
    - `TEMPLATE_COLORS` - Color palette definitions (A-H)
    - `ERROR_MESSAGES` - Standardized error text
    - `PROMPT_CONSTANTS` - Prompt generation configuration

**3. Enhanced Error Handling:**

- Unified error message system prevents inconsistent error text
- `AIService` base class provides standard logging methods
- Proper error context and debugging information
- TypeScript-safe error handling patterns

**4. Improved Maintainability:**

- Clear separation of concerns between services
- Configuration-driven design reduces hardcoding
- Better code organization with private methods
- Comprehensive type safety improvements

**5. Development Benefits:**

- Single source of truth for all constants
- Easier configuration changes (one file to update)
- Consistent error messages across all services
- Better debugging with structured logging

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
