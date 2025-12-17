# 性能对比报告（Python 版）

## 方法与环境

- 服务：`uvicorn pyapp.main:app --reload`（开发模式）
- 压测脚本：`pyapp/scripts/bench_generate.py`
- 场景：`/api/generate`，总请求 `200`，并发 `16`，禁用限流（`X-Bypass-RateLimit: 1`）

## 最新结果

```json
{
    "count": 200,
    "p50_ms": 91.99,
    "p90_ms": 276.83,
    "p95_ms": 319.92,
    "p99_ms": 629.26
}
```

说明：开发模式开启热重载与调试，存在额外开销；建议在关闭 `--reload` 的生产配置下复采以获得稳定对比。

## 指标含义

- `p50/p90/p95/p99`：响应时间分位数（毫秒）
- `count`：样本数量

## 优化建议

- 关闭调试与热重载；开启 `uvicorn --workers` 多进程（按 CPU 配置）
- 命中率更高的结果缓存（`pyapp/shared/cache.py`），降低重复生成开销
- 使用 Redis 作为限流/缓存后端以支持多实例与更稳定的窗口统计
- 针对外部调用（如 AI/IO）增加超时与重试，隔离抖动
