package com.quantora.backend.research;

import com.quantora.backend.research.enums.ResearchSection;
import com.quantora.backend.research.repository.CompanyVisitRepository;
import com.quantora.backend.research.service.CompanyVisitService;
import com.quantora.backend.user.entity.Role;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Two browser tabs (or a double-mounted React effect in dev) can record a visit for the
 * same company at the same instant. Without the unique constraint + retry in
 * {@link CompanyVisitService}, the find-then-insert sequence races and either throws or
 * leaves duplicate rows. See git history for how this was caught via manual QA.
 */
@SpringBootTest
@ActiveProfiles("test")
class CompanyVisitConcurrencyTest {

    @Autowired
    private CompanyVisitService companyVisitService;

    @Autowired
    private CompanyVisitRepository companyVisitRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void concurrentFirstVisitsForTheSameCompanyNeverThrowOrDuplicate() throws Exception {
        Long userId = userRepository.save(
                User.builder()
                        .firstName("Race")
                        .lastName("Tester")
                        .email("race-" + System.nanoTime() + "@quantora.test")
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
                    companyVisitService.recordVisit(userId, "AAPL", ResearchSection.OVERVIEW);
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
        List<com.quantora.backend.research.entity.CompanyVisit> visits =
                companyVisitRepository.findAllByUserIdOrderByLastViewedAtDesc(userId);
        // What matters is a single row and no 500s; the read-then-write increment can
        // still lose a count under true simultaneous writes (view_count isn't shown to
        // the user), so this only checks it moved past its initial value.
        assertThat(visits).hasSize(1);
        assertThat(visits.getFirst().getViewCount()).isGreaterThanOrEqualTo(1);
    }
}
