## 总体目标
- 在保持功能完整性的前提下，将现有服务端能力迁移到 Python，实现等价 API 行为与数据契约。
- 提升代码可维护性与扩展性，遵循 Pythonic 风格与 PEP8，补齐类型提示、文档字符串与严谨的错误处理。
- 在关键路径（生成、图像转换、并发控制、缓存/限流）实现性能不降级，提供前后对比基线数据。

## 重构范围
- 保留前端（Next.js/React）界面与交互逻辑不变，替换服务端 API 路由为独立 Python 服务。
- 覆盖现有 Node/TS 服务端模块：`src/interfaces/http/controllers/*`、`src/application/*`、`src/domain/*`、`src/shared/lib/*`（与后端相关部分）、`src/lib/*`、`src/config/*`。
- 维持既有路由与响应协议：如 `src/app/api/generate/route.ts`、`src/app/api/export/route.ts` 的行为、校验与错误语义。

## 技术栈选型
- Web 框架：FastAPI（高性能、类型友好、OpenAPI/文档内建）。
- 运行时：Python 3.11+，`uvicorn`/`gunicorn`，可选 `uvloop`（Linux）。
- 数据建模与配置：Pydantic v2（请求/响应模型），`pydantic-settings`（环境配置）。
- 并发与异步：`asyncio` + `anyio`（适配 FastAPI），信号量/队列控制。
- 缓存与限流：`redis-py`/`aioredis`，自定义令牌桶/漏桶或使用 `slowapi`。
- 图像转换：`cairosvg`（SVG→PNG）、`Pillow` 或 `pyvips`；如需与浏览器一致渲染，接入 Python Playwright。
- 日志与可观测性：`structlog`/`logging` + JSON handler，`prometheus-client`/OpenTelemetry。
- 依赖管理：Poetry（锁版本、分组依赖），`pre-commit`（格式化与 lint）。
- 测试：pytest、pytest-asyncio、pytest-cov、pytest-benchmark；requests 使用 `httpx`。

## 架构映射
- 原分层（Controller / Application / Domain / Infrastructure / Shared）在 Python 中一一对应：
  - `interfaces/http/controllers/*` → `pyapp/interfaces/controllers/*`（FastAPI Router）
  - `application/*` → `pyapp/application/*`（UseCase 服务）
  - `domain/*` → `pyapp/domain/*`（实体、值对象、领域服务、错误）
  - `shared/lib/*` → `pyapp/shared/*`（并发、缓存、限流、图像、metrics）
  - `lib/*` → `pyapp/lib/*`（响应封装、HTTP 客户端、日志）
  - `config/*` → `pyapp/config/*`（配置与加载）

## 模块与功能对照
- 生成主链路：参考 `src/interfaces/http/controllers/GenerateController.ts` 与 `src/application/usecases/GenerateCardUseCase.ts`，实现 `POST /generate`（入参校验、速率限制、缓存、ETag、错误语义对齐）。
- 图像转换：参考 `src/shared/lib/image-converter.ts`，实现 SVG→PNG 的异步转换与并发控制，支持 emoji 字体；失败回退策略与超时保护。
- 并发与速率限制：参考 `src/shared/lib/concurrency.ts`、`rateLimiter.ts`，复刻全局限制器（信号量）与用户级限流（Redis）。
- 缓存：参考 `src/shared/lib/cache.ts`、`redis.ts`，实现缓存读取/写入、缓存键规范与 TTL。
- 监控与指标：参考 `src/shared/lib/metrics.ts`，导出请求时延、并发队列长度、错误计数等。
- 中间件行为：参考 `src/middleware.ts`，保持 CORS、CSRF（如适用）、`X-Request-Id`、A/B 标记逻辑；在 FastAPI middleware 中实现。

## 接口保持与兼容
- API 路由与响应结构完全对齐现有 TS 服务：状态码、错误码、头（如 `ETag`）、分页/列表结构。
- 使用 Pydantic 模型严格校验入参/出参，保证与 `src/types/schemas.ts` 一致（字段名、可选性、默认值）。
- 保留幂等策略与缓存命中语义；生成接口在缓存命中时返回 `304`/`ETag` 对齐现有逻辑。

