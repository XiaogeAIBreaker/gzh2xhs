# 部署说明（TKE/Helm）

本目录包含 `api` 与 `web` 两个服务的 Helm Chart 骨架，适用于在腾讯云 TKE 部署。

## 使用

- 配置镜像仓库（TCR）与环境变量后，执行：
- `helm upgrade --install api ./helm/api -n prod`
- `helm upgrade --install web ./helm/web -n prod`

## 注意

- 目前为占位模板，需根据实际镜像、资源配额、ConfigMap/Secret 等进行完善。
- 端口：`api` 默认 `3001`，`web` 默认 `3000`。
