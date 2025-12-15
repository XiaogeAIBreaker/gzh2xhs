# 变更日志

## 未发布

- 目录重构：新增 shared 与 features 层级，迁移纯工具并保留兼容导出
- 代码规范：新增 Prettier/ESLint，提交钩子集成 lint-staged
- 类型强化：更严格 TS 选项，API 路由使用 Zod 推断
- 性能与缓存：Playwright 复用与并发限制；生成接口引入 TTL 缓存与缓存响应头
- 测试与 CI：新增缓存单元测试；CI 使用 Node 18/20 矩阵并上传覆盖率
- 依赖治理：修复 `src/context/AppContext.tsx` 与 `src/context/selectors.ts` 的循环依赖
- 覆盖率配置：将全局阈值调整为 90%，并收敛覆盖采样范围以匹配核心模块
- Python 流水线：在 CI 中新增 Python（Poetry）测试与覆盖率作业，并上传性能基准
