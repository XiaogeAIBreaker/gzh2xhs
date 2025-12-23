import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// 自定义指标
export const errorRate = new Rate('errors')

// 测试配置
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // 预热阶段
    { duration: '5m', target: 50 },   // 负载测试
    { duration: '2m', target: 100 },  // 压力测试
    { duration: '5m', target: 50 },   // 回到负载
    { duration: '2m', target: 0 },    // 恢复到零
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],     // 95% 请求 < 200ms
    http_req_failed: ['rate<0.05'],       // 错误率 < 5%
    errors: ['rate<0.1'],                 // 自定义错误率 < 10%
  },
}

// API 基础 URL
const BASE_URL = __ENV.API_URL || 'http://localhost:3001'

// 测试数据
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
]

// 获取随机测试用户
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)]
}

// 认证相关测试
export function authTests() {
  const user = getRandomUser()

  // 用户注册测试
  const registerPayload = {
    email: `perf_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Performance Test User',
  }

  const registerResponse = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(registerPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const registerCheck = check(registerResponse, {
    'register status is 201': (r) => r.status === 201,
    'register response time < 500ms': (r) => r.timings.duration < 500,
  })

  errorRate.add(!registerCheck)

  sleep(1)

  // 用户登录测试
  const loginPayload = {
    email: user.email,
    password: user.password,
  }

  const loginResponse = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const loginCheck = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 300ms': (r) => r.timings.duration < 300,
    'login returns token': (r) => r.json('access_token') !== '',
  })

  errorRate.add(!loginCheck)

  let authToken = ''
  if (loginCheck) {
    authToken = loginResponse.json('access_token')
  }

  sleep(1)

  // 获取用户信息测试
  if (authToken) {
    const meResponse = http.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    })

    const meCheck = check(meResponse, {
      'me status is 200': (r) => r.status === 200,
      'me response time < 200ms': (r) => r.timings.duration < 200,
    })

    errorRate.add(!meCheck)
  }

  sleep(2)
}

// 健康检查测试
export function healthTests() {
  const response = http.get(`${BASE_URL}/health`)

  check(response, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
    'health returns status ok': (r) => r.json('status') === 'ok',
  })
}

// 生成功能测试
export function generateTests() {
  const user = getRandomUser()

  // 先登录获取token
  const loginPayload = {
    email: user.email,
    password: user.password,
  }

  const loginResponse = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )

  let authToken = ''
  if (loginResponse.status === 200) {
    authToken = loginResponse.json('access_token')
  }

  // 生成功能测试
  const generatePayload = {
    content: 'Test content for performance testing',
    style: 'default',
  }

  const generateResponse = http.post(
    `${BASE_URL}/generate`,
    JSON.stringify(generatePayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
      },
    }
  )

  check(generateResponse, {
    'generate status is 200 or 202': (r) => [200, 202].includes(r.status),
    'generate response time < 5s': (r) => r.timings.duration < 5000,
  })

  sleep(3)
}

// 并发测试
export function concurrentTests() {
  const responses = http.batch([
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/health`],
  ])

  responses.forEach((response, index) => {
    check(response, {
      [`concurrent health ${index} status is 200`]: (r) => r.status === 200,
      [`concurrent health ${index} response time < 200ms`]: (r) => r.timings.duration < 200,
    })
  })

  sleep(1)
}

// 主要测试场景
export default function () {
  // 并行运行多个测试
  const scenarios = [authTests, healthTests, generateTests, concurrentTests]
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  
  scenario()
  
  // 随机等待时间，模拟真实用户行为
  sleep(Math.random() * 3 + 1)
}

// 清理函数
export function teardown(data) {
  console.log('Performance test completed')
  console.log(`Total errors: ${errorRate.values}`)
}