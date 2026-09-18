package com.quantora.backend.onboarding.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.onboarding.dto.OnboardingRequest;
import com.quantora.backend.onboarding.dto.OnboardingResponse;
import com.quantora.backend.onboarding.entity.OnboardingProfile;
import com.quantora.backend.onboarding.enums.ContributionPlan;
import com.quantora.backend.onboarding.enums.InvestmentKnowledge;
import com.quantora.backend.onboarding.repository.OnboardingProfileRepository;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class OnboardingService {

    private final OnboardingProfileRepository onboardingProfileRepository;
    private final UserRepository userRepository;

    public OnboardingService(
            OnboardingProfileRepository onboardingProfileRepository,
            UserRepository userRepository
    ) {
        this.onboardingProfileRepository = onboardingProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public OnboardingResponse get(Long userId) {
        requireActiveUser(userId);
        return onboardingProfileRepository.findByUserId(userId)
                .map(OnboardingResponse::from)
                .orElseGet(OnboardingResponse::empty);
    }

    @Transactional
    public OnboardingResponse save(Long userId, OnboardingRequest request) {
        User user = requireActiveUser(userId);
        OnboardingProfile profile = onboardingProfileRepository.findByUserId(userId)
                .orElseGet(() -> OnboardingProfile.builder()
                        .user(user)
                        .knowledge(new LinkedHashSet<>())
                        .build());

        apply(profile, request);

        try {
            OnboardingProfile saved = onboardingProfileRepository.saveAndFlush(profile);
            syncUserFlag(user, saved.isCompleted());
            return OnboardingResponse.from(saved);
        } catch (DataIntegrityViolationException ex) {
            OnboardingProfile existing = onboardingProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> ex);
            apply(existing, request);
            OnboardingProfile saved = onboardingProfileRepository.saveAndFlush(existing);
            syncUserFlag(user, saved.isCompleted());
            return OnboardingResponse.from(saved);
        }
    }

    private void apply(OnboardingProfile profile, OnboardingRequest request) {
        profile.setGoal(request.goal());
        profile.setTimeHorizon(request.timeHorizon());
        profile.setEmergencyFund(request.emergencyFund());
        profile.setHighInterestDebt(request.highInterestDebt());
        profile.setContributionPlan(request.contributionPlan());
        profile.setMonthlyContribution(resolveMonthlyContribution(request));
        profile.setRiskReaction(request.riskReaction());
        profile.setExperience(request.experience());
        profile.setApproach(request.approach());

        Set<InvestmentKnowledge> knowledge = profile.getKnowledge();
        if (knowledge == null) {
            knowledge = new LinkedHashSet<>();
            profile.setKnowledge(knowledge);
        }
        knowledge.clear();
        knowledge.addAll(request.knowledge());

        boolean completed = isComplete(profile);
        profile.setCompleted(completed);
        if (completed) {
            if (profile.getCompletedAt() == null) {
                profile.setCompletedAt(LocalDateTime.now());
            }
        } else {
            profile.setCompletedAt(null);
        }
    }

    private BigDecimal resolveMonthlyContribution(OnboardingRequest request) {
        if (request.contributionPlan() != ContributionPlan.REGULARLY) {
            return null;
        }
        return request.monthlyContribution();
    }

    private boolean isComplete(OnboardingProfile profile) {
        return profile.getGoal() != null
                && profile.getTimeHorizon() != null
                && profile.getEmergencyFund() != null
                && profile.getHighInterestDebt() != null
                && profile.getContributionPlan() != null
                && profile.getRiskReaction() != null
                && profile.getExperience() != null
                && profile.getApproach() != null;
    }

    private void syncUserFlag(User user, boolean completed) {
        user.setOnboardingCompleted(completed);
        userRepository.save(user);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
