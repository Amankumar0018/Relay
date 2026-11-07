"""
In-memory sliding-window rate limiter for sensitive authentication endpoints.
Protects login verification from brute-force and credential stuffing attacks.
"""

import time
import threading
from typing import Dict, List, Tuple, Optional


class LoginRateLimiter:
    """
    Thread-safe sliding-window rate limiter.
    Tracks failed attempts per key (e.g. client IP or IP:username).
    """

    def __init__(
        self,
        max_attempts: int = 5,
        window_seconds: int = 300,  # 5 minutes
        lockout_seconds: int = 300,
    ):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.lockout_seconds = lockout_seconds
        self._lock = threading.Lock()
        # key -> list of failure timestamps
        self._failures: Dict[str, List[float]] = {}
        # key -> lockout expiration timestamp
        self._lockouts: Dict[str, float] = {}

    def is_locked_out(self, key: str) -> Tuple[bool, int]:
        """
        Checks whether the key is currently locked out.

        Returns:
            Tuple of (is_locked, seconds_remaining)
        """
        now = time.time()
        with self._lock:
            # Check explicit lockout
            lockout_until = self._lockouts.get(key)
            if lockout_until and now < lockout_until:
                return True, int(lockout_until - now) + 1
            elif lockout_until and now >= lockout_until:
                # Lockout expired
                del self._lockouts[key]
                self._failures.pop(key, None)

            # Check sliding window failures
            failures = self._failures.get(key, [])
            valid_failures = [t for t in failures if (now - t) <= self.window_seconds]
            self._failures[key] = valid_failures

            if len(valid_failures) >= self.max_attempts:
                # Trigger lockout
                self._lockouts[key] = now + self.lockout_seconds
                return True, self.lockout_seconds

            return False, 0

    def record_failure(self, key: str) -> Tuple[bool, int]:
        """
        Records a failed attempt. If threshold reached, activates lockout.

        Returns:
            Tuple of (is_now_locked, lockout_seconds_remaining)
        """
        now = time.time()
        with self._lock:
            failures = self._failures.get(key, [])
            valid_failures = [t for t in failures if (now - t) <= self.window_seconds]
            valid_failures.append(now)
            self._failures[key] = valid_failures

            if len(valid_failures) >= self.max_attempts:
                self._lockouts[key] = now + self.lockout_seconds
                return True, self.lockout_seconds
            return False, 0

    def record_success(self, key: str) -> None:
        """Clears failure history on successful authentication."""
        with self._lock:
            self._failures.pop(key, None)
            self._lockouts.pop(key, None)

    def reset(self) -> None:
        """Resets all rate limit state (primarily for testing)."""
        with self._lock:
            self._failures.clear()
            self._lockouts.clear()


# Global singleton instance for authentication endpoints
login_rate_limiter = LoginRateLimiter(
    max_attempts=5,
    window_seconds=300,
    lockout_seconds=300,
)

