package com.quantora.backend.security;

import com.quantora.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OnboardingAuthorizationTest extends ApiTestSupport {

    private static Map<String, Object> fullPlan(String rule) {
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("goal", "BUILD_WEALTH");
        plan.put("timeHorizon", "TEN_TO_TWENTY_YEARS");
        plan.put("emergencyFund", "SEVERAL_MONTHS");
        plan.put("highInterestDebt", "NO");
        plan.put("contributionPlan", "REGULARLY");
        plan.put("monthlyContribution", 500);
        plan.put("contributionPeriod", "MONTH");
        plan.put("riskReaction", "COMFORTABLE_HOLD");
        plan.put("experience", "KNOW_BASICS");
        plan.put("knowledge", List.of("ETFS", "DIVERSIFICATION"));
        plan.put("approach", "MIX_ETFS_AND_STOCKS");
        plan.put("allocation", Map.of("etfs", 70, "stocks", 20, "bonds", 5, "cash", 5));
        plan.put("rules", List.of(rule));
        plan.put("reviewCadence", "YEARLY");
        return plan;
    }

    @Test
    void usersOnlyEverSeeTheirOwnPlan() throws Exception {
        Session alice = register(uniqueEmail("alice"));
        Session bob = register(uniqueEmail("bob"));

        mockMvc.perform(jsonPut("/api/onboarding", fullPlan("Alice rule")).with(bearer(alice.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true))
                .andExpect(jsonPath("$.rules[0]").value("Alice rule"));

        mockMvc.perform(get("/api/onboarding").with(bearer(bob.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false))
                .andExpect(jsonPath("$.goal").doesNotExist())
                .andExpect(jsonPath("$.rules").isEmpty());

        Map<String, Object> bobPlan = fullPlan("Bob rule");
        bobPlan.put("goal", "PRESERVE_SAVINGS");
        mockMvc.perform(jsonPut("/api/onboarding", bobPlan).with(bearer(bob.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goal").value("PRESERVE_SAVINGS"));

        mockMvc.perform(get("/api/onboarding").with(bearer(alice.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goal").value("BUILD_WEALTH"))
                .andExpect(jsonPath("$.rules[0]").value("Alice rule"));

        mockMvc.perform(get("/api/auth/me").with(bearer(alice.accessToken())))
                .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    @Test
    void rejectsInconsistentAllocation() throws Exception {
        Session user = register(uniqueEmail("alloc"));
        Map<String, Object> plan = fullPlan("rule");
        plan.put("allocation", Map.of("etfs", 70, "stocks", 20, "bonds", 5, "cash", 10));

        mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));

        plan.put("allocation", Map.of("etfs", 150, "stocks", -50, "bonds", 0, "cash", 0));
        mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsExtremeContributionValues() throws Exception {
        Session user = register(uniqueEmail("amount"));
        Map<String, Object> plan = fullPlan("rule");

        for (Object amount : List.of(0, -500, "1e12", 9_999_999_999L, "12.345", "abc")) {
            plan.put("monthlyContribution", amount);
            mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void rejectsTooManyOrTooLongRules() throws Exception {
        Session user = register(uniqueEmail("rules"));
        Map<String, Object> plan = fullPlan("rule");

        List<String> rules = new ArrayList<>();
        for (int i = 0; i < 21; i++) {
            rules.add("rule " + i);
        }
        plan.put("rules", rules);
        mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.rules").exists());

        plan.put("rules", List.of("x".repeat(281)));
        mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownEnumValuesAndContradictoryKnowledge() throws Exception {
        Session user = register(uniqueEmail("enum"));
        Map<String, Object> plan = fullPlan("rule");

        plan.put("goal", "GET_RICH_QUICK");
        mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.goal").value("Invalid value"));

        plan.put("goal", "BUILD_WEALTH");
        plan.put("knowledge", List.of("NOT_SURE", "ETFS"));
        mockMvc.perform(jsonPut("/api/onboarding", plan).with(bearer(user.accessToken())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void injectionPayloadsAreStoredAsPlainData() throws Exception {
        Session user = register(uniqueEmail("sqli"));
        String payload = "'; DROP TABLE users; -- <script>alert(1)</script>";

        mockMvc.perform(jsonPut("/api/onboarding", fullPlan(payload)).with(bearer(user.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rules[0]").value(payload));

        mockMvc.perform(get("/api/onboarding").with(bearer(user.accessToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rules[0]").value(payload));

        // The users table is still there.
        register(uniqueEmail("after-sqli"));
    }
}
