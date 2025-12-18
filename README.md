# 公众号转小红书卡片生成器

一个将微信公众号文章内容转换为小红书风格卡片的AI驱动工具。

## 功能特点

- 🤖 **双AI模型支持**：支持DeepSeek和NanoBanana两种AI模型
- 🎨 **多样化设计**：支持三种信息密度款式（simple/standard/rich），内置多套配色方案
- 📱 **移动端优化**：1080x1440标准小红书卡片尺寸
- 😊 **完美Emoji支持**：使用Playwright引擎确保emoji正确显示
- 📝 **文本输入**：直接粘贴文章内容即可生成卡片
- 💾 **批量导出**：支持单张或批量下载PNG格式卡片
- 🔄 **智能文案**：自动生成配套的小红书爆款文案

## 技术栈

- **前端框架**：Next.js 14 + TypeScript
- **状态管理**：React Context + Custom Hooks
- **样式方案**：Tailwind CSS
- **AI服务**：DeepSeek API + NanoBanana API
- **图像处理**：Playwright (emoji渲染) + Sharp (图像优化)
- **架构模式**：模块化服务层 + 统一错误处理
- **部署平台**：支持Vercel等平台

## 重构与升级概览（当前版本）

- 目录重构：新增 `src/shared/*` 与 `src/features/*`，纯工具迁移至 `shared/lib`，保留原路径兼容
- 代码规范：新增 Prettier（含 Tailwind 插件）与 ESLint 配置，提交前自动格式化
- 类型强化：开启更严格的 TS 编译选项（`exactOptionalPropertyTypes` 等），API 路由以 Zod 推断数据
- 性能与缓存：Playwright 浏览器实例复用与并发限制；生成接口添加内存 TTL 缓存与 `Cache-Control/ETag`
- 测试与CI：Vitest 覆盖率配置，新增缓存单测；CI 增加 Node 18/20 矩阵与覆盖率产物上传

### 本次优化补充

- 请求校验集中化：新增 `src/types/schemas.ts`，统一 `Generate/Export` 路由的 Zod 校验
- IP 获取统一：在 `src/lib/http.ts` 增加 `getClientIp`，清理控制器内重复解析逻辑
- Playwright 资源管理：`convertSvgToPng` 渲染后主动关闭页面，避免内存泄漏
- 全量回归：所有 Vitest 用例保持通过，确保行为不变

### 本次重构交付（专业级改造）

- 基线度量：新增 `docs/baseline.md`，生成 `docs/deps.json` 与 `perf.json`
- 结构优化：引入服务层 `src/services/kpi.ts`；新增按需加载图表 `src/features/admin/KpiChart.tsx`
- 公共工具：新增工作区包 `@gzh2xhs/utils`（LRU 与可取消请求）
- 质量规范：增加 `eslint-plugin-security` 与 `eslint-plugin-sonarjs`，修复阻断问题
- CI一致性：GitHub Actions 统一 Node 版本为 20 并记录构建时长

## 企业级改造要点（本次重构新增）

- **统一配置与校验**：`src/config/` 使用 `zod` 对环境变量进行强校验并提供类型化 `appConfig`
- **标准化请求验证**：API 路由采用 `zod` 校验请求体，错误统一 JSON 输出
- **速率限制**：在 `/api/generate` 与 `/api/export` 引入简单速率限制，防滥用与突发负载
- **结构化日志**：`src/lib/logger.ts` 输出结构化日志，便于后续接入日志平台
- **响应助手**：`src/lib/http.ts` 提供统一 `jsonOk/jsonError` 响应封装
- **基础测试**：引入 `Vitest` 并新增单元测试（配置解析、速率限制）

## Python 后端服务（FastAPI）

- 已引入 FastAPI 后端（目录 `pyapp/src/pyapp`），对齐并替换 `/api/*` 路由：`generate/export/finance/kpi/auth/data/logs/openapi`。
- 响应一致性：弱 ETag（`W/"<hash16>"`）与 `Cache-Control` 语义与 TS 版本一致；限流支持 Redis 优先、内存回退。
- 开发代理：Next.js 在开发模式下通过 `rewrites` 将 `/api/*` 代理到 `http://localhost:8000/api/*`。
- 运行方式：

