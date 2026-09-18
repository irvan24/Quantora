package com.quantora.backend.onboarding.dto;

import com.quantora.backend.onboarding.entity.OnboardingProfile;
import com.quantora.backend.onboarding.enums.ContributionPlan;
import com.quantora.backend.onboarding.enums.EmergencyFund;
import com.quantora.backend.onboarding.enums.HighInterestDebt;
import com.quantora.backend.onboarding.enums.InvestingApproach;
import com.quantora.backend.onboarding.enums.InvestingExperience;
import com.quantora.backend.onboarding.enums.InvestmentGoal;
import com.quantora.backend.onboarding.enums.InvestmentKnowledge;
import com.quantora.backend.onboarding.enums.RiskReaction;
import com.quantora.backend.onboarding.enums.TimeHorizon;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OnboardingResponse(
        InvestmentGoal goal,
        TimeHorizon timeHorizon,
        EmergencyFund emergencyFund,
        HighInterestDebt highInterestDebt,
        ContributionPlan contributionPlan,
        BigDecimal monthlyContribution,
        RiskReaction riskReaction,
        InvestingExperience experience,
        List<InvestmentKnowledge> knowledge,
        InvestingApproach approach,
        boolean completed,
        LocalDateTime completedAt
) {

    public static OnboardingResponse empty() {
        return new OnboardingResponse(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                null,
                false,
                null
        );
    }

    public static OnboardingResponse from(OnboardingProfile profile) {
        return new OnboardingResponse(
                profile.getGoal(),
                profile.getTimeHorizon(),
                profile.getEmergencyFund(),
                profile.getHighInterestDebt(),
                profile.getContributionPlan(),
                profile.getMonthlyContribution(),
                profile.getRiskReaction(),
                profile.getExperience(),
                List.copyOf(profile.getKnowledge()),
                profile.getApproach(),
                profile.isCompleted(),
                profile.getCompletedAt()
        );
    }
}
