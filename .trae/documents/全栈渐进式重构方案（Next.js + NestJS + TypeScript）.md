## 重构目标与原则

- 满足前端 React 18 + TypeScript 严格模式、响应式与可访问性；引入 Redux Toolkit。
- 后端以 NestJS 10 重构，采用 DDD 分层与 REST/gRPC 混合架构。
- 数据层统一 TypeORM + Repository 模式，落地分库分表与 Redis + LRU 缓存。
- 质量指标：单测≥90%、集成≥80%、SonarQube 0 严重/阻断；性能达成 API −30%、查询 +50%、内存 −20%、并发 +100%。

## 当前代码库综述（依据扫描）

- 前端：Next.js 14（App Router）+ React 18 + TypeScript，目录 `src/app`、`src/components`、Tailwind。
- 状态：`React Context + Reducer`（位于 `src/context/*`）。
- 后端：Next.js 路由 `src/app/api/*`，含校验（zod）、速率限制、RBAC 中间件。
- 缓存：`ioredis`（可选）与自研 `LRUCache`（`src/shared/lib/cache.ts`）。
- 测试与 CI：Vitest、Playwright、GitHub Actions（已配置），Sonar 项目文件存在。并行 Python 服务在 `pyapp/`（FastAPI）。

## 技术选型与落地

- 前端：保留 Next.js 14；引入 Redux Toolkit + RTK Query；TS `strict: true` 全面开启；可访问性以 `eslint-plugin-jsx-a11y` + `jest-axe` 验证。
- 后端：新建 `apps/api` 的 NestJS 服务，Node 18/20；REST（外部）+ gRPC（内部）；OpenAPI/Swagger 自动文档。
- 数据层：PostgreSQL（主库）+ TypeORM；分库/分表采用租户分区（schema/表前缀）+ 哈希分片策略；统一缓存接口适配 Redis + LRU。

## 目录与 DDD 分层（目标形态）

- `apps/web`：Next.js 前端（React 18、TS 严格、Redux Toolkit）。
- `apps/api`：NestJS 服务。
- `packages/shared`：领域类型、DTO、proto、工具方法（前后端共享）。
- DDD 层次：`domain`（实体/值对象/聚合根）→ `application`（用例/服务）→ `infrastructure`（ORM/仓储/外部集成）→ `interfaces`（REST/gRPC 控制器）。

## 渐进式迁移策略

- 特性开关：在前端与 API 客户端引入 `featureFlags`，控制新旧后端切换；默认逐模块灰度。
- 契约测试：为旧路由 `src/app/api/*` 与 NestJS 新接口编写契约测试，确保响应模型一致。
- 流量切换：先只读查询迁移，后写入操作迁移；提供回滚策略。

## 前端改造

- 组件：将 `src/components/*` 升级为严格 TS + 可访问性属性（ARIA），保留 Tailwind 响应式。
- 状态：将 `src/context/*` 迁移为 `src/store/*`（Redux Toolkit slice + RTK Query），对现有 hooks 提供兼容适配层。
- 数据访问：统一通过 RTK Query 指向 NestJS REST；旧 Next.js API 作为后备。
- 无障碍与响应式：eslint a11y 规则、`jest-axe` 测试；Tailwind 宏断点与容器查询优化。

## 后端改造

- 模块：按领域划分模块（例如 `pricing`、`risk`、`report`、`generate`），实现 REST 控制器与 gRPC 服务。
- 领域模型：设计实体、聚合根与领域服务；用例层承载业务编排与事务边界。
- 中间件：统一认证（Bearer/JWT）、RBAC、速率限制、审计与幂等；保留 ETag 与缓存策略。
- 文档：Swagger（OpenAPI 3.1）自动化；保留现有 `openapi` 能力，迁移至 Nest。

## 数据层改造

- ORM：TypeORM 实体与迁移；Repository 模式提供接口（读写分离）。
- 分库分表：以租户/业务维度分区 + 哈希分片，读写路由在仓储层实现；索引与统计信息维护。
- 缓存：统一 `CacheProvider` 抽象，适配 Redis（`ioredis`）与内存 LRU；热点数据二级缓存（写穿/读写穿）。

## 质量保障

- 单测：Vitest（前端/共享）+ Jest（NestJS）；覆盖率门槛：行/分支/函数均≥90%。
- 集成/E2E：Playwright（前端）+ Supertest（REST）+ gRPC 契约；CI 中分阶段执行。
- 静态分析：ESLint、TypeScript、DepCruiser；SonarQube 集成质量阈值阻断。

## 性能优化

- API：RTK Query 缓存复用；HTTP ETag/Cache-Control；gRPC 内部调用降低序列化开销。
- 数据库：慢查询治理、索引与覆盖索引、批量与管道、事务边界优化；连接池与读写分离。
- 内存：减少中间对象、流式处理（生成/导出模块）；图片处理 `sharp` 并发受控；对象复用。
- 并发：NestJS worker 与队列（BullMQ）；I/O 密集模块拆分微服务；Node 线程池优化。

## CI/CD 与容器化

- GitHub Actions：前端与后端独立作业；缓存依赖；并行测试；覆盖率与质量门槛；产物上传。
- 容器：多阶段 Dockerfile（web/api）；健康检查；Compose/K8s 部署；环境配置 `.env` 与密钥管理。
- 监控：OpenTelemetry + Prometheus 指标；Grafana 仪表盘；错误告警。

## 阶段计划（2+3+8+2 周）

- 阶段一：现状分析
    - 生成全面质量报告；绘制系统架构与数据流；定位性能瓶颈。
- 阶段二：方案设计
    - 技选矩阵（React + RTK、Nest + TypeORM）；新架构蓝图与 DDD 边界；接口规范（REST/gRPC）。
- 阶段三：渐进式重构
    - 建立特性开关；前后端分模块迁移；自动化迁移验证（契约/回归）；每日构建与持续集成。
- 阶段四：验收交付
    - 全量回归与性能基准；ADR 完成；部署与运维交付。

## 交付物

- 代码：Git Flow 分支、完整 CI/CD、容器化方案（Dockerfile/Compose 或 K8s）。
- 文档：ADR、Swagger/OpenAPI、模块设计说明、运维部署手册。
- 质量证明：SonarQube 报告、性能测试报告、安全扫描、覆盖率报告。

请确认以上方案方向（React + Redux Toolkit / NestJS + TypeORM / PostgreSQL + Redis），我将按阶段逐项落地并输出相应文档与报告。
