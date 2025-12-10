# 变更日志

## 未发布

- 目录重构：新增 shared 与 features 层级，迁移纯工具并保留兼容导出
- 代码规范：新增 Prettier/ESLint，提交钩子集成 lint-staged
- 类型强化：更严格 TS 选项，API 路由使用 Zod 推断
- 性能与缓存：Playwright 复用与并发限制；生成接口引入 TTL 缓存与缓存响应头
- 测试与 CI：新增缓存单元测试；CI 使用 Node 18/20 矩阵并上传覆盖率
