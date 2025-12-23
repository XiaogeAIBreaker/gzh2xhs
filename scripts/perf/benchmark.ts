import { execSync } from 'child_process'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface BenchmarkResult {
  test: string
  duration: number
  memory: {
    used: number
    total: number
  }
  cpu: {
    user: number
    system: number
  }
  status: 'success' | 'error'
  error?: string
}

interface PerformanceReport {
  timestamp: string
  environment: {
    nodeVersion: string
    platform: string
    arch: string
  }
  results: BenchmarkResult[]
  summary: {
    totalTests: number
    successRate: number
    avgDuration: number
    maxMemoryUsage: number
  }
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = []

  private async runCommand(command: string, description: string): Promise<BenchmarkResult> {
    const start = Date.now()
    
    try {
      // 记录内存使用
      const memBefore = process.memoryUsage()
      
      // 执行命令
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 30000 // 30秒超时
      })
      
      const end = Date.now()
      const duration = end - start
      const memAfter = process.memoryUsage()
      
      return {
        test: description,
        duration,
        memory: {
          used: memAfter.heapUsed - memBefore.heapUsed,
          total: memAfter.heapUsed
        },
        cpu: {
          user: 0, // 简化处理
          system: 0
        },
        status: 'success'
      }
    } catch (error) {
      const end = Date.now()
      return {
        test: description,
        duration: end - start,
        memory: { used: 0, total: 0 },
        cpu: { user: 0, system: 0 },
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async runApiTests(): Promise<BenchmarkResult[]> {
    console.log('🚀 Running API performance tests...')
    
    const tests = [
      {
        command: 'cd apps/api && npm run test -- --run --reporter=verbose',
        description: 'API Unit Tests'
      },
      {
        command: 'cd apps/api && npm run test:integration -- --run',
        description: 'API Integration Tests'
      },
      {
        command: 'cd apps/api && npm run build',
        description: 'API Build Time'
      },
      {
        command: 'npm run typecheck',
        description: 'TypeScript Type Check'
      },
      {
        command: 'npm run lint',
        description: 'ESLint Code Quality'
      }
    ]

    const results: BenchmarkResult[] = []
    
    for (const test of tests) {
      const result = await this.runCommand(test.command, test.description)
      results.push(result)
      this.results.push(result)
      
      console.log(`✅ ${test.description}: ${result.duration}ms`)
      if (result.status === 'error') {
        console.log(`❌ Error: ${result.error}`)
      }
    }
    
    return results
  }

  private async runLoadTests(): Promise<BenchmarkResult[]> {
    console.log('⚡ Running load tests...')
    
    try {
      // 检查是否安装了 k6
      const k6Result = await this.runCommand('k6 version', 'K6 Installation Check')
      
      if (k6Result.status === 'success') {
        // 运行简单的负载测试
        const loadTestResult = await this.runCommand(
          'k6 run scripts/perf/k6-bench.js --vus 10 --duration 30s',
          'Load Test (10 VUs, 30s)'
        )
        
        return [k6Result, loadTestResult]
      } else {
        console.log('⚠️  K6 not installed, skipping load tests')
        return [k6Result]
      }
    } catch (error) {
      console.log('⚠️  Load tests skipped:', error)
      return []
    }
  }

  private generateReport(results: BenchmarkResult[]): PerformanceReport {
    const successfulTests = results.filter(r => r.status === 'success')
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    const maxMemory = Math.max(...results.map(r => r.memory.total), 0)
    
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      results,
      summary: {
        totalTests: results.length,
        successRate: results.length > 0 ? (successfulTests.length / results.length) * 100 : 0,
        avgDuration: results.length > 0 ? totalDuration / results.length : 0,
        maxMemoryUsage: maxMemory
      }
    }
    
    return report
  }

  private saveReport(report: PerformanceReport): void {
    const reportsDir = join(process.cwd(), 'performance-reports')
    
    if (!existsSync(reportsDir)) {
      console.log('📁 Creating performance reports directory...')
    }
    
    const filename = `performance-${Date.now()}.json`
    const filepath = join(reportsDir, filename)
    
    writeFileSync(filepath, JSON.stringify(report, null, 2))
    console.log(`📊 Performance report saved: ${filepath}`)
    
    // 也保存最新报告
    const latestPath = join(reportsDir, 'latest.json')
    writeFileSync(latestPath, JSON.stringify(report, null, 2))
    console.log(`📊 Latest report updated: ${latestPath}`)
  }

  private printSummary(report: PerformanceReport): void {
    console.log('\n📈 PERFORMANCE BENCHMARK SUMMARY')
    console.log('==================================')
    console.log(`Environment: Node ${report.environment.nodeVersion} on ${report.environment.platform}`)
    console.log(`Timestamp: ${report.timestamp}`)
    console.log('')
    console.log(`Total Tests: ${report.summary.totalTests}`)
    console.log(`Success Rate: ${report.summary.successRate.toFixed(1)}%`)
    console.log(`Average Duration: ${report.summary.avgDuration.toFixed(0)}ms`)
    console.log(`Max Memory Usage: ${(report.summary.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`)
    console.log('')
    
    console.log('Individual Results:')
    report.results.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌'
      const memory = result.memory.total > 0 ? ` (${(result.memory.total / 1024 / 1024).toFixed(1)}MB)` : ''
      console.log(`  ${status} ${result.test}: ${result.duration}ms${memory}`)
      if (result.error) {
        console.log(`     Error: ${result.error}`)
      }
    })
    
    console.log('')
    
    // 性能评估
    const criticalTests = report.results.filter(r => 
      r.test.includes('Build') || r.test.includes('Type')
    )
    
    if (criticalTests.length > 0) {
      const avgCriticalTime = criticalTests.reduce((sum, r) => sum + r.duration, 0) / criticalTests.length
      
      if (avgCriticalTime < 5000) {
        console.log('🎉 Excellent build performance!')
      } else if (avgCriticalTime < 15000) {
        console.log('👍 Good build performance')
      } else {
        console.log('⚠️  Build performance could be improved')
      }
    }
  }

  async run(): Promise<void> {
    console.log('🏁 Starting Performance Benchmark Suite...')
    console.log('==========================================\n')
    
    try {
      // 运行API测试
      const apiResults = await this.runApiTests()
      
      // 运行负载测试
      const loadResults = await this.runLoadTests()
      
      // 合并结果
      const allResults = [...apiResults, ...loadResults]
      
      // 生成报告
      const report = this.generateReport(allResults)
      
      // 保存报告
      this.saveReport(report)
      
      // 打印摘要
      this.printSummary(report)
      
      console.log('\n🏁 Performance benchmark completed!')
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error)
      process.exit(1)
    }
  }
}

// 运行基准测试
if (require.main === module) {
  const benchmark = new PerformanceBenchmark()
  benchmark.run().catch(console.error)
}

export { PerformanceBenchmark }