# 🚀 비동기 및 동시성 처리를 통한 백엔드 성능 개선
(.with claude-code)
## 📋 목차
1. [기본 개념](#기본-개념)
2. [성능 개선 패턴](#성능-개선-패턴)
3. [Node.js 실무 예제](#nodejs-실무-예제)
4. [다른 언어 비교](#다른-언어-비교)
5. [성능 측정 및 모니터링](#성능-측정-및-모니터링)
6. [일반적인 실수와 해결책](#일반적인-실수와-해결책)

---

## 🔑 기본 개념

### 동시성 vs 병렬성
| 구분 | 동시성 (Concurrency) | 병렬성 (Parallelism) |
|------|----------------------|---------------------|
| **정의** | 여러 작업을 시간 분할로 번갈아 실행 | 여러 작업을 물리적으로 동시 실행 |
| **하드웨어** | 싱글 코어에서도 가능 | 멀티 코어 필요 |
| **Node.js** | 이벤트 루프 + 비동기 I/O | Worker Threads, Cluster |

### 비동기 처리가 성능에 미치는 영향
```javascript
// ❌ 동기 처리 - 성능 저하
function syncOperation() {
    const result1 = readFileSync('file1.txt');  // 100ms 대기
    const result2 = readFileSync('file2.txt');  // 100ms 대기
    const result3 = readFileSync('file3.txt');  // 100ms 대기
    return [result1, result2, result3];         // 총 300ms
}

// ✅ 비동기 처리 - 성능 개선
async function asyncOperation() {
    const [result1, result2, result3] = await Promise.all([
        readFile('file1.txt'),  // 병렬 실행
        readFile('file2.txt'),  // 병렬 실행
        readFile('file3.txt')   // 병렬 실행
    ]);
    return [result1, result2, result3];  // 총 100ms
}
```

---

## 🎯 성능 개선 패턴

### 1. I/O 집약적 작업 최적화

#### Connection Pooling
```javascript
// ❌ 매번 새로운 연결
async function badDatabaseQuery(query) {
    const connection = await mysql.createConnection(config);
    const result = await connection.execute(query);
    await connection.end();
    return result;
}

// ✅ 연결 풀 사용
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000
});

async function goodDatabaseQuery(query) {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute(query);
        return result;
    } finally {
        connection.release();
    }
}
```

#### 배치 처리
```javascript
// ❌ 개별 요청
async function processItemsIndividually(items) {
    const results = [];
    for (const item of items) {
        const result = await processItem(item);  // 각각 100ms
        results.push(result);
    }
    return results;  // 1000개 = 100초
}

// ✅ 배치 처리
async function processItemsInBatches(items, batchSize = 10) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processItem(item))
        );
        results.push(...batchResults);
    }
    return results;  // 1000개 = 10초
}
```

### 2. CPU 집약적 작업 최적화

#### Worker Threads 활용
```javascript
// main.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
    // 메인 스레드
    async function heavyComputation(data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: data
            });
            
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    // 병렬로 여러 작업 처리
    async function processLargeDataset(dataset) {
        const chunkSize = Math.ceil(dataset.length / 4);  // 4개 워커 사용
        const chunks = [];
        
        for (let i = 0; i < dataset.length; i += chunkSize) {
            chunks.push(dataset.slice(i, i + chunkSize));
        }
        
        const results = await Promise.all(
            chunks.map(chunk => heavyComputation(chunk))
        );
        
        return results.flat();
    }
} else {
    // 워커 스레드
    function computeIntensive(data) {
        // CPU 집약적 계산
        let result = 0;
        for (let i = 0; i < data.length; i++) {
            result += Math.sqrt(data[i]) * Math.sin(data[i]);
        }
        return result;
    }
    
    const result = computeIntensive(workerData);
    parentPort.postMessage(result);
}
```

### 3. 캐싱 전략

#### 다층 캐싱
```javascript
const Redis = require('redis');
const NodeCache = require('node-cache');

class CacheManager {
    constructor() {
        this.memoryCache = new NodeCache({ stdTTL: 300 }); // 5분
        this.redisClient = Redis.createClient();
    }

    async get(key) {
        // L1: 메모리 캐시 확인
        let value = this.memoryCache.get(key);
        if (value) {
            return { value, source: 'memory' };
        }

        // L2: Redis 캐시 확인
        value = await this.redisClient.get(key);
        if (value) {
            // 메모리 캐시에 백필
            this.memoryCache.set(key, value);
            return { value: JSON.parse(value), source: 'redis' };
        }

        return null;
    }

    async set(key, value, ttl = 3600) {
        // 두 레벨 모두 저장
        this.memoryCache.set(key, value, ttl);
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
    }
}

// 사용 예제
const cache = new CacheManager();

async function getUser(userId) {
    const cacheKey = `user:${userId}`;
    
    // 캐시 확인
    const cached = await cache.get(cacheKey);
    if (cached) {
        console.log(`Cache hit from ${cached.source}`);
        return cached.value;
    }

    // DB에서 조회
    const user = await db.user.findById(userId);
    
    // 캐시 저장
    await cache.set(cacheKey, user, 1800); // 30분
    
    return user;
}
```

### 4. 스트리밍 처리

#### 대용량 파일 처리
```javascript
const fs = require('fs');
const { Transform } = require('stream');

// ❌ 메모리에 전체 파일 로드
async function badProcessLargeFile(filePath) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    const lines = data.split('\n');
    const processed = lines.map(line => processLine(line));
    return processed;
}

// ✅ 스트림으로 처리
function goodProcessLargeFile(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
        const writeStream = fs.createWriteStream(outputPath);
        
        const transformStream = new Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                const lines = chunk.toString().split('\n');
                const processed = lines
                    .filter(line => line.trim())
                    .map(line => processLine(line))
                    .join('\n');
                
                callback(null, processed);
            }
        });

        readStream
            .pipe(transformStream)
            .pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}
```

---

## 💻 Node.js 실무 예제

### Express 서버 성능 최적화

```javascript
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    // 마스터 프로세스 - 워커 생성
    console.log(`Master ${process.pid} is running`);
    
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // 워커 재시작
    });
} else {
    // 워커 프로세스 - Express 서버
    const app = express();

    // 미들웨어 설정
    app.use(helmet());
    app.use(compression());
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15분
        max: 100 // 최대 100 요청
    });
    app.use('/api/', limiter);

    // 비동기 에러 핸들링 미들웨어
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    // API 엔드포인트
    app.get('/api/users', asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        
        // 병렬로 데이터 조회
        const [users, totalCount] = await Promise.all([
            getUsersPaginated(page, limit),
            getUsersCount()
        ]);
        
        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });
    }));

    // 대량 데이터 처리 엔드포인트
    app.post('/api/bulk-process', asyncHandler(async (req, res) => {
        const { items } = req.body;
        
        // 배치 처리로 성능 향상
        const results = await processItemsInBatches(items, 50);
        
        res.json({ processed: results.length, results });
    }));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} listening on port ${PORT}`);
    });
}
```

### 데이터베이스 최적화

```javascript
// MongoDB 집계 파이프라인 최적화
async function getOrderStatistics(startDate, endDate) {
    return await Order.aggregate([
        // 1. 인덱스 활용을 위한 match 먼저
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $in: ['completed', 'shipped'] }
            }
        },
        // 2. 필요한 필드만 projection
        {
            $project: {
                amount: 1,
                customerId: 1,
                createdAt: 1,
                status: 1
            }
        },
        // 3. 그룹핑
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                totalAmount: { $sum: '$amount' },
                orderCount: { $sum: 1 },
                uniqueCustomers: { $addToSet: '$customerId' }
            }
        },
        // 4. 고객 수 계산
        {
            $addFields: {
                uniqueCustomerCount: { $size: '$uniqueCustomers' }
            }
        },
        // 5. 정렬
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
    ]);
}