```bash
cd pyapp
python -m venv .venv && source .venv/bin/activate
pip install -r pyapp/requirements.txt
PYTHONPATH=src uvicorn pyapp.main:app --port 8000 --reload
```

- 测试与覆盖率：`pytest --cov` 已配置，当前覆盖率≥90%；CI 已包含 Python 工作流（`.github/workflows/python-ci.yml`）。

### 重构前后对比说明

- 详见 `docs/refactor-python-migration.md`，包含端点映射、工具层对齐（弱 ETag / IP 提取）、异常与缓存语义的差异说明，以及性能和覆盖率总结。

### Flatted Python 模块重构（本次新增）

- 重构位置：`python/flatted_refactor/`（不改动第三方 `node_modules`）。
- 对外 API：`parse(value: str, *args, **kwargs)`、`stringify(value: Any, *args, **kwargs)` 与原实现等价。
- 代码改进：PEP 8、完整类型提示、文档字符串、统一异常封装，关键路径性能优化（索引与访问检测）。
- 基线版本：`python/baseline/flatted_baseline.py`（原始实现副本，用于对照测试与基准）。

运行测试与基准：

```bash
# 功能与兼容性测试
python3 python/tests/run_tests.py

# 错误用例测试
python3 python/tests/run_errors.py

# 性能基准（自引用/互引用/大规模共享字符串）
python3 python/benchmarks/bench_flatted.py
```

性能说明：脚本将分别对原版与重构版的 `stringify/parse` 进行耗时统计，并在终端打印对比数据。

## 快速开始

### 环境要求

- Node.js 16或更高版本
- npm 或 yarn

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd gzh2xhs
```

2. **安装依赖**

```bash
npm install
```

3. **安装Playwright浏览器** (emoji渲染必需)

```bash
npx playwright install chromium
```

4. **配置环境变量**
   创建 `.env.local` 文件：

```env
# 必需的API密钥
DEEPSEEK_API_KEY=your_deepseek_api_key_here
APICORE_AI_KEY=your_nanobanana_api_key_here

# 可选配置 (使用默认值时可省略)
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
NANOBANANA_API_URL=https://kg-api.cloud/v1/chat/completions

# 数据库配置 (如使用Turso数据库)
TURSO_DATABASE_URL=your_database_url_here
TURSO_AUTH_TOKEN=your_database_token_here
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 `http://localhost:3000` (或自动分配的端口) 开始使用。

## 使用方法

1. **输入文章内容**：在左侧文本框直接粘贴公众号文章内容
2. **选择AI模型**：选择DeepSeek或NanoBanana模型
3. **一键生成**：点击生成按钮，AI自动分析内容并生成卡片
4. **预览和下载**：预览生成结果，单张下载或批量导出
5. **复制文案**：使用自动生成的小红书爆款文案

## 架构说明

### 核心流程

```
文本内容 → AI模型选择 → AI分析 → SVG设计 → PNG渲染 → 卡片输出
```

### 关键组件 (重构后的模块化架构)

- `src/services/` - **AI服务层**：独立的DeepSeek和NanoBanana服务类
- `src/context/` - **状态管理**：React Context + Reducer模式
- `src/hooks/` - **业务逻辑**：useCardGeneration和useExport自定义钩子
- `src/components/` - **UI组件**：纯展示组件，职责单一
- `src/lib/image-converter.ts` - **图像渲染**：Playwright引擎
- `src/constants/` - **配置管理**：统一的常量和模板配置

### Emoji渲染解决方案

本项目使用**Playwright浏览器引擎**替代传统的Sharp库来解决emoji渲染问题：

- **问题**：Sharp库无法正确渲染Unicode emoji字符
- **解决**：使用Playwright Chromium引擎进行浏览器级渲染
- **效果**：emoji完美显示为彩色字符

技术方案说明：详见 [生成卡片prompt设计](./docs/生成卡片prompt设计.md) 与 [小红书设计分析](./docs/xiaohongshu-design-analysis.md)

### 企业级架构与路线图

