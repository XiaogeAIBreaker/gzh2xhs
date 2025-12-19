# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **API**: 新增 `api-fastify` 服务与 `services/repos` 分层骨架。
- **Docs**: C4 架构图 (`docs/architecture/c4.md`)。
- **Docs**: 重构迁移计划 (`docs/refactor/plan.md`)。
- **Perf**: k6 基准测试脚本 (`scripts/perf/k6-bench.js`)。
- **CI**: GitHub Actions 集成 SonarQube 与 Python 覆盖率上传。

### Changed
- **Lint**: ESLint 规则收紧（函数行数≤50），启用 JSDoc 校验。
- **Test**: Vitest 覆盖率提供商切换为 `istanbul`，阈值设定为 80%。
- **Deps**: 锁定所有生产依赖为次要版本 (`~`)，Node 引擎锁定 v18。
- **Git**: 引入 Conventional Commits 与 Husky 钩子。

### Fixed
- **Process**: Fastify/Nest 增加 `unhandledRejection` 与 `uncaughtException` 进程级错误捕获。

## [0.2.0] - 2024-09-14

### Added
- **AI**: 双 AI 模型支持 (DeepSeek/NanoBanana)。
- **UI**: 8 种卡片设计风格与移动端适配。
- **Core**: Playwright 替代 Sharp 解决 Emoji 渲染问题。

### Changed
- **Refactor**: 模块化服务层，移除复杂 fallback 逻辑。
- **State**: React Context + Hooks 替代 Props Drilling。

## [0.1.0] - 2024-09-12

### Added
- 初始版本发布。
- 基础卡片生成功能。
