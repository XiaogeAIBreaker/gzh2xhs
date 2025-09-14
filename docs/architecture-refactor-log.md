# 架构重构日志

## 重构概述

**重构日期**: 2024年9月14日
**重构版本**: v0.1.0 → v0.2.0
**重构目标**: 提升代码可维护性、可迭代性，简化复杂的fallback逻辑

## 重构前后对比

### 架构变化

#### 重构前 (v0.1.0)
```
src/
├── app/page.tsx              # 状态管理 + UI
├── components/
│   ├── Sidebar.tsx          # UI + 业务逻辑混合
│   ├── Canvas.tsx           # UI + 状态传递
│   └── CardPreview.tsx      # UI + 下载逻辑
├── lib/
│   ├── ai-services.ts       # 341行，复杂fallback链
│   ├── config.ts            # 配置 + 常量混合
│   └── image-converter.ts   # 图像处理
└── types/index.ts           # 冗余的兼容性字段
```

#### 重构后 (v0.2.0)
```
src/
├── app/page.tsx              # 纯UI + AppProvider
├── services/                 # 独立AI服务层
│   ├── types.ts             # 服务接口定义
│   ├── deepseek.ts          # DeepSeek服务类
│   ├── nanobanana.ts        # NanoBanana服务类
│   ├── copytext.ts          # 文案生成服务
│   └── index.ts             # 服务工厂
├── hooks/                    # 自定义业务Hooks
│   ├── useCardGeneration.ts # 卡片生成逻辑
│   └── useExport.ts         # 导出功能逻辑
├── context/
│   └── AppContext.tsx       # React Context状态管理
├── components/               # 纯UI组件
├── constants/                # 统一常量管理
└── types/index.ts           # 简化的核心类型
```

## 详细变更记录

### 1. AI服务层重构

**变更类型**: 重大架构变更

**重构前问题**:
- `src/lib/ai-services.ts` 341行，过于庞大
- 复杂的三层fallback逻辑：DeepSeek → NanoBanana → Static SVG
- 错误处理混乱，真实错误被fallback掩盖
- 函数职责不清晰，难以测试和维护

**重构后方案**:
- 创建抽象`AIService`基类，统一接口
- `DeepSeekService`和`NanoBananaService`独立实现
- 移除所有服务间fallback，用户选择失败直接报错
- `createAIService(model)`工厂模式创建服务实例

**代码对比**:
```typescript
// 重构前
export async function processWithDeepSeek(text: string): Promise<Result> {
  try {
    // DeepSeek处理
  } catch (error) {
    return processWithNanoBanana(text) // 自动fallback
  }
}

// 重构后
export class DeepSeekService extends AIService {
  async process(text: string): Promise<AIServiceResult> {
    // DeepSeek处理，失败直接抛错
  }
}
```

### 2. 状态管理现代化

**变更类型**: 架构升级

**重构前问题**:
- Props drilling，状态在组件间层层传递
- `useState`分散在多个组件，状态管理混乱
- 复杂的状态更新逻辑分散在UI组件中

**重构后方案**:
- React Context + useReducer统一状态管理
- 自定义Hooks抽取业务逻辑
- 组件只负责UI展示，业务逻辑完全分离

**代码对比**:
```typescript
// 重构前
function Sidebar({ state, onStateUpdate }) {
  const handleGenerate = async () => {
    // 大量业务逻辑代码...
  }
}

// 重构后
function Sidebar() {
  const { state } = useApp()
  const { generateCard } = useCardGeneration()

  const handleGenerate = () => generateCard(state.inputText, state.selectedModel)
}
```

### 3. 类型系统简化

**变更类型**: 类型优化

**重构前问题**:
- `DesignJSON`接口包含大量兼容性字段（45行）
- `payload`、`ab_test`、`compliance`等冗余字段
- 类型定义与实际使用不匹配

**重构后方案**:
- 只保留8种模板真正使用的核心字段
- 移除所有兼容性和实验性字段
- 类型定义更准确反映实际数据结构

**代码对比**:
```typescript
// 重构前
export interface DesignJSON {
  template_type: CardTemplate
  palette: ColorPalette
  title_lines: string[]
  // ... 40+行兼容性字段
  payload?: { /* 嵌套复杂结构 */ }
  ab_test?: { /* 实验性字段 */ }
}

// 重构后
export interface DesignJSON {
  template_type: CardTemplate
  palette: ColorPalette
  title_lines: string[]
  content?: string
  highlights?: string[]
  layout?: 'center' | 'left' | 'right'
}
```

### 4. 常量管理优化

**变更类型**: 代码组织优化

**重构前问题**:
- 硬编码常量分散在多个文件
- 配置与常量混合在`config.ts`中
- Emoji字体配置硬编码在HTML模板中

**重构后方案**:
- 创建`src/constants/index.ts`统一管理
- 配置的模板颜色、尺寸、字体等集中定义
- 便于维护和主题切换

## 业务逻辑保持不变

### ✅ 保持的功能
- 8种模板分类和选择逻辑
- DeepSeek两阶段处理流程（分析→渲染）
- NanoBanana两阶段处理流程
- Playwright SVG到PNG渲染
- Emoji字体支持
- 用户界面交互体验
- 卡片预览和下载功能

### ❌ 移除的复杂逻辑
- DeepSeek失败自动切换到NanoBanana
- NanoBanana两阶段失败后调用Legacy一阶段
- AI服务失败后生成静态fallback SVG
- 复杂的Promise.allSettled错误容忍机制

## 重构收益

### 🎯 开发体验提升
- **代码可读性**: 模块化架构，职责清晰
- **可维护性**: 组件和服务独立，易于修改和扩展
- **可测试性**: 业务逻辑分离，便于单元测试
- **调试友好**: 错误信息更清晰，无复杂fallback掩盖

### 🚀 性能优化
- **代码分割**: 按功能模块组织，便于tree-shaking
- **状态更新**: Context避免不必要的重渲染
- **错误处理**: Fail-fast减少无用的重试时间

### 📚 可迭代性
- **新AI模型**: 只需继承AIService基类
- **新功能**: Hooks模式易于功能扩展
- **UI改进**: 组件职责单一，样式修改影响面小

## 迁移指南

### 开发者迁移
1. **状态访问**: `useState` → `useApp()` hook
2. **业务逻辑**: 组件方法 → 自定义hooks
3. **AI服务**: 直接调用 → 工厂模式创建

### 部署注意事项
1. **环境变量**: 需添加`APICORE_AI_KEY`
2. **错误监控**: 不再有自动fallback，需监控具体服务错误
3. **用户体验**: 错误信息更直接，需要更好的用户引导

## 后续优化建议

1. **服务扩展**: 考虑添加更多AI模型支持
2. **缓存机制**: 为常用模板添加缓存层
3. **错误重试**: 添加可配置的重试机制（不同于fallback）
4. **性能监控**: 添加各服务的性能指标收集
5. **用户偏好**: 保存用户常用的模型和模板选择