# 重构迁移计划 (Phased Migration Plan)

本计划旨在 4-6 周内完成 gzh2xhs 项目的全面重构，涵盖结构、质量、架构、性能与文档五个维度。每阶段周期约 2 周。

## 阶段一：结构标准化与质量基线 (Week 1-2)

**目标**：消除技术债务，统一规范，建立可度量的质量门禁。

### 1. 代码结构优化
- [x] **Monorepo 落地**：确立 `apps/` 与 `packages/` 边界（已完成）。
- [ ] **功能优先重组**：将前端 `src/components` 中耦合业务的组件迁移至 `src/features/*`。
- [ ] **孤儿清理**：移除 `dep-cruise` 报告中的未引用文件（如 `src/components/NeonHeading.tsx` 等）。
- [ ] **DI 容器**：在 Fastify/Nest 中完善依赖注入；前端引入 `Context` 或轻量状态管理（Zustand/Jotai）替代 Props Drilling（已部分完成）。

### 2. 代码质量提升
- [x] **Lint/Format**：ESLint (SonarJS/Security) + Prettier + Husky（已完成）。
- [x] **TypeScript**：启用 `strict: true`（已完成）。
- [ ] **Code Review**：推广 `docs/代码审查检查清单.md`。
- [ ] **SonarQube**：在 CI 中集成 SonarQube Scanner（GitHub Actions 已配置，需配置 Token）。

### 3. 文档完善
- [ ] **API 文档**：确保 Swagger 覆盖所有路由。
- [ ] **JSDoc**：核心 Service/Utils 100% JSDoc 覆盖。
- [ ] **CHANGELOG**：建立 `CHANGELOG.md` 并遵循 Keep a Changelog 规范。
- [ ] **ADR**：记录架构决策（已开始）。

## 阶段二：架构升级与性能优化 (Week 3-4)

**目标**：提升系统吞吐量，降低延迟，确保高可用与可观测性。

### 1. 技术架构升级
- [x] **React 18**：全面使用 Server Components (RSC) 优化首屏（Next.js App Router）。
- [ ] **Testing**：
    - Unit: Vitest 覆盖率 ≥ 80%（已配置）。
    - E2E: Playwright 覆盖核心流程（生成->导出）。
- [ ] **CI/CD**：优化 GitHub Actions 缓存，缩短构建时间。

### 2. 性能优化
- [ ] **基准测试**：引入 `k6` 进行负载测试，建立性能基线（QPS/P99）。
- [ ] **Lighthouse**：CI 集成 Lighthouse CI 监控 Web Vitals。
- [ ] **Code Splitting**：分析 Bundle Size，对大组件（如编辑器/图表）实施 Lazy Load。
- [ ] **API 优化**：Redis 缓存策略细化（Stale-While-Revalidate）。

## 阶段三：回滚、灾备与交付 (Week 5-6)

**目标**：确保发布安全，交付完整资产。

### 1. 发布策略
- [ ] **特性开关**：完善 `src/config/featureFlags.ts`，支持按用户/流量灰度。
- [ ] **回滚方案**：制定数据库迁移回滚脚本与 Docker 镜像回滚流程。
- [ ] **灾备预案**：Redis/DB 故障时的降级策略（本地缓存/静态兜底）。

### 2. 交付物产出
- [ ] **C4 架构图**：Context/Container/Component 视图。
- [ ] **性能报告**：重构前后 k6 与 Lighthouse 对比报告。
- [ ] **测试报告**：覆盖率与 E2E 通过率报告。

## 风险控制
- **回滚**：每次发布前 Tag，CI 支持手动触发回滚 Deploy。
- **兼容性**：保持 API v1 兼容，v2 逐步灰度。
