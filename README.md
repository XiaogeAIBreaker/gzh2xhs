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

## 企业级改造要点（本次重构新增）

- **统一配置与校验**：`src/config/` 使用 `zod` 对环境变量进行强校验并提供类型化 `appConfig`
- **标准化请求验证**：API 路由采用 `zod` 校验请求体，错误统一 JSON 输出
- **速率限制**：在 `/api/generate` 与 `/api/export` 引入简单速率限制，防滥用与突发负载
- **结构化日志**：`src/lib/logger.ts` 输出结构化日志，便于后续接入日志平台
- **响应助手**：`src/lib/http.ts` 提供统一 `jsonOk/jsonError` 响应封装
- **基础测试**：引入 `Vitest` 并新增单元测试（配置解析、速率限制）

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
├── hooks/            # 自定义业务逻辑Hook
├── context/          # React Context状态管理
├── components/       # UI组件 (纯展示)
├── lib/              # 核心工具库
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

*如有问题或建议，欢迎提交Issue或联系开发团队*
