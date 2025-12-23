# Docker多阶段构建文件
FROM python:3.11-slim as builder

# 设置构建参数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# 设置标签
LABEL maintainer="重构团队 <refactor@gzh2xhs.com>"
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.name="gzh2xhs-refactor"
LABEL org.label-schema.description="重构版公众号转小红书卡片生成器"
LABEL org.label-schema.url="https://github.com/gzh2xhs/refactor-python"
LABEL org.label-schema.vcs-ref=$VCS_REF
LABEL org.label-schema.vcs-url="https://github.com/gzh2xhs/refactor-python"
LABEL org.label-schema.version=$VERSION

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY pyproject.toml requirements.txt* ./

# 创建虚拟环境并安装Python依赖
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip setuptools wheel
RUN pip install -r requirements.txt

# 生产阶段
FROM python:3.11-slim as production

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    libpq5 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libwayland-cursor0 \
    libwayland-egl1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制虚拟环境
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 复制应用代码
COPY --chown=appuser:appuser . .

# 设置权限
RUN chmod +x scripts/start.sh
RUN chown -R appuser:appuser /app

# 切换到非root用户
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 暴露端口
EXPOSE 8000

# 设置环境变量
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["scripts/start.sh"]

# 开发阶段
FROM production as development

# 切换回root用户安装开发工具
USER root
RUN apt-get update && apt-get install -y \
    vim \
    htop \
    && rm -rf /var/lib/apt/lists/*

# 安装开发依赖
COPY pyproject.toml requirements.txt* ./
RUN pip install -e ".[dev,docs,perf]"

# 切换回appuser
USER appuser

# 开发环境默认命令
CMD ["uvicorn", "gzh2xhs_refactor.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]