## 现状扫描

- 仓库当前无一方 Python 源码、无 Python 入口点、无 Dockerfile（搜索已确认）。
- 仅存在第三方或环境相关的 Python 文件：`.venv/...` 与 `node_modules/flatted/python/flatted.py`，它们不属于项目逻辑。
- 核心后端能力已由 Node/TS 承担：
    - 图像渲染/转换：`src/lib/image-converter.ts`（Playwright + Sharp），如 `convertSvgToPng` 在 src/lib/image-converter.ts:55。
    - 统一响应封装：`jsonOk/jsonError` 在 `src/lib/http.ts:3-9`。
    - 配置校验：`zod` 校验环境变量在 `src/config/index.ts:3-15`，集中生成 `appConfig`。

## 迁移目标

- 完全移除 Python 依赖与痕迹，统一由 Node/TypeScript 实现所有功能。
- 若存在外部（未纳入仓库）Python 服务/脚本，同步迁移到 Next.js 路由/Node 脚本，统一配置与测试体系。

## 操作清单

1. 清理与忽略

- 删除仓库根目录下残留的 `.venv/` 目录（仅开发环境遗留）。
- 在 `.gitignore` 增加 `.venv` 以防再次纳入版本控制。

2. Web API 迁移（若目前在外部以 Python 实现）

- 将 Flask/FastAPI 路由迁移为 Next.js App Router 下的 API 路由（例如 `src/app/api/generate/route.ts` 与 `src/app/api/export/route.ts` 已具备基础结构）。
- 统一错误处理与响应格式，复用 `jsonOk/jsonError`（`src/lib/http.ts`）。
- 输入校验用 `zod`，与 `src/config/index.ts` 保持一致风格。

3. CLI/批处理脚本迁移（若有）

- 将 `scripts/*.py` 迁移为 `scripts/*.ts`，使用 `tsx` 或原生 `node` 运行。
- 常见映射：
    - `requests` → Node `fetch/undici`（或 `axios`）
    - `pandas`/数据清洗 → `arquero` 或 `danfo.js`（按实际复杂度选择）
    - `Pillow` 图像处理 → `sharp`（本项目已用）
    - SVG→PNG 渲染 → 继续使用 Playwright（已在 `src/lib/image-converter.ts` 实装）
    - 调度/定时 → `node-cron`；队列（`rq/celery`）→ `bullmq`/`bee-queue`（如需）

4. 配置与安全

- 环境变量统一通过 `zod` 校验（扩展 `EnvSchema`），在 `appConfig` 中集中暴露。
- 不在代码库中存储任何密钥；遵循现有 `.env.*` 模式。

5. 测试与验证

- 为迁移的模块补充 `Vitest` 单元测试，覆盖输入校验、错误处理、核心逻辑（参考 `tests/config.test.ts`, `tests/rateLimiter.test.ts`）。
- 端到端验证：
    - 生成流程：`/api/generate` → 产出设计 → `src/lib/image-converter.ts` 渲染 PNG。
    - 导出流程：`/api/export` → 批量下载。
    - 样例内容走通并核对 emoji 渲染（Playwright）。

6. CI/CD 与运行环境

- 在构建/部署流水线安装 Playwright 依赖：`npx playwright install-deps chromium`；参考 README 的 Docker 示例（README.md:124-128）。
- 确保服务器资源满足 Chromium 运行（README.md:130-134）。

## 交付物

- 清理后的仓库（移除 `.venv`，忽略规则完善）。
- 迁移后的 Node/TS 模块与脚本（与现有 `src/app/api/*`、`src/lib/*` 风格一致）。
- 新增/更新的单元测试与运行文档（README/Docs 对齐）。

如确认上述计划，我将执行清理 `.venv`、完善 `.gitignore`，并按需创建/迁移相应 Node/TS 模块与脚本。
