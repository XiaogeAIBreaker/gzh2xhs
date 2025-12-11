# 性能基准测试指南

- 运行条件：本地或 CI 环境可访问目标 URL，且必要的环境变量已配置（如 `DEEPSEEK_API_KEY`）。
- 命令示例：
    - `BENCH_URL=http://localhost:3000/api/generate BENCH_DURATION_MS=5000 BENCH_CONCURRENCY=4 node scripts/perf/basic-bench.mjs`
- 输出：JSON 行包含 `p50/p90/p95/p99`、`avg`、`ok/fail` 等关键指标。
- 建议：在 `staging` 与 `prod` 环境分别运行并记录结果，作为性能优化前后对比的依据。
