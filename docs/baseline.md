# 基线度量报告

## 复杂度与依赖

- 依赖巡检导出：`docs/deps.json`（由 `npm run dep:json` 生成）
- 禁止循环依赖与分层约束已启用（`dependency-cruiser.config.cjs`）

## 构建时间（初始）

- 前端构建：待在 CI 中记录 3 次平均值
- API 构建：待在 CI 中记录 3 次平均值

## 运行时性能（初始）

- 压测脚本：`scripts/perf/basic-bench.mjs`
- 最近一次输出：`perf.json`

## 结论

- 基线已建立，后续每次重构合入均需更新本报告并对比三项指标。
