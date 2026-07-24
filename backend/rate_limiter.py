import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status

class RateLimiter:
    """
    In-memory Sliding Window Rate Limiter.
    Tracks request timestamps per client IP address and endpoint key.
    Provides anti-brute-force protection for login, OTP, and RAG endpoints.
    """
    def __init__(self):
        self._requests: Dict[Tuple[str, str], List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, now: float, max_age: float = 600):
        """Periodically purges entries older than max_age to prevent memory leak."""
        if now - self._last_cleanup < 60:
            return
        self._last_cleanup = now
        to_delete = []
        for key, timestamps in self._requests.items():
            self._requests[key] = [t for t in timestamps if now - t < max_age]
            if not self._requests[key]:
                to_delete.append(key)
        for key in to_delete:
            del self._requests[key]

    def check(self, request: Request, key_name: str, max_requests: int, window_seconds: int):
        """
        Enforces rate limit.
        Raises HTTP 429 Too Many Requests if limit is exceeded.
        """
        now = time.time()
        self._cleanup_old_entries(now, max_age=window_seconds * 2)

        # Extract client IP address (respecting X-Forwarded-For if behind a proxy)
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        lookup_key = (client_ip, key_name)
        timestamps = self._requests[lookup_key]

        # Filter timestamps within the current window
        cutoff = now - window_seconds
        valid_timestamps = [t for t in timestamps if t > cutoff]
        self._requests[lookup_key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            retry_after = int(window_seconds - (now - valid_timestamps[0]))
            retry_seconds = max(1, retry_after)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for '{key_name}'. Allowed: {max_requests} requests per {window_seconds}s. Please try again in {retry_seconds} seconds.",
                headers={"Retry-After": str(retry_seconds)}
            )

        # Record this request timestamp
        self._requests[lookup_key].append(now)

# Global rate limiter instance
limiter = RateLimiter()
