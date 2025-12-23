"""
性能监控和指标收集

实现性能监控系统：
- 性能指标收集
- 内存使用监控
- 响应时间统计
- 并发性能分析
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Callable, Union
import asyncio
import time
import psutil
import threading
from collections import defaultdict, deque
from contextlib import contextmanager
import statistics


@dataclass
class PerformanceMetrics:
    """性能指标"""
    name: str
    value: float
    unit: str
    timestamp: datetime
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RequestMetrics:
    """请求指标"""
    method: str
    endpoint: str
    status_code: int
    duration_ms: float
    timestamp: datetime
    user_id: Optional[str] = None
    request_size: int = 0
    response_size: int = 0
    error_message: Optional[str] = None


class MetricsCollector:
    """性能指标收集器"""
    
    def __init__(self, max_history: int = 10000) -> None:
        self.max_history = max_history
        self._metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_history))
        self._counters: Dict[str, float] = defaultdict(float)
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.RLock()
    
    def record_metric(self, metric: PerformanceMetrics) -> None:
        """记录性能指标"""
        with self._lock:
            self._metrics[metric.name].append(metric)
            
            # 更新计数器
            if metric.unit == "count":
                self._counters[metric.name] += metric.value
            
            # 更新仪表盘
            elif metric.unit in ["ms", "bytes", "num"]:
                self._gauges[metric.name] = metric.value
    
    def increment_counter(self, name: str, value: float = 1.0, tags: Dict[str, str] = None) -> None:
        """增加计数器"""
        metric = PerformanceMetrics(
            name=name,
            value=value,
            unit="count",
            timestamp=datetime.utcnow(),
            tags=tags or {},
        )
        self.record_metric(metric)
    
    def record_timing(self, name: str, duration_ms: float, tags: Dict[str, str] = None) -> None:
        """记录时间指标"""
        metric = PerformanceMetrics(
            name=name,
            value=duration_ms,
            unit="ms",
            timestamp=datetime.utcnow(),
            tags=tags or {},
        )
        self.record_metric(metric)
    
    def record_memory_usage(self, process_id: int = None) -> None:
        """记录内存使用情况"""
        if process_id is None:
            process = psutil.Process()
        else:
            process = psutil.Process(process_id)
        
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        
        # 记录内存使用量
        self.record_metric(PerformanceMetrics(
            name="memory_usage_bytes",
            value=memory_info.rss,
            unit="bytes",
            timestamp=datetime.utcnow(),
        ))
        
        # 记录内存百分比
        self.record_metric(PerformanceMetrics(
            name="memory_usage_percent",
            value=memory_percent,
            unit="percent",
            timestamp=datetime.utcnow(),
        ))
    
    def record_cpu_usage(self, process_id: int = None) -> None:
        """记录CPU使用情况"""
        if process_id is None:
            cpu_percent = psutil.cpu_percent(interval=0.1)
        else:
            process = psutil.Process(process_id)
            cpu_percent = process.cpu_percent()
        
        self.record_metric(PerformanceMetrics(
            name="cpu_usage_percent",
            value=cpu_percent,
            unit="percent",
            timestamp=datetime.utcnow(),
        ))
    
    def get_metrics(self, name: str, limit: int = 100) -> List[PerformanceMetrics]:
        """获取指定指标的历史记录"""
        with self._lock:
            return list(self._metrics[name])[-limit:]
    
    def get_counter(self, name: str) -> float:
        """获取计数器值"""
        return self._counters.get(name, 0.0)
    
    def get_gauge(self, name: str) -> Optional[float]:
        """获取仪表盘值"""
        return self._gauges.get(name)
    
    def get_statistics(self, name: str) -> Dict[str, float]:
        """获取指标统计信息"""
        metrics = self.get_metrics(name)
        if not metrics:
            return {}
        
        values = [m.value for m in metrics]
        
        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "p95": self._percentile(values, 95),
            "p99": self._percentile(values, 99),
            "stdev": statistics.stdev(values) if len(values) > 1 else 0.0,
        }
    
    def _percentile(self, values: List[float], percentile: float) -> float:
        """计算百分位数"""
        if not values:
            return 0.0
        
        sorted_values = sorted(values)
        index = (percentile / 100.0) * (len(sorted_values) - 1)
        
        if index.is_integer():
            return sorted_values[int(index)]
        else:
            lower_index = int(index)
            upper_index = lower_index + 1
            weight = index - lower_index
            return sorted_values[lower_index] * (1 - weight) + sorted_values[upper_index] * weight
    
    def clear_metrics(self, name: str = None) -> None:
        """清空指标"""
        with self._lock:
            if name:
                self._metrics[name].clear()
                self._counters.pop(name, None)
                self._gauges.pop(name, None)
            else:
                self._metrics.clear()
                self._counters.clear()
                self._gauges.clear()


class RequestProfiler:
    """请求性能分析器"""
    
    def __init__(self, metrics_collector: MetricsCollector) -> None:
        self.metrics_collector = metrics_collector
        self.active_requests: Dict[str, RequestMetrics] = {}
    
    def start_request(
        self,
        request_id: str,
        method: str,
        endpoint: str,
        user_id: str = None,
        request_size: int = 0,
    ) -> None:
        """开始请求分析"""
        self.active_requests[request_id] = RequestMetrics(
            method=method,
            endpoint=endpoint,
            status_code=0,  # 尚未完成
            duration_ms=0.0,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            request_size=request_size,
        )
    
    def finish_request(
        self,
        request_id: str,
        status_code: int,
        response_size: int = 0,
        error_message: str = None,
    ) -> None:
        """完成请求分析"""
        if request_id not in self.active_requests:
            return
        
        request_metrics = self.active_requests[request_id]
        request_metrics.status_code = status_code
        request_metrics.response_size = response_size
        request_metrics.error_message = error_message
        
        # 计算持续时间
        duration_ms = (datetime.utcnow() - request_metrics.timestamp).total_seconds() * 1000
        request_metrics.duration_ms = duration_ms
        
        # 记录指标
        self.metrics_collector.record_timing(
            "request_duration_ms",
            duration_ms,
            tags={
                "method": request_metrics.method,
                "endpoint": request_metrics.endpoint,
                "status_code": str(status_code),
            }
        )
        
        # 记录响应大小
        if response_size > 0:
            self.metrics_collector.record_metric(PerformanceMetrics(
                name="response_size_bytes",
                value=response_size,
                unit="bytes",
                timestamp=datetime.utcnow(),
                tags={
                    "method": request_metrics.method,
                    "endpoint": request_metrics.endpoint,
                }
            ))
        
        # 记录错误
        if error_message:
            self.metrics_collector.increment_counter(
                "request_errors_total",
                tags={
                    "method": request_metrics.method,
                    "endpoint": request_metrics.endpoint,
                    "error_type": "application_error",
                }
            )
        
        # 记录成功请求
        if 200 <= status_code < 300:
            self.metrics_collector.increment_counter(
                "request_success_total",
                tags={
                    "method": request_metrics.method,
                    "endpoint": request_metrics.endpoint,
                }
            )
        
        # 从活动请求中移除
        del self.active_requests[request_id]
    
    def get_active_request_count(self) -> int:
        """获取当前活动请求数"""
        return len(self.active_requests)
    
    def get_active_requests(self) -> List[RequestMetrics]:
        """获取当前活动请求"""
        return list(self.active_requests.values())


@contextmanager
def performance_timer(
    metrics_collector: MetricsCollector,
    operation_name: str,
    tags: Dict[str, str] = None,
):
    """性能计时上下文管理器"""
    start_time = time.time()
    
    try:
        yield
    finally:
        duration_ms = (time.time() - start_time) * 1000
        metrics_collector.record_timing(operation_name, duration_ms, tags)


class AsyncPerformanceTimer:
    """异步性能计时器"""
    
    def __init__(
        self,
        metrics_collector: MetricsCollector,
        operation_name: str,
        tags: Dict[str, str] = None,
    ) -> None:
        self.metrics_collector = metrics_collector
        self.operation_name = operation_name
        self.tags = tags or {}
        self.start_time: Optional[float] = None
    
    async def __aenter__(self) -> AsyncPerformanceTimer:
        """异步上下文管理器入口"""
        self.start_time = time.time()
        return self
    
    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """异步上下文管理器出口"""
        if self.start_time:
            duration_ms = (time.time() - self.start_time) * 1000
            self.metrics_collector.record_timing(
                self.operation_name,
                duration_ms,
                self.tags
            )


class ResourceMonitor:
    """资源监控器"""
    
    def __init__(
        self,
        metrics_collector: MetricsCollector,
        interval_seconds: float = 5.0,
    ) -> None:
        self.metrics_collector = metrics_collector
        self.interval_seconds = interval_seconds
        self._monitoring = False
        self._monitor_task: Optional[asyncio.Task] = None
    
    async def start_monitoring(self) -> None:
        """开始监控"""
        if self._monitoring:
            return
        
        self._monitoring = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
    
    async def stop_monitoring(self) -> None:
        """停止监控"""
        self._monitoring = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
    
    async def _monitor_loop(self) -> None:
        """监控循环"""
        while self._monitoring:
            try:
                # 记录系统资源使用情况
                self.metrics_collector.record_cpu_usage()
                self.metrics_collector.record_memory_usage()
                
                # 记录系统负载
                load_avg = psutil.getloadavg()
                self.metrics_collector.record_metric(PerformanceMetrics(
                    name="system_load_avg_1m",
                    value=load_avg[0],
                    unit="load",
                    timestamp=datetime.utcnow(),
                ))
                
                self.metrics_collector.record_metric(PerformanceMetrics(
                    name="system_load_avg_5m",
                    value=load_avg[1],
                    unit="load",
                    timestamp=datetime.utcnow(),
                ))
                
                self.metrics_collector.record_metric(PerformanceMetrics(
                    name="system_load_avg_15m",
                    value=load_avg[2],
                    unit="load",
                    timestamp=datetime.utcnow(),
                ))
                
                # 记录磁盘使用情况
                disk_usage = psutil.disk_usage('/')
                self.metrics_collector.record_metric(PerformanceMetrics(
                    name="disk_usage_percent",
                    value=disk_usage.percent,
                    unit="percent",
                    timestamp=datetime.utcnow(),
                ))
                
                # 记录网络统计
                network_io = psutil.net_io_counters()
                if network_io:
                    self.metrics_collector.record_metric(PerformanceMetrics(
                        name="network_bytes_sent",
                        value=network_io.bytes_sent,
                        unit="bytes",
                        timestamp=datetime.utcnow(),
                    ))
                    
                    self.metrics_collector.record_metric(PerformanceMetrics(
                        name="network_bytes_recv",
                        value=network_io.bytes_recv,
                        unit="bytes",
                        timestamp=datetime.utcnow(),
                    ))
                
                await asyncio.sleep(self.interval_seconds)
                
            except Exception as e:
                # 记录监控错误，但不中断监控
                self.metrics_collector.increment_counter("monitoring_errors_total")
                await asyncio.sleep(self.interval_seconds)


class PerformanceBenchmark:
    """性能基准测试"""
    
    def __init__(self, metrics_collector: MetricsCollector) -> None:
        self.metrics_collector = metrics_collector
        self.benchmark_results: Dict[str, Dict[str, Any]] = {}
    
    def run_benchmark(
        self,
        name: str,
        func: Callable,
        iterations: int = 100,
        warmup_iterations: int = 10,
        *args,
        **kwargs,
    ) -> Dict[str, Any]:
        """运行性能基准测试"""
        import gc
        
        # 预热
        for _ in range(warmup_iterations):
            func(*args, **kwargs)
        
        # 清理内存
        gc.collect()
        
        # 正式测试
        execution_times = []
        memory_before = psutil.Process().memory_info().rss
        
        for _ in range(iterations):
            start_time = time.time()
            func(*args, **kwargs)
            end_time = time.time()
            
            execution_times.append((end_time - start_time) * 1000)  # 转换为毫秒
        
        memory_after = psutil.Process().memory_info().rss
        
        # 计算统计信息
        results = {
            "iterations": iterations,
            "warmup_iterations": warmup_iterations,
            "total_time_ms": sum(execution_times),
            "avg_time_ms": statistics.mean(execution_times),
            "min_time_ms": min(execution_times),
            "max_time_ms": max(execution_times),
            "median_time_ms": statistics.median(execution_times),
            "p95_time_ms": self._percentile(execution_times, 95),
            "p99_time_ms": self._percentile(execution_times, 99),
            "stdev_time_ms": statistics.stdev(execution_times) if len(execution_times) > 1 else 0.0,
            "memory_delta_bytes": memory_after - memory_before,
            "throughput_per_sec": iterations / (sum(execution_times) / 1000.0),
        }
        
        self.benchmark_results[name] = results
        
        # 记录指标
        self.metrics_collector.record_metric(PerformanceMetrics(
            name=f"benchmark_{name}_avg_time_ms",
            value=results["avg_time_ms"],
            unit="ms",
            timestamp=datetime.utcnow(),
        ))
        
        self.metrics_collector.record_metric(PerformanceMetrics(
            name=f"benchmark_{name}_throughput_per_sec",
            value=results["throughput_per_sec"],
            unit="num",
            timestamp=datetime.utcnow(),
        ))
        
        return results
    
    def _percentile(self, values: List[float], percentile: float) -> float:
        """计算百分位数"""
        if not values:
            return 0.0
        
        sorted_values = sorted(values)
        index = (percentile / 100.0) * (len(sorted_values) - 1)
        
        if index.is_integer():
            return sorted_values[int(index)]
        else:
            lower_index = int(index)
            upper_index = lower_index + 1
            weight = index - lower_index
            return sorted_values[lower_index] * (1 - weight) + sorted_values[upper_index] * weight
    
    def compare_benchmarks(self, name1: str, name2: str) -> Dict[str, Any]:
        """比较两个基准测试结果"""
        if name1 not in self.benchmark_results or name2 not in self.benchmark_results:
            raise ValueError("基准测试结果不存在")
        
        result1 = self.benchmark_results[name1]
        result2 = self.benchmark_results[name2]
        
        return {
            "name1": name1,
            "name2": name2,
            "avg_time_comparison": {
                "faster": name1 if result1["avg_time_ms"] < result2["avg_time_ms"] else name2,
                "speedup_factor": result2["avg_time_ms"] / result1["avg_time_ms"] if name1 == name1 else result1["avg_time_ms"] / result2["avg_time_ms"],
                "time_diff_ms": abs(result1["avg_time_ms"] - result2["avg_time_ms"]),
            },
            "throughput_comparison": {
                "higher": name1 if result1["throughput_per_sec"] > result2["throughput_per_sec"] else name2,
                "throughput_diff": abs(result1["throughput_per_sec"] - result2["throughput_per_sec"]),
            },
        }


# 全局指标收集器实例
_global_metrics_collector = MetricsCollector()
_global_profiler = RequestProfiler(_global_metrics_collector)
_global_benchmark = PerformanceBenchmark(_global_metrics_collector)


def get_global_metrics_collector() -> MetricsCollector:
    """获取全局指标收集器"""
    return _global_metrics_collector


def get_global_profiler() -> RequestProfiler:
    """获取全局请求分析器"""
    return _global_profiler


def get_global_benchmark() -> PerformanceBenchmark:
    """获取全局性能基准测试器"""
    return _global_benchmark


# 便捷装饰器
def benchmark(
    name: str = None,
    iterations: int = 100,
    record_metrics: bool = True,
):
    """性能基准测试装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            benchmark_name = name or f"{func.__module__}.{func.__name__}"
            
            if record_metrics:
                return get_global_benchmark().run_benchmark(
                    benchmark_name,
                    func,
                    iterations,
                    *args,
                    **kwargs
                )
            else:
                # 直接运行，不记录指标
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def measure_performance(
    operation_name: str,
    tags: Dict[str, str] = None,
):
    """性能测量装饰器"""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            async with AsyncPerformanceTimer(
                get_global_metrics_collector(),
                operation_name,
                tags,
            ):
                return await func(*args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            with performance_timer(
                get_global_metrics_collector(),
                operation_name,
                tags,
            ):
                return func(*args, **kwargs)
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator