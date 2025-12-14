import asyncio

class GlobalSemaphore:
    def __init__(self, max_concurrency: int) -> None:
        self.sem = asyncio.Semaphore(max_concurrency)

    async def run(self, coro):
        async with self.sem:
            return await coro

global_semaphore = GlobalSemaphore(max_concurrency=16)

