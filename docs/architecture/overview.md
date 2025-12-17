# 架构总览与目标分层

## 现状概览
- 前端：Next.js 14 + React 18 + TypeScript + Tailwind，具备 `vitest` 高覆盖率阈值与工程化配置。
- Node 后端：
  - `apps/api` 使用 NestJS + TypeORM + PostgreSQL + Redis + Swagger，模块化良好，容器与 CI 完善。
  - `apps/node-api` 为 Koa 轻量服务，使用 Zod/Pino/Redis，适合特定场景的轻量路由与服务。
- Python 后端：`pyapp` 使用 FastAPI + Uvicorn + Pydantic v2，`pytest`/`mypy`/`ruff` 完整，CI 独立。
- DevOps：GitHub Actions（Node/Python）、`docker-compose` 与 Helm（K8s），`CODEOWNERS` 与预提交钩子保障基线质量。

## 目标架构（分层与协作）
- 统一分层：
  - Presentation：控制器/路由仅承载输入/输出与权限校验，不承载业务。
  - Application：用例编排与事务边界，聚合跨模块协作，面向接口。
  - Domain：实体/值对象/聚合/领域服务，保持纯净与不依赖基础设施。
  - Infrastructure：持久化、缓存、消息、第三方接口、HTTP 客户端与适配层。
- BFF/网关策略：前端与 BFF 对话，BFF 调度 Node 与 Python 服务；API 统一通过 OpenAPI 版本化与校验，提供 `v1` 与 `v2` 并存的演进路径。
- 契约共享：在工作区建立契约包，前后端与多服务共享 DTO、错误码与事件 Schema；Python 侧通过 OpenAPI 生成模型或类型提示。

## 关键设计原则
- 明确依赖边界：跨层只向上依赖抽象与接口，禁止反向引用与环依赖。
- 失败优先设计：统一异常体系、错误码与重试/熔断/退避策略，日志具有关联 ID。
- 配置与密钥：以环境与密钥管理注入，禁止硬编码；提供 `.env.example` 与分环境配置。
- 性能 SLO：设定 p95 延迟与吞吐目标，基线基准测试与压测报告作为交付物。

## 演进路径与兼容
- 版本化 API：通过网关路由保持 `v1` 兼容，逐步迁移到 `v2` 的新分层与契约。
- 灰度/回滚：支持 Canary/Blue-Green 发布与自动回滚；数据库迁移具备回滚脚本与快照。
- 数据契约：所有外部/跨服务契约以 OpenAPI/JSON Schema 管理，CI 进行 Diff 校验与门禁。

## 成功度量
- 代码：圈复杂度、重复率、依赖健康度（Dependency Cruiser/SonarQube）。
- 测试：单元≥90%，集成与契约测试覆盖关键交互；端到端覆盖主要用户路径。
- 性能与稳定：基准与压测数据达到或超过目标，错误率与资源利用在阈值内。
