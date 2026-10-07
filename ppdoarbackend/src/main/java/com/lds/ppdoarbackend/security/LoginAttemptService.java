package com.lds.ppdoarbackend.security;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Slows down password guessing on sign-in and on the budget password check.
 * Limits are per account+computer (stops guessing from one machine) and per
 * account overall (stops spreading guesses across machines).
 */
@Service
public class LoginAttemptService {

    private static final int MAX_FAILURES_PER_CLIENT = 5;
    private static final int MAX_FAILURES_PER_ACCOUNT = 20;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    /** Seconds the caller must wait before trying again, or 0 if allowed now. */
    public long secondsUntilAllowed(String purpose, String account, String clientIp) {
        return Math.max(
                waitSeconds(clientKey(purpose, account, clientIp), MAX_FAILURES_PER_CLIENT),
                waitSeconds(accountKey(purpose, account), MAX_FAILURES_PER_ACCOUNT));
    }

    public void recordFailure(String purpose, String account, String clientIp) {
        Instant now = Instant.now();
        failures.computeIfAbsent(clientKey(purpose, account, clientIp), k -> new ConcurrentLinkedDeque<>()).addLast(now);
        failures.computeIfAbsent(accountKey(purpose, account), k -> new ConcurrentLinkedDeque<>()).addLast(now);
    }

    public void recordSuccess(String purpose, String account, String clientIp) {
        failures.remove(clientKey(purpose, account, clientIp));
    }

    private long waitSeconds(String key, int maxFailures) {
        Deque<Instant> attempts = failures.get(key);
        if (attempts == null) {
            return 0;
        }
        Instant cutoff = Instant.now().minus(WINDOW);
        while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
            attempts.pollFirst();
        }
        if (attempts.isEmpty()) {
            failures.remove(key, attempts);
            return 0;
        }
        if (attempts.size() < maxFailures) {
            return 0;
        }
        Instant oldest = attempts.peekFirst();
        return Math.max(1, Duration.between(Instant.now(), oldest.plus(WINDOW)).getSeconds());
    }

    private static String clientKey(String purpose, String account, String clientIp) {
        return purpose + "|" + normalize(account) + "|" + clientIp;
    }

    private static String accountKey(String purpose, String account) {
        return purpose + "|" + normalize(account);
    }

    private static String normalize(String account) {
        return account == null ? "" : account.trim().toLowerCase();
    }
}