## 代码规范与质量
- 全面使用类型提示与文档字符串（Google 或 NumPy 风格），开启 `mypy`、`ruff`、`black`。
- 目录组织遵循清晰模块边界，函数合理拆分，避免 God function。
- 错误分类与自定义异常：`pyapp/domain/errors.py`，控制器统一映射为标准 HTTP 响应。

## 错误处理与日志
- 统一异常处理器：框架级 `HTTPException`、业务异常→结构化 JSON 响应（含 `code`、`message`、`details`、`request_id`）。
- 结构化日志（JSON），注入请求上下文（trace id、user id、route、latency）。
- 对外禁止敏感信息泄露，错误栈仅在 debug 开启时返回。

## 性能优化策略
- 异步 IO 全面化：HTTP、Redis、文件/网络操作用 `async` 版本。
- 并发控制：全局/路由级信号量，避免过载；批量任务使用 `gather` + 超时 + 取消。
- 图像转换：优先 `cairosvg`/`pyvips`，在需要浏览器一致渲染时以 Playwright 渲染回退；缓存转换结果。
- 热点缓存：结果缓存 + ETag；限流在 Redis 侧靠近数据。
- 可选优化：`orjson`（JSON 编解码），`uvloop`（Linux），`pydantic` compiled。

## 测试与覆盖率
- 单元测试：domain 与 application 层纯逻辑测试，mock 外部依赖。
- 集成测试：FastAPI TestClient/`httpx` 调用路由，验证缓存/限流/ETag 行为与错误语义。
- 端到端：与前端联通测试（Next.js 指向 Python 服务），验证主要用户旅程。
- 覆盖率门槛：对齐 `vitest.config.ts` 的阈值或更高；CI 出具 `xml/html` 报告。

## 依赖与 CI
- 使用 Poetry 管理依赖与分组（dev/test/prod），锁文件入库。
- `pre-commit` 集成 `black`、`ruff`、`mypy`、`toml-sort` 等钩子。
- CI（GitHub Actions）：新增 Python 任务矩阵（3.11/3.12），执行 lint、type-check、tests、coverage、构建镜像（如用容器部署）。

## 迁移步骤
1. 新建 `pyapp/` 项目骨架（Poetry、FastAPI、配置、日志、基础异常）。
2. 迁移 `domain` 与 `application` 逻辑，补齐类型与文档；编写对应单测。
3. 实现控制器与中间件，完成 `/generate`、`/export` 等核心路由；接入缓存/限流。
4. 实现图像转换模块与并发控制；完成集成测试与基准测试。
5. 在 Next.js 中将 API 目标切换为 Python 服务地址（环境变量），保持前端不改业务逻辑。
6. 完成性能对比：沿用 `scripts/perf/basic-bench.mjs`（Node）对比 Python 端，同场景并发与时长；另提供 `pytest-benchmark` 报告。
7. 完成文档与运维说明（运行、配置、监控、告警、回滚策略）。

## 交付物与验证
- 完整 Python 代码库（`pyproject.toml`、`src/pyapp/**`）、类型与文档齐全。
- 单元/集成/端到端测试套件与覆盖率报告。
- 前后性能对比数据（p50/p90/p95/p99、RPS、错误率），测试脚本与方法说明。
- 部署清单与运行指南（含容器/进程管理、健康检查、指标端点）。

## 风险与回滚
- 图像渲染一致性风险：若 `cairosvg` 与现有结果存在差异，使用 Playwright 渲染回退并锁定字体集。
- 并发与限流语义差异：以契约测试保障；保留原 Node 服务旁路一段时间以便快速回滚。
- 依赖环境差异：容器化与锁版本确保交付一致性。

---
如确认上述方案，我将开始创建 Python 服务骨架、迁移核心模块与测试，并在关键里程点提供可运行示例与性能基线。