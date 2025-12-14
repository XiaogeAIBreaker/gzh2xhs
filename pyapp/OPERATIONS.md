# 运行与运维

## 启动

- 开发：`PYTHONPATH=pyapp/src uvicorn pyapp.main:app --reload --port 8000`
- 生产：`gunicorn -k uvicorn.workers.UvicornWorker -w 4 pyapp.main:app -b 0.0.0.0:8000`

## 配置

- 环境变量前缀：`PYAPP_`（如 `PYAPP_RATE_LIMIT_PER_MINUTE`、`PYAPP_MAX_CONCURRENCY`）
- 前端切换：`NEXT_PUBLIC_API_BASE_URL` 指向 Python 服务。

## 监控

- 指标：可接入 `prometheus_client` 暴露 `/metrics`（待接入）。
- 日志：结构化 JSON，包含 `X-Request-Id`；建议集中日志。

## 安全

- CORS 已启用；生产请置具体域名列表。
- 错误不泄露敏感信息；详细栈在 `environment=development` 时开启。

## 回滚

- 保留 Next.js 原 API 路由不变，前端通过环境变量在两者间切换。
- 回滚步骤：将 `NEXT_PUBLIC_API_BASE_URL` 置空或指向旧服务地址，验证关键路径后切换流量。

## 部署建议

- 容器化：提供 `Dockerfile`（待添加）并使用健康检查。
- 资源：根据并发/限流参数进行 CPU 与内存配额评估。
