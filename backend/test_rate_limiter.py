import time
from fastapi import Request
from rate_limiter import RateLimiter, limiter

def test_rate_limiter():
    print("Testing RateLimiter sliding window logic...")

    class MockRequest:
        def __init__(self, ip="127.0.0.1"):
            self.client = type("Client", (), {"host": ip})()
            self.headers = {}

    req = MockRequest()
    test_limiter = RateLimiter()

    # Allow 3 requests per 10 seconds
    for i in range(3):
        test_limiter.check(req, "test_action", max_requests=3, window_seconds=10)
        print(f"Request {i+1} allowed.")

    # 4th request must raise HTTP 429
    try:
        test_limiter.check(req, "test_action", max_requests=3, window_seconds=10)
        print("FAIL: 4th request was allowed when it should have been rate limited!")
        assert False
    except Exception as e:
        print(f"SUCCESS: 4th request blocked with HTTP 429 detail: {e.detail}")

if __name__ == "__main__":
    test_rate_limiter()
