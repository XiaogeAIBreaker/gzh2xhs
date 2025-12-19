import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 配置
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // 升温：30秒内升至20并发
    { duration: '1m', target: 20 },  // 稳定：保持20并发运行1分钟
    { duration: '10s', target: 0 },  // 降温：10秒内降至0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% 请求需在 2s 内完成
    http_req_failed: ['rate<0.01'],    // 错误率 < 1%
  },
};

const BASE_URL = __ENV.BENCH_URL || 'http://localhost:3000/api';

export default function () {
  // 测试生成接口 (Mock 数据，实际需 AI Key)
  const payload = JSON.stringify({
    text: '测试文本内容，用于性能基准测试。',
    model: 'deepseek',
    style: 'standard',
    size: '1:1',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/generate`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has cards': (r) => r.json('cards') && r.json('cards').length > 0,
  });

  sleep(1);
}
