# 当前架构概览

## 分层与目录

* 表现层：`src/app/*`（Next.js App Router 与页面/接口）

* 接口层：`src/interfaces/http/controllers/*`（控制器、入参校验与统一输出）

* 业务应用层：`src/application/usecases/*`（用例编排、缓存/限流、服务调用）

* 领域层：`src/domain/*`（错误、常量等）

* 基础设施层：`src/infrastructure/*`（AI Provider、Cache/RateLimiter 仓储）

* 服务层：`src/services/*`（AI 模型适配与业务服务）

* 共享库：`src/lib/*`（HTTP 响应、日志、缓存、图像转换、限流、Redis 等）

## 关键调用链与协议

* 路由入口 → 控制器 → 用例 → 服务/基础设施 → 响应封装（HTTP/JSON）

  * `src/app/api/generate/route.ts:5-7` 接收 POST，委派到控制器

  * `src/interfaces/http/controllers/GenerateController.ts:19-45` Zod 校验、DI 容器、用例执行、`jsonOk/jsonError`

  * `src/application/usecases/GenerateCardUseCase.ts:29-70` 编排缓存键、速率限制、AI 生成、SVG→PNG 渲染与临时URL

  * `src/container/index.ts:9-23` IoC 容器聚合 `logger/cache/rateLimiter/aiProvider/config`

  * `src/infrastructure/providers/AIProvider.ts:5-8` 通过工厂 `createAIService` 获取具体实现

  * `src/services/index.ts:31-48` 工厂根据 `AIModel` 构造具体服务（读取 `appConfig`）

  * `src/lib/http.ts:3-22` 统一 JSON 响应封装（状态码与可选头）

* 通信协议：Next.js API Route（HTTP/JSON），控制器返回 `NextResponse.json`，头部含缓存策略与安全头（CSP 等见 `next.config.js:6-38`）

# 依赖声明文件

## package.json（完整）

```json
{
  "name": "gzh2xhs",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install"
  },
  "dependencies": {
    "autoprefixer": "^10.4.21",
    "framer-motion": "^12.23.25",
    "ioredis": "^5.4.1",
    "jszip": "^3.10.1",
    "lucide-react": "^0.556.0",
    "next": "14.2.18",
    "playwright": "^1.55.0",
    "react": "^18",
    "react-dom": "^18",
    "sharp": "^0.32.6",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@vitest/coverage-v8": "^2.1.9",
    "eslint": "^8",
    "eslint-config-next": "14.2.18",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-unused-imports": "^3.2.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.2",
    "postcss": "^8",
    "prettier": "^3.3.3",
    "prettier-plugin-tailwindcss": "^0.5.14",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "vitest": "^2.0.5"
  },
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "**/*.{json,md,css}": ["prettier --write"]
  }
}
```

## build.gradle

* 未检出（项目为 Next.js/TypeScript 前端服务，无 Gradle 构建）

# 性能测试与APM

* 已发现压测脚本：`scripts/perf/basic-bench.mjs`（并发、时长、输出 p50/p90/p95/p99/avg/ok/fail/total）

* 文档：`docs/perf-baseline.md`（基线说明）

* 未检出 Apache Bench/`wrk` 报告文件与 APM 数据归档

* 计划：在 `staging` 环境运行 AB 与 `wrk`，对 `/api/generate`、`/api/export` 进行多场景压测；引入 OpenTelemetry（或 Sentry/Datadog）采集指标与 traces，归档到 CI 产物

# 技术债务清单（初版，P0-P3）

* P0

  * 覆盖率严重不足：Statements 15.09%、Functions 38.33%（目标 ≥80%）；关键模块多数 0% 覆盖

  * 缺少 E2E 测试与集成测试（仅单元测试少量存在）

  * 未集成 SonarQube 质量门禁与静态扫描；无 CodeClimate/质量报告

* P1

  * 缓存与限流为内存实现，实例级生效；缺少 Redis 等后端与健康检查

  * AI 服务通过 `appConfig` 注入但缺少接口契约与可观测性（超时/重试/熔断）

  * 依赖图未生成与审查（循环依赖风险未显式消除）

  * 日志关联缺少统一 `requestId`（容器已支持 `ctx` 但未全面贯穿）

* P2

  * API 入参/出参契约未对齐 OpenAPI；Swagger UI 未建立

  * 缺少 ADR（架构决策记录）与版本策略（模块对外接口的变更管理）

  * 前端 Bundle 体积优化与分包策略未落地（仅默认 Next/Webpack）

* P3

  * Lighthouse/Performance 指标优化项：图片资源、缓存策略、预加载/预取、Sharp/Playwright 并发配置

# 覆盖率报告（按模块）

* 汇总（`coverage/index.html:25-50`）：Statements 15.09%（284/1881）、Branches 44.44%（40/90）、Functions 38.33%（23/60）、Lines 15.09%（284/1881）

* 模块分布示例：

  * `src/config` 95.45%（`coverage/gzh2xhs/src/config/index.html`）

  * `src/constants` 100%（`coverage/gzh2xhs/src/constants/index.html`）

  * `src/components` 0%（`coverage/index.html:157-169`）

  * `src/app` 0%（`coverage/index.html:112-124`）

  * `src/app/api/generate` 0%（`coverage/index.html:142-154`）

  * `src/app/api/export` 0%（`coverage/index.html:127-139`）

# 重构实施计划

## 代码结构优化

* 标准分层收敛：表现/接口/应用/领域/基础设施/服务/共享库，按现有目录巩固边界与依赖方向

* IoC 强化：

  * 抽象接口：`CacheRepository`/`RateLimiterRepository`/`AIProvider` 统一接口契约与可插拔后端

  * 容器 `AppContainer` 贯穿 `requestId` 与 `ip`，为日志与限流、追踪提供上下文

* 依赖图治理：引入 `dependency-cruiser`（或 `madge`）生成依赖关系图，持续消除循环依赖（设置 CI 阈值）

* 接口契约与版本：以 `/interfaces` 为外部契约目录，定义出入参 TypeScript 类型 + OpenAPI，对外暴露版本号与兼容策略

## 代码质量改进

* ESLint + Prettier + Husky 已在位，补充规则：命名规范（PascalCase/camelCase）、导入顺序、未使用变量/导入、复杂度阈值

* 集成 SonarQube：

  * 配置 Quality Gate（Blocker/Critical 0 容忍、覆盖率≥80%、重复代码阈值）

  * 在 GitHub Actions 增加扫描与门禁（PR 必须通过）

* 测试体系：

  * 单元测试迁移到 Jest（按需求），或保留 Vitest 并对齐阈值；优先实现核心路径覆盖（控制器/用例/服务/库）

  * 引入 Cypress 做 E2E（页面加载、API 合成场景、错误路径）

  * 覆盖率报告分模块出具，并在 CI 中上传产物

## 技术债务清理

* 建立 Jira/Linear 看板，按 P0→P3 排期；每项债务建立任务、验收标准与负责人

* 依赖升级：`npm-check-updates` 升级到最新 LTS，锁定版本，回归测试

* 性能优化：

  * Lighthouse ≥90（FCP < 1.5s）：图片优化、缓存/Headers、SSR/CSR 平衡、Bundle 分析（`next-bundle-analyzer`）

  * Playwright 渲染/Sharp：并发限制、内存占用检测、缓存命中率提升

  * 若接入数据库，再执行 `EXPLAIN ANALYZE` 与复合索引优化（当前项目未使用 DB）

* 依赖图 & 循环依赖：在 CI 中设为门禁

## 文档更新

* Swagger UI + OpenAPI：结合 Zod 模型使用 `zod-to-openapi` 生成规范，文档含请求示例与响应模型

* 架构图：C4 模型（Context/Container/Component），PlantUML 生成时序图（API→Controller→UseCase→Service→Provider）

* 开发者手册：环境变量、调试技巧、性能基线、常见问题

* 提交规范：Conventional Commits；自动生成 CHANGELOG

* ADR：对 DI/缓存/限流/测试框架迁移等重大决策记录

## 交付标准与流水线

* GitHub Actions：`lint-check`→`typecheck`→`unit tests`→`integration tests`→`e2e`→`sonarqube scan`→`quality gate`

* 性能门槛：Lighthouse ≥90（FCP < 1.5s）；压测报告（AB/wrk）与 CI 产物归档

* 质量门禁：SonarQube 通过率 100%，技术债务比率 <5%

* 对比报告：重构前后（内存占用、TPS、p95）

# 输出物清单（将交付）

* 架构图（C4 + 依赖关系图）与时序图

* 依赖声明与升级报告

* 压测报告（AB/wrk）与 APM 监控面板

* 技术债务看板（P0-P3）与清单

* 覆盖率报告（模块细分）

* ADR 与 CHANGELOG

请确认以上方案与现状材料；确认后我将按计划分阶段实施，并在每一步给出可验证的产物与度量。