- 总体架构与技术方案：[`docs/enterprise-architecture-plan.md`](./docs/enterprise-architecture-plan.md)
- 架构重构总决策：[`docs/refactor/ADR-001_架构重构总决策.md`](./docs/refactor/ADR-001_%E6%9E%B6%E6%9E%84%E9%87%8D%E6%9E%84%E6%80%BB%E5%86%B3%E7%AD%96.md)
- 灰度与回滚策略：[`docs/refactor/灰度与回滚策略.md`](./docs/refactor/%E7%81%B0%E5%BA%A6%E4%B8%8E%E5%9B%9E%E6%BB%9A%E7%AD%96%E7%95%A5.md)
- 安全加固执行手册：[`docs/security/安全加固执行手册.md`](./docs/security/%E5%AE%89%E5%85%A8%E5%8A%A0%E5%9B%BA%E6%89%A7%E8%A1%8C%E6%89%8B%E5%86%8C.md)
- 性能基线与压测指南：[`docs/perf-baseline.md`](./docs/perf-baseline.md)

## 部署说明

### Vercel部署

1. 推送代码到GitHub
2. 在Vercel中连接仓库
3. 配置环境变量 `DEEPSEEK_API_KEY`
4. 部署完成

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:18-alpine
RUN npx playwright install-deps chromium
# ... 其他配置
```

### 生产环境注意事项

- 确保服务器有足够内存运行Chromium浏览器
- 配置适当的超时时间
- 监控Playwright进程资源使用

## 开发指南

### 项目结构 (重构后)

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API路由
│   └── page.tsx      # 主页面 (含AppProvider)
├── services/         # AI服务层 (独立服务类)
├── features/         # 按领域划分的功能模块（如 card-generator）
├── hooks/            # 自定义业务逻辑Hook
├── context/          # React Context状态管理
├── components/       # UI组件 (纯展示)
├── shared/           # 共享层（components/lib/config/constants/types）
│   └── lib/          # 纯工具库（image-converter/rateLimiter/redis/cache 等）
├── lib/              # 兼容层（临时re-export，逐步迁移移除）
├── constants/        # 统一常量管理
└── types/           # 简化的TypeScript类型定义
docs/                # 技术文档
```

### 本地开发

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 代码检查
npm run test     # 运行单元测试（Vitest）
BENCH_URL=http://localhost:3000/api/generate BENCH_DURATION_MS=5000 BENCH_CONCURRENCY=4 node scripts/perf/basic-bench.mjs  # 压测基线
```

## 故障排查

### 常见问题

1. **Emoji显示异常**
    - 确认已安装Playwright Chromium: `npx playwright install chromium`

2. **AI API调用失败**
    - 检查 `DEEPSEEK_API_KEY` 和 `APICORE_AI_KEY` 环境变量配置
    - 确认API密钥有效且有足够配额
    - 检查API服务地址是否正确

3. **内存不足**
    - Playwright需要更多内存，考虑升级服务器配置
    - 建议至少2GB内存用于Chromium浏览器实例

4. **模型无响应**
    - 重构后不再有自动fallback，需手动切换模型
    - 检查具体的错误信息进行针对性排查

更多技术细节参考：[生成卡片prompt设计](./docs/生成卡片prompt设计.md)

## 贡献指南

1. Fork 项目
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

[MIT License](LICENSE)

## 更新日志

### v0.2.0 (2024-09-14) - 重构版本

- 🏗️ **架构重构**：模块化服务层，移除复杂fallback逻辑
- 🔧 **状态管理升级**：React Context + Custom Hooks替代Props drilling
- 🤖 **双AI支持**：独立的DeepSeek和NanoBanana服务
- 📝 **类型优化**：简化DesignJSON接口，移除冗余字段
- 📚 **文档完善**：更新架构说明和开发指南
- ⚡ **错误处理**：Fail-fast策略，更清晰的错误信息

### v0.1.0 (2024-09-12)

- 🚀 初始版本发布
- 🤖 集成DeepSeek AI分析
- 🎨 支持8种卡片设计风格
- 📱 优化移动端显示效果
- ✅ 使用Playwright解决emoji渲染问题

---

_如有问题或建议，欢迎提交Issue或联系开发团队_
