# 统一代码规范（TS/JS & Python）

## 通用原则
- 一致性优先：遵循统一命名、分层边界与错误处理约定。
- 可读性与可维护性：短函数、清晰依赖、避免隐式副作用。
- 安全默认：输入校验、最小权限、无敏感信息日志与硬编码。

## TypeScript / JavaScript
- 语言与编译：
  - 启用 `strict`、`noImplicitAny`、`exactOptionalPropertyTypes`；禁止 `any` 降级。
  - 仅在边界处使用 `unknown` 与类型守卫；优先 `enum/union` 表达意图。
- 命名与结构：
  - 文件/目录使用短小明确名词（小写中划线或驼峰）；类型与类使用 PascalCase。
  - 模块分层：`presentation`/`application`/`domain`/`infrastructure`；禁止跨层反向引用。
- 错误处理：
  - 不吞异常；定义语义化错误与错误码；向上抛出之前转为领域/应用层错误。
  - 网络/IO 使用超时、重试（指数退避）、熔断与隔离策略。
- 日志与可观测性：
  - 结构化日志（`level`/`message`/`context`/`traceId`）；禁止输出敏感信息。
  - 指标与追踪：关键路径打点（延迟/吞吐/错误率）。
- 并发与资源：
  - 使用受控并发（队列/信号量）；避免共享可变状态；清理连接与句柄。
- 风格与 lint：
  - `eslint`（包含 `security`/`sonarjs`/复杂度限制/无未使用导入）、`prettier` 自动格式化。
  - 禁止 `console.*`；使用集中化日志库；禁止 `eval/new Function`。
- 依赖与接口：
  - 所有对外契约（API/事件/文件格式）以 Type 定义并经 OpenAPI/Schema 校验。
  - 避免在 `presentation` 直接访问数据库或缓存；通过应用层接口编排。

## Python
- 类型与校验：
  - 全面使用 `typing`，`mypy --strict`；禁止动态鸭子类型在核心逻辑。
  - 数据模型使用 Pydantic v2；入参/出参校验与默认值策略明确。
- 命名与结构：
  - 目录与模块遵循分层与清晰边界；类/类型使用 PascalCase，函数与变量用 snake_case。
- 错误与资源：
  - 统一异常层次；明确重试/超时策略；使用上下文管理清理资源。
- 日志与性能：
  - 结构化日志（`structlog`）；关键路径加指标；避免阻塞 IO（优先异步）。
- 风格与 lint：
  - `ruff` 规则集启用；`black` 格式化（若采用）；循环复杂度与函数长度限制。
- 依赖：
  - 固定版本与锁定文件；避免隐式可选依赖；与 Node 服务通过 OpenAPI 契约对齐。

## 测试与覆盖率
- 单元测试：独立纯逻辑；隔离外部依赖；覆盖≥90%。
- 集成测试：通过 Testcontainers/Docker Compose 启动依赖服务；校验事务与数据一致。
- 契约测试：OpenAPI/JSON Schema 生成与 Diff 门禁；跨服务交互固定用例。
- 端到端：关键用户路径；分层打点与错误捕获；报告归档。

## 文档与示例
- 使用 TSDoc/typedoc 与 `mkdocs`/`Sphinx` 生成 API 与开发者文档。
- 在每个模块提供最小可运行示例与使用指南。
