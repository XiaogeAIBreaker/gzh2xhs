# 鲁迅风格全面重构计划（Next.js + TypeScript）

## 目标与原则

- 严苛审视：以静态分析与质量闸门横眉冷对所有不合理设计。
- 拿来主义：保留可复用与高价值模块（`zod`、`httpClient`、`shared/lib`），剔除冗余与重复实现。
- 命名生动：域概念清晰、动宾结构明确，拒绝晦涩与过度技巧。
- 单一职责：函数与组件各司其职，层次分明，便于替换与测试。
- 深刻错误学：错误类型统一、用户反馈明确、日志与告警可追。
- 注释直指本质：TSDoc 解释“为什么”，少写“是什么”。
- 执着性能：逐项诊断、逐项优化，建立可观测与回归基线。
- 简洁可扩展：最小必要抽象，分层稳定接口，演进友好。

## 代码基现状概览

- 前端：Next.js App Router（`/src/app`），TypeScript 严格（`tsconfig.json`），`zod` 校验，封装 `httpClient`，无 react-query/SWR；测试为 `vitest`；`eslint`/`prettier`/`husky` 完备。
- 后端：`pyapp`（FastAPI），中间件与分层清晰；与前端存在接口协作与并行能力。
- 大文件重点：`/src/docs/openapi.ts`（≈411 行）、`/src/context/AppContext.tsx`（≈291 行）、`/src/shared/lib/image-converter.ts`（≈369 行）。

## 重构总流程

1. 建质量闸门：静态分析、圈复杂度与依赖边界收敛，CI 强约束。
2. 体系化错误处理：错误类型域化、HTTP 统一拦截、UI 错误边界贯通。
3. 结构化拆分：按层与用例重排，拆大模块为可测试单元。
4. 性能诊断与优化：构建分析、运行态度量、针对性修正与回归。
5. 文档与注释整齐：TSDoc + 开发说明，交付可读可维护产物。

## 质量闸门（横眉冷对）

- TypeScript：`strict`、`noImplicitOverride`、`exactOptionalPropertyTypes` 生效；`paths` 仅 `@/*`。
- ESLint：启用并收紧规则：`unused-imports/no-unused-imports`、`import/order`、`no-floating-promises`、`no-explicit-any`（允许在边界层）、`max-lines-per-function`、`complexity`、`@typescript-eslint/consistent-type-imports`。
- 依赖边界：保留 `dependency-cruiser`，禁止 UI → domain 反向依赖；新增规则对 `services` 仅依赖 `lib`/`types`。
- CI：`typecheck`、`lint`、`test:coverage`、`dep:check` 一票否决；构建产物大小告警（阈值设置在 `next build` 报告基础上）。

## 拿来主义（保留与剔除）

- 保留：`zod` 校验、`httpClient`、`shared/lib/*`（缓存、并发、指标）、`logger`、`tailwind`。
- 剔除/合并：重复工具函数与各处私有封装；将散落的请求封装统一到 `lib/httpClient.ts`；移除未用依赖与死代码（通过 `dep:json` + 全局引用扫描）。

## 命名规范（形象生动）

- 变量名：面向域概念（如 `quoteRequest`、`riskScore`），拒绝 `data1/obj/tmp`。
- 函数名：动词开头 + 明确宾语（如 `calculatePremium`、`fetchReport`）。
- 组件名：名词性 + 语义清晰（如 `CardEditor`、`RiskSummaryPanel`）。
- 文件/类型：`PascalCase` 类型、`camelCase` 变量、`kebab-case` 文件；避免缩写除非行业标准。

## 单一职责（层次分明）

- 分层：`domain`（纯逻辑）→ `application/usecases`（编排）→ `interfaces/http`（适配器）→ `components`（展示）。
- 限制：函数 ≤30 行为目标；超标拆分；副作用从纯逻辑剥离到 hooks/适配层。
- 上下文拆分：将 `AppContext.tsx` 拆为 Provider、Selectors、Actions 三部分，减少重渲染与耦合。

## 错误处理（深刻与可追）

- 错误模型：定义 `AppError`（分类：`Network`/`Validation`/`Domain`/`Unknown`），含 `code`、`message`、`hint`、`cause`。
- HTTP 统一：在 `lib/httpClient.ts` 拦截并映射为 `AppError`，结合 `zod` 做响应/请求校验；重试与退避在 `shared/lib/concurrency` 实现。
- UI 错误边界：在 `app` 目录引入 `error.tsx` 与 `global ErrorBoundary`，对关键页面提供降级与可恢复动作（如重载、返回首页）。
- 日志与告警：使用 `src/lib/logger`，在错误边界与拦截器处打点（`shared/lib/metrics`）。

## 注释与文档（直指本质）

- TSDoc：为 `usecases`、`domain` 核心函数写注释，聚焦缘由与权衡；删除描述性冗余注释。
- OpenAPI：将 `/src/docs/openapi.ts` 拆分为 `schemas/*`、`routes/*`、`builder.ts`，避免巨石文件。
- 开发说明：在 `docs/` 输出模块边界、错误模型与性能基线说明。

## 性能优化（执着不放过）

- 构建分析：启用包分析（`ANALYZE=true`），定位大体积依赖与重复打包；按路由分割。
- 运行优化：
    - `next/dynamic` 按需加载重组件（如 `Canvas`、`SwaggerUI`）。
    - `next/image` 替换 `<img>`；图片转换迁移到 Web Worker（从 `image-converter.ts` 拆出管线）。
    - 记忆化与选择器：`React.memo`、`useMemo/useCallback`；上下文选择器减少重渲染。
    - RSC：尽可能将纯数据渲染下沉到 Server Components 与 Route Handlers。
    - 缓存：统一走 `shared/lib/cache`（内存/Redis），接口给出 `stale-while-revalidate` 策略。
- 安全与网络：CSP/安全头沿用 `next.config.js`，HTTP 超时与重试策略统一。

## 简洁与可扩展（走出来的路）

- 接口稳定：`services` 暴露最小必要方法；以 `types` + `zod` 固化契约。
- 领域驱动：`domain` 保持纯净；`usecases` 编排跨模块逻辑，便于替换外部服务。
- 约束路径：仅使用 `@/*` 作为别名，减少相对路径噪声与循环依赖。

## 优先改造模块（第一批）

- `/src/context/AppContext.tsx`：拆 Provider/Selectors/Actions，降低耦合与渲染成本。
- `/src/docs/openapi.ts`：拆分为 `schemas`/`routes`/`builder`，引入生成与校验管线。
- `/src/shared/lib/image-converter.ts`：拆分为纯算法与 Web Worker 管线，避免主线程阻塞。
- `/src/lib/httpClient.ts`：统一错误映射、校验、重试与日志；迁移分散请求封装。
- `/src/app/error.tsx`（新增）：页面级错误边界与降级 UI。
- `/src/app/api/*`：以 `zod` 校验请求/响应，统一错误返回体。

## 测试与验证

- 单测：`vitest` 覆盖率≥85%，新增针对 `usecases/domain/httpClient` 的快照与边界测试。
- E2E：补充 `playwright.config.ts` 与关键用户路径用例（生成卡片、导出、预览）。
- CI：类型检查 + Lint + 覆盖率 + 依赖巡检全部 gate；性能基线报告入库。

## 风险与回滚

- 分批提交与特性标志；对拆分模块保留薄适配层以便回滚。
- 性能与错误处理变更先灰度到非关键路由，观察指标后推广。

## 交付物

- 重构变更集（按模块记录）与迁移指南。
- 错误模型与接口契约文档（`docs/`）。
- 单测/E2E 报告与性能基线对比。
