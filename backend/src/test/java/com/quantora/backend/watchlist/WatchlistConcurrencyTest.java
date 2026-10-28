package com.quantora.backend.watchlist;

import com.quantora.backend.user.entity.Role;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import com.quantora.backend.watchlist.repository.WatchlistItemRepository;
import com.quantora.backend.watchlist.service.WatchlistService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/** Mirrors {@code CompanyVisitConcurrencyTest}: two concurrent "add" clicks for the same symbol must not race. */
@SpringBootTest
@ActiveProfiles("test")
class WatchlistConcurrencyTest {

    @Autowired
    private WatchlistService watchlistService;

    @Autowired
    private WatchlistItemRepository watchlistItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void concurrentAddsForTheSameSymbolNeverThrowOrDuplicate() throws Exception {
        Long userId = userRepository.save(
                User.builder()
                        .firstName("Race")
                        .lastName("Tester")
                        .email("watchlist-race-" + System.nanoTime() + "@quantora.test")
                        .password("irrelevant")
                        .role(Role.USER)
                        .onboardingCompleted(true)
                        .build()
        ).getId();

        int threads = 6;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger failures = new AtomicInteger();

        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                ready.countDown();
                try {
                    go.await();
                    watchlistService.add(userId, "AAPL");
                } catch (Exception e) {
                    failures.incrementAndGet();
                }
            });
        }

        ready.await();
        go.countDown();
        pool.shutdown();
        assertThat(pool.awaitTermination(10, TimeUnit.SECONDS)).isTrue();

        assertThat(failures).hasValue(0);
        assertThat(watchlistItemRepository.findAllByUserIdOrderByCreatedAtDesc(userId)).hasSize(1);
    }
}
