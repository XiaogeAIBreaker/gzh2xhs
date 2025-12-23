# Makefile for Python Refactoring Project
# 提供统一的开发、测试、构建命令

.PHONY: help install install-dev test test-cov lint format type-check security clean build docs serve

# 默认目标
help:
	@echo "🚀 Python重构项目 - 可用命令:"
	@echo ""
	@echo "📦 安装相关:"
	@echo "  install      - 安装生产依赖"
	@echo "  install-dev  - 安装开发依赖"
	@echo "  install-all  - 安装所有依赖"
	@echo ""
	@echo "🧪 测试相关:"
	@echo "  test         - 运行单元测试"
	@echo "  test-cov     - 运行测试并生成覆盖率报告"
	@echo "  test-integration - 运行集成测试"
	@echo "  test-performance - 运行性能测试"
	@echo "  test-all     - 运行所有测试"
	@echo ""
	@echo "🔍 代码质量:"
	@echo "  lint         - 运行代码检查"
	@echo "  format       - 格式化代码"
	@echo "  type-check   - 运行类型检查"
	@echo "  security     - 运行安全扫描"
	@echo "  quality      - 运行所有质量检查"
	@echo ""
	@echo "📊 性能分析:"
	@echo "  profile      - 运行性能分析"
	@echo "  benchmark    - 运行基准测试"
	@echo "  memory       - 内存使用分析"
	@echo ""
	@echo "🔧 开发工具:"
	@echo "  clean        - 清理临时文件"
	@echo "  build        - 构建项目"
	@echo "  docs         - 生成文档"
	@echo "  serve-docs   - 启动文档服务器"
	@echo "  run-dev      - 启动开发服务器"
	@echo ""
	@echo "🚀 部署相关:"
	@echo "  docker-build - 构建Docker镜像"
	@echo "  docker-run   - 运行Docker容器"
	@echo "  deploy       - 部署到生产环境"

# 安装相关
install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements.txt
	pip install -e ".[dev]"

install-all:
	pip install -r requirements.txt
	pip install -e ".[dev,docs,perf]"

# 测试相关
test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=gzh2xhs_refactor --cov-report=term-missing --cov-report=html --cov-report=xml

test-integration:
	pytest tests/integration/ -v

test-performance:
	pytest tests/performance/ -v --benchmark-only

test-all:
	pytest tests/ --cov=gzh2xhs_refactor --cov-report=term-missing

# 代码质量检查
lint:
	ruff check src/ tests/
	flake8 src/ tests/
	pylint src/gzh2xhs_refactor/

format:
	ruff format src/ tests/
	black src/ tests/
	isort src/ tests/

type-check:
	mypy src/

security:
	bandit -r src/
	safety check

quality: format lint type-check security
	@echo "✅ 所有质量检查通过"

# 性能分析
profile:
	python -m cProfile -o profile_output.prof -m pytest tests/ --benchmark-only
	python -c "import pstats; pstats.Stats('profile_output.prof').sort_stats('cumulative').print_stats(20)"

benchmark:
	python scripts/benchmark.py

memory:
	python -m memory_profiler scripts/benchmark.py

# 开发工具
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .coverage htmlcov/ .pytest_cache/ .mypy_cache/
	rm -rf dist/ build/ *.egg-info/
	find . -type f -name ".DS_Store" -delete

build: clean
	python -m build

docs:
	cd docs && make html

serve-docs:
	cd docs/_build/html && python -m http.server 8000

run-dev:
	uvicorn src.gzh2xhs_refactor.main:app --reload --host 0.0.0.0 --port 8000

# Docker相关
docker-build:
	docker build -t gzh2xhs-refactor:latest .

docker-run:
	docker run -p 8000:8000 gzh2xhs-refactor:latest

# 部署
deploy:
	@echo "部署到生产环境..."
	@echo "请配置具体的部署脚本"

# CI/CD流水线
ci: clean install-dev test-cov lint type-check security
	@echo "✅ CI检查全部通过"

# 预提交检查
pre-commit: format lint type-check
	@echo "✅ 预提交检查通过"