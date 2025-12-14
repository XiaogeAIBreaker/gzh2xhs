# 记录编号：0001 - 技术栈与架构分层

## 背景

前端为 Next.js 14 + React 18 + TypeScript，后端现为 Next.js API 路由与并行 FastAPI。需要统一栈并满足 DDD 与性能目标。

## 决策

后端采用 NestJS 10 + TypeORM（PostgreSQL），前端引入 Redux Toolkit + RTK Query；采用 DDD 分层与 REST/gRPC 混合架构；缓存统一 Redis/LRU。

## 状态

接受

## 影响

新增 `apps/api` 服务与工作空间；前端增加全局 store 与 API 客户端；CI/CD 增加 API 构建测试；容器化与编排更新。迁移按特性开关灰度进行。
