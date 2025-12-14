# 性能对比（Python 服务 vs 现有 Node/Next API）

- Python（FastAPI）本地基准：并发 16、请求 200 → `{ p50: ~36ms, p90: ~85ms, p95: ~108ms, p99: ~204ms }`
- Node/Next API：在当前开发环境下请求失败（`ok=0`），可能因缺少外部依赖或密钥导致。请在生产等效环境下运行基准以获得真实数据。

## 复现实验

### 启动 Python 服务

```bash
source pyapp/.venv/bin/activate
PYTHONPATH=pyapp/src uvicorn pyapp.main:app --port 8000 --reload
```

### 运行 Python 基准

```bash
source pyapp/.venv/bin/activate
PYTHONPATH=pyapp/src python pyapp/scripts/bench_generate.py
```

### 运行 Node 基准（原 API）

```bash
BENCH_URL=http://localhost:3000/api/generate BENCH_DURATION_MS=5000 BENCH_CONCURRENCY=16 node scripts/perf/basic-bench.mjs
```

## 说明
- 如需与生产等效对比，请在同一机器与相同并发下运行，关闭速率限制或启用旁路标头 `X-Bypass-RateLimit: 1`。
- 当原 API 涉及外部 AI 服务或 Redis 等依赖时，需要在 `.env` 中配置有效密钥与连接信息。
