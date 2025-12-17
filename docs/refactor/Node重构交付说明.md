# Node 重构交付说明

## 范围
- 架构模块化：共享包（config/logger/errors/validation/http/types）建立与接入。
- NestJS 集成：全局异常过滤器、统一日志、严格类型检查。
- Koa 集成：统一错误响应结构与日志字段，保留原路由。
- 测试：新增共享包单元测试与集成测试执行，覆盖率维持既有阈值。

## 兼容性
- 保持原有接口路径与输入输出不变；新增字段均为可选且有默认值。
- 如后续将 Koa 路由迁入 Nest，将提供适配层与映射表，并保留旧路径至少两个版本周期。

## 使用
- 构建共享包：`npm run build:shared`
- 构建 Nest API：`npm run build --workspace apps/api`
- 构建 Koa API：`npm run build --workspace apps/node-api`
- 运行测试：`npm run test`

## 变更点
- 统一错误体：`{ code, message, requestId }`；日志字段：`rid, status, duration_ms, actor, action`。
- TypeScript 路径映射支持本地工作区构建与开发（dev→src，build→dist）。

## 迁移建议
- 若外部依赖旧错误体，请容忍新增 `requestId` 字段；不影响解析。
- 部署时先构建共享包与 `apps/api`；`apps/node-api` 构建需确保依赖安装完整。

## 回归
- `vitest` 测试已跑通大部分现有用例；少量 `apps/api/test/*.js` 需更新为 TS 引入路径。

## 后续
- 引入 `nest-pino` 与 `koa-compress` 进一步优化性能与日志采集。
