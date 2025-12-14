# 验收清单与度量

## 质量门禁
- Lint 全绿（ESLint 加强规则）
- 类型检查无误（tsconfig 严格选项）
- 依赖巡检：循环依赖为 0

## 测试
- 覆盖率阈值：lines≥95%、statements≥95%、branches≥84%、functions≥85%
- 单元：ETag 与并发栅栏通过
- 集成：缓存 TTL 与限流窗口通过

## 性能与稳态
- 生成接口 P95 时延降低 ≥30%
- 缓存命中率 ≥60%
- 错误率 ≤0.1%

## 文档
- 架构图、ADR、OpenAPI 响应头完善

> 运行脚本：CI 中执行 `npm run test:coverage` 与 `node scripts/bench.ts`，并人工核对本清单。
