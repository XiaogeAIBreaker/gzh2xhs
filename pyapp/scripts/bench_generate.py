import asyncio
import statistics
import time
import httpx

URL = "http://127.0.0.1:8000/api/generate"
PAYLOAD = {"text": "hello world", "model": "m1", "style": "s"}
CONCURRENCY = 16
REQUESTS = 200

async def worker(client: httpx.AsyncClient, results: list[float]):
    start = time.perf_counter()
    r = await client.post(URL, json=PAYLOAD, headers={"X-Bypass-RateLimit": "1"})
    r.raise_for_status()
    results.append((time.perf_counter() - start) * 1000)

async def main():
    results: list[float] = []
    async with httpx.AsyncClient(timeout=10) as client:
        sem = asyncio.Semaphore(CONCURRENCY)
        async def run_one():
            async with sem:
                await worker(client, results)
        await asyncio.gather(*(run_one() for _ in range(REQUESTS)))
    results.sort()
    p50 = statistics.median(results)
    p90 = results[int(0.90 * len(results))]
    p95 = results[int(0.95 * len(results))]
    p99 = results[int(0.99 * len(results))]
    print({"count": len(results), "p50_ms": round(p50, 2), "p90_ms": round(p90, 2), "p95_ms": round(p95, 2), "p99_ms": round(p99, 2)})

if __name__ == "__main__":
    asyncio.run(main())