// SQL 최적화 예제 (Sequelize)
async function getProductsWithCategories() {
    return await Product.findAll({
        include: [
            {
                model: Category,
                attributes: ['id', 'name'], // 필요한 필드만
                required: true // INNER JOIN
            }
        ],
        attributes: ['id', 'name', 'price', 'stock'],
        where: {
            stock: { [Op.gt]: 0 },
            isActive: true
        },
        order: [['name', 'ASC']],
        limit: 100,
        // 쿼리 캐싱
        cache: true,
        cacheTTL: 300000 // 5분
    });
}
```

---

## 🔄 다른 언어 비교

### Python (FastAPI + asyncio)

```python
import asyncio
import aiohttp
from fastapi import FastAPI
from typing import List

app = FastAPI()

# 비동기 HTTP 요청
async def fetch_data(session: aiohttp.ClientSession, url: str):
    async with session.get(url) as response:
        return await response.json()

@app.get("/aggregate-data")
async def aggregate_data(urls: List[str]):
    async with aiohttp.ClientSession() as session:
        # 병렬 요청
        tasks = [fetch_data(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        # 데이터 집계
        return {"total_results": len(results), "data": results}

# CPU 집약적 작업을 위한 ProcessPoolExecutor
import concurrent.futures
import multiprocessing

def cpu_intensive_task(data):
    # 복잡한 계산
    return sum(i * i for i in data)

@app.post("/process-heavy")
async def process_heavy_data(datasets: List[List[int]]):
    loop = asyncio.get_event_loop()
    
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=multiprocessing.cpu_count()
    ) as executor:
        # CPU 작업을 별도 프로세스에서 실행
        tasks = [
            loop.run_in_executor(executor, cpu_intensive_task, dataset)
            for dataset in datasets
        ]
        results = await asyncio.gather(*tasks)
    
    return {"results": results}
```

### Go (Goroutines)

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// Worker Pool 패턴
func processItems(items []int, numWorkers int) []int {
    jobs := make(chan int, len(items))
    results := make(chan int, len(items))
    
    // 워커 시작
    var wg sync.WaitGroup
    for w := 0; w < numWorkers; w++ {
        wg.Add(1)
        go worker(jobs, results, &wg)
    }
    
    // 작업 전송
    for _, item := range items {
        jobs <- item
    }
    close(jobs)
    
    // 결과 수집
    go func() {
        wg.Wait()
        close(results)
    }()
    
    var processedItems []int
    for result := range results {
        processedItems = append(processedItems, result)
    }
    
    return processedItems
}

func worker(jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        // 작업 처리
        result := processItem(job)
        results <- result
    }
}

// Context를 활용한 타임아웃 제어
func fetchWithTimeout(ctx context.Context, url string) (string, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    resultChan := make(chan string, 1)
    errorChan := make(chan error, 1)
    
    go func() {
        // HTTP 요청 수행
        result, err := httpGet(url)
        if err != nil {
            errorChan <- err
            return
        }
        resultChan <- result
    }()
    
    select {
    case result := <-resultChan:
        return result, nil
    case err := <-errorChan:
        return "", err
    case <-ctx.Done():
        return "", ctx.Err()
    }
}
```

---

## 📊 성능 측정 및 모니터링

### Node.js 성능 메트릭

```javascript
const EventEmitter = require('events');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            requestCount: 0,
            responseTime: [],
            errorCount: 0,
            memoryUsage: [],
            cpuUsage: []
        };
        
        // 주기적 메트릭 수집
        setInterval(() => this.collectSystemMetrics(), 5000);
    }
    
    // 요청 성능 측정 미들웨어
    requestTimer() {
        return (req, res, next) => {
            const start = process.hrtime.bigint();
            
            res.on('finish', () => {
                const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
                
                this.metrics.requestCount++;
                this.metrics.responseTime.push(duration);
                
                // 최근 1000개 요청만 유지
                if (this.metrics.responseTime.length > 1000) {
                    this.metrics.responseTime.shift();
                }
                
                // 에러 상태 코드 체크
                if (res.statusCode >= 400) {
                    this.metrics.errorCount++;
                }
                
                this.emit('requestCompleted', {
                    duration,
                    statusCode: res.statusCode,
                    method: req.method,
                    path: req.path
                });
            });
            
            next();
        };
    }
    
    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external
        });
        
        this.metrics.cpuUsage.push({
            timestamp: Date.now(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });
        
        // 오래된 데이터 정리
        const oneHourAgo = Date.now() - 3600000;
        this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
            m => m.timestamp > oneHourAgo
        );
        this.metrics.cpuUsage = this.metrics.cpuUsage.filter(
            c => c.timestamp > oneHourAgo
        );
    }
    
    getStats() {
        const responseTimes = this.metrics.responseTime;
        const avgResponseTime = responseTimes.length > 0 
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
            : 0;
        
        const p95ResponseTime = responseTimes.length > 0
            ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
            : 0;
        
        return {
            requestCount: this.metrics.requestCount,
            errorRate: this.metrics.errorCount / this.metrics.requestCount,
            avgResponseTime: Math.round(avgResponseTime * 100) / 100,
            p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
            currentMemoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
}

// 사용 예제
const monitor = new PerformanceMonitor();
app.use(monitor.requestTimer());

// 성능 알림
monitor.on('requestCompleted', (data) => {
    if (data.duration > 1000) { // 1초 이상
        console.warn(`Slow request detected: ${data.method} ${data.path} took ${data.duration}ms`);
    }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    const stats = monitor.getStats();
    const isHealthy = stats.avgResponseTime < 500 && stats.errorRate < 0.05;
    
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        ...stats
    });
});
```

### 부하 테스트

```javascript
// Artillery.js 설정 (artillery.yml)
/*
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 초당 10명 사용자
    - duration: 120
      arrivalRate: 50  # 초당 50명 사용자
    - duration: 60
      arrivalRate: 100 # 초당 100명 사용자

scenarios:
  - name: "API 부하 테스트"
    requests:
      - get:
          url: "/api/users"
      - post:
          url: "/api/orders"
          json:
            productId: 123
            quantity: 2
*/

// 간단한 부하 테스트 스크립트
const autocannon = require('autocannon');

async function runLoadTest() {
    const result = await autocannon({
        url: 'http://localhost:3000/api/users',
        connections: 10,
        pipelining: 1,
        duration: 30 // 30초
    });
    
    console.log('Load test results:');
    console.log(`Average latency: ${result.latency.average}ms`);
    console.log(`Requests per second: ${result.requests.average}`);
    console.log(`Total requests: ${result.requests.total}`);
    console.log(`Error rate: ${(result.errors / result.requests.total * 100).toFixed(2)}%`);
}
```

---

## ⚠️ 일반적인 실수와 해결책

### 1. Promise Hell

```javascript
// ❌ Promise Hell
function badAsyncFlow(userId) {
    return getUser(userId)
        .then(user => {
            return getProfile(user.id)
                .then(profile => {
                    return getPreferences(profile.id)
                        .then(preferences => {
                            return {
                                user,
                                profile,
                                preferences
                            };
                        });
                });
        });
}

// ✅ Async/Await 사용
async function goodAsyncFlow(userId) {
    const user = await getUser(userId);
    const profile = await getProfile(user.id);
    const preferences = await getPreferences(profile.id);
    
    return { user, profile, preferences };
}

// ✅ 병렬 처리가 가능한 경우
async function optimizedAsyncFlow(userId) {
    const user = await getUser(userId);
    
    // profile과 preferences는 병렬로 가져올 수 있음
    const [profile, preferences] = await Promise.all([
        getProfile(user.id),
        getPreferences(user.id)
    ]);
    
    return { user, profile, preferences };
}
```

### 2. 메모리 누수

```javascript
// ❌ 메모리 누수 위험
class BadEventHandler {
    constructor() {
        this.data = new Array(1000000).fill(0);
        
        // 이벤트 리스너가 제거되지 않음
        setInterval(() => {
            console.log('Still running...');
        }, 1000);
        
        process.on('data', this.handleData.bind(this));
    }
    
    handleData(data) {
        this.data.push(data); // 계속 증가
    }
}

// ✅ 적절한 정리
class GoodEventHandler {
    constructor() {
        this.data = [];
        this.maxDataSize = 1000;
        
        this.intervalId = setInterval(() => {
            console.log('Running...');
        }, 1000);
        
        this.handleData = this.handleData.bind(this);
        process.on('data', this.handleData);
    }
    
    handleData(data) {
        this.data.push(data);
        
        // 크기 제한
        if (this.data.length > this.maxDataSize) {
            this.data.shift();
        }
    }
    
    cleanup() {
        clearInterval(this.intervalId);
        process.removeListener('data', this.handleData);
        this.data = null;
    }
}
```

### 3. 에러 처리 누락

```javascript
// ❌ 에러 처리 누락
async function badErrorHandling() {
    const data = await riskyOperation(); // 에러 시 프로세스 종료
    return processData(data);
}

// ✅ 적절한 에러 처리
async function goodErrorHandling() {
    try {
        const data = await riskyOperation();
        return processData(data);
    } catch (error) {
        logger.error('Operation failed:', error);
        
        // 복구 시도
        try {
            return await fallbackOperation();
        } catch (fallbackError) {
            logger.error('Fallback also failed:', fallbackError);
            throw new Error('All operations failed');
        }
    }
}

// ✅ Circuit Breaker 패턴
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.threshold = threshold;
        this.timeout = timeout;
        this.failureCount = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }
    
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }
        
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    
    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
        }
    }
}
```

---

## 🎯 핵심 포인트

### 성능 개선 체크리스트

- [ ] **I/O 작업을 비동기로 처리**
- [ ] **Connection Pool 사용**
- [ ] **적절한 캐싱 전략 적용**
- [ ] **배치 처리로 DB 쿼리 최적화**
- [ ] **CPU 집약적 작업은 별도 스레드/프로세스**
- [ ] **스트리밍으로 대용량 데이터 처리**
- [ ] **에러 처리 및 복구 전략 구현**
- [ ] **성능 모니터링 도구 설정**
- [ ] **부하 테스트 정기 실행**
- [ ] **메모리 사용량 관리**

### 권장사항

1. **측정 우선**: 성능 개선 전에 현재 상태를 측정
2. **병목 지점 식별**: 프로파일링 도구로 실제 문제점 찾기
3. **점진적 개선**: 한 번에 하나씩 개선하고 효과 측정
4. **모니터링 필수**: 지속적인 성능 모니터링 체계 구축
5. **적절한 도구 선택**: 상황에 맞는 기술 스택 선택

---

> 💡 **기억하세요**: 비동기 및 동시성 처리는 은탄환이 아닙니다. 적절한 상황에서 올바르게 사용할 때 진정한 성능 향상을 얻을 수 있습니다.