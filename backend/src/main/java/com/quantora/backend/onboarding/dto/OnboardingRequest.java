package com.quantora.backend.onboarding.dto;

import com.quantora.backend.onboarding.enums.ContributionPlan;
import com.quantora.backend.onboarding.enums.EmergencyFund;
import com.quantora.backend.onboarding.enums.HighInterestDebt;
import com.quantora.backend.onboarding.enums.InvestingApproach;
import com.quantora.backend.onboarding.enums.InvestingExperience;
import com.quantora.backend.onboarding.enums.InvestmentGoal;
import com.quantora.backend.onboarding.enums.InvestmentKnowledge;
import com.quantora.backend.onboarding.enums.RiskReaction;
import com.quantora.backend.onboarding.enums.TimeHorizon;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;
import java.util.List;

public record OnboardingRequest(
        InvestmentGoal goal,
        TimeHorizon timeHorizon,
        EmergencyFund emergencyFund,
        HighInterestDebt highInterestDebt,
        ContributionPlan contributionPlan,
        @DecimalMin(value = "1.00", message = "Monthly contribution must be at least 1")
        @Digits(integer = 9, fraction = 2, message = "Monthly contribution must have at most 2 decimal places")
        BigDecimal monthlyContribution,
        RiskReaction riskReaction,
        InvestingExperience experience,
        List<InvestmentKnowledge> knowledge,
        InvestingApproach approach
) {
    public OnboardingRequest {
        knowledge = knowledge == null ? List.of() : knowledge.stream().distinct().toList();
    }

    @AssertTrue(message = "NOT_SURE cannot be combined with other knowledge topics")
    public boolean isKnowledgeValid() {
        return !knowledge.contains(InvestmentKnowledge.NOT_SURE) || knowledge.size() == 1;
    }
}
