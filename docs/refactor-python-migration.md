# Python 重构对比说明

## 概述
- 目标：以 FastAPI 统一后端，替换 NestJS/Koa，保留 Next.js 前端不变。
- 原端点族：`auth`、`data`、`export`、`finance(pricing|report|risk)`、`generate`、`kpi`、`logs`、`openapi`。

## 模块映射
- 控制器：`apps/api`/`apps/node-api` → `pyapp/src/pyapp/interfaces/controllers/*`。
- 领域：Node `src/domain/*` → Python `pyapp/src/pyapp/domain/*`（`finance.py` 等）。
- 用例：Node `src/application/usecases/*` → Python `pyapp/src/pyapp/application/usecases/*`（`generate_card.py`）。
- 工具层（http-common）：Node `src/shared/lib/http-common.ts` → Python `pyapp/src/pyapp/lib/http.py`（弱 ETag、IP 提取、条件 304）。
- 中间件：Node 鉴权/限流 → Python `interfaces/middleware/common.py`（请求 ID、CORS、统一异常处理）。

## 关键差异与改进
- 异常处理：统一 JSON 错误结构，保留 304 无体响应。
- 类型注解与 Docstring：核心函数与控制器添加注解与文档说明。
- 测试与覆盖率：Pytest 全量通过，总覆盖率 91%，产出 HTML 与 XML 报告。
- 性能：`generate` 并发基准（200 请求，16 并发）结果 p50≈38.44ms、p90≈85.10ms、p95≈102.85ms、p99≈158.95ms。

## 运行与代理
- 开发代理：Next.js `rewrites` 将 `/api/*` 代理到 `http://localhost:8000/api/*`。
- Python 服务：`uvicorn pyapp.main:app --port 8000 --reload`。

## 回滚策略
- 代理可关闭以回退到原 Node API；功能契约测试保障兼容性。

## 覆盖率与基准产物位置
- 覆盖率：`htmlcov/` 与 `coverage.xml`。
- 基准：`pyapp/scripts/bench_generate.py` 输出统计。
