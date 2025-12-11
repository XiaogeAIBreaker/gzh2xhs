## 目标与原则

- 保持现有功能完整可用，逐步演进，随改随测
- 高内聚、低耦合的功能模块划分，清晰边界与依赖方向
- 统一命名与代码风格；严格类型与运行时数据校验并存
- 以可观测性与性能为导向（日志、限流、缓存、度量）

## 现状摘要（基于仓库调研）

- 技术栈：Next.js App Router + React 18 + TypeScript + Tailwind；Vitest 单测；Playwright+sharp 负责图像渲染；可选 Redis 限流；Zod 环境变量校验
- 项目结构：`src/app`（页面与 API）、`src/components`（UI）、`src/services`（AI服务）、`src/lib`（工具）、`src/config`/`src/constants`/`src/types`；已存在中间件与 CI
- 质量工具：`next lint` 存在，Prettier缺失；TS 严格模式已开启；测试覆盖面可提升

## 目录与模块重构（渐进）

- 保留 App Router 结构，按“功能切片 + 共享层”组织：
    - `src/app/*`：页面与 API 路由（仅路由与页面壳）
    - `src/features/card-generator/*`：卡片生成的组件、hooks、服务协调、types
    - `src/features/export/*`：导出与打包逻辑（UI 与服务封装）
    - `src/shared/components/*`：通用 UI（Button、Modal、Canvas 等）
    - `src/shared/lib/*`：纯函数工具（image、http、logger、rate-limiter、redis）
    - `src/shared/config/*`、`src/shared/constants/*`、`src/shared/types/*`
    - `src/process/*`：跨层流程编排（如 A→B 两阶段 AI 流程）
- 迁移策略：文件逐步移动，保留原导出路径，通过 `@/` 别名兼容一段时间；分 PR 迁移每个功能域

## 命名与约定

- 文件：组件 `PascalCase.tsx`，工具/hook `camelCase.ts`，API `route.ts`
- 变量/函数：`camelCase`；类型/接口：`PascalCase`；常量：`UPPER_SNAKE_CASE`
- 目录：功能域小写短横（`card-generator`）；共享层统一在 `shared/*`
- 导出：默认导出仅限页面壳；其余全部使用具名导出

## 技术栈升级

- 依赖版本：统一升级到同一大版本最新稳定（Next 14.x/React 18.x/TS 5.x/Tailwind 3.4+/Vitest/Playwright/sharp/ioredis/zod）
- 新增：Prettier（含 Tailwind 插件），`eslint-config` 扩展与规则收敛，`lint-staged` + `husky` 提交前钩子
- 构建与测试：开启 `tsc --noEmit` 检查；Vitest 覆盖率与快照；E2E 使用 Playwright（UI流程）
- 可选适配：在无法运行 Playwright 的平台（如部分无 headless 依赖的环境）时回退 `resvg-js`/`canvas` 渲染

## 代码质量提升

- TypeScript：开启/强化 `exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`noImplicitOverride`
- API 类型：Zod 模式→`z.infer` 推断，统一请求/响应类型；消除 `any` 与宽泛联合
- 错误边界：页面与关键组件引入 Error Boundary，API 层统一错误码与细粒度日志脱敏
- Lint/格式：统一 ESLint 规则（import 排序、unused-vars、no-floating-promises 等），Prettier 格式化

## 性能优化

- 关键路径：
    - 图像渲染：复用单例浏览器实例（Playwright），并发队列限流；`sharp` 管线化
    - 缓存：基于“输入参数哈希”的结果缓存（Redis/LRU）；API 设置 `Cache-Control` 与 `ETag`/`SWr`
    - 资源加载：重组件与编辑器工具栏 `dynamic import`；Tailwind 样式裁剪；去除未使用依赖
- 监控与度量：Next Web Vitals、API 延迟/错误率、限流命中率、命中/回源比

## 开发体验

- 本地环境：`.env.example` 完整字段说明；`npm run dev:test:ci` 三套脚本分离
- IDE：TypeScript 严格+路径别名提示；VSCode 推荐扩展与设置
- 提交规范：Conventional Commits；自动生成 `CHANGELOG.md`
- 文档：在代码关键路径添加 JSDoc/注释；README 增补架构图与模块边界说明

## 兼容性与安全

- 部署：Vercel/自托管两套说明；Playwright 依赖检测与回退策略
- 安全：CSP/安全头随环境差异化；中间件保留并完善 CORS；禁止日志输出敏感字段
- 运行时校验：所有 API 入参使用 Zod 校验并返回结构化错误

## 交付与分阶段

- Phase 0 基线：锁定依赖、建立测试与覆盖率阈值、引入 Prettier/Husky/lint-staged；不改业务
- Phase 1 结构：按功能域迁移目录与导出，维持旧路径兼容；增加 Error Boundary
- Phase 2 类型与质量：强化 TS 严格选项，补齐 Zod→TS 推断与 API 类型；清理 any
- Phase 3 性能与缓存：浏览器实例复用与并发控制；引入缓存层与响应头；组件按需加载
- Phase 4 文档与交付：完善 README 与变更说明；开启 CI 覆盖率门槛与多 Node 版本矩阵
- 每阶段均：测（unit/integration/e2e）→预览验证→回归

## 验证与测试策略

- 单元测试：`shared/lib` 纯函数、服务层适配器；快照用于 SVG/PNG 输出
- 集成测试：API 路由调用（参数校验、限流、缓存命中）；Redis 存在/不存在两种模式
- 端到端：关键用户流程（生成→预览→导出）；不同模型/尺寸组合场景
- 覆盖率：全局阈值（如 statements 85%/branches 80%），关键模块单独阈值

## 变更说明与迁移指南

- 每阶段输出变更摘要：结构调整、类型升级、性能与缓存策略变更、对部署的影响
- 维护 `CHANGELOG.md`（自动生成），列出破坏性变更与迁移步骤
- 附路由/模块对照表（旧→新），提供临时别名与移除计划

---

如确认以上方案，将依次执行 Phase 0→4，并在每一步提交对应的测试与文档，确保不影响现有业务功能。
