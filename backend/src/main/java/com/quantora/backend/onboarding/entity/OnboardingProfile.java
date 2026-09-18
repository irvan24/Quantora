package com.quantora.backend.onboarding.entity;

import com.quantora.backend.onboarding.enums.ContributionPlan;
import com.quantora.backend.onboarding.enums.EmergencyFund;
import com.quantora.backend.onboarding.enums.HighInterestDebt;
import com.quantora.backend.onboarding.enums.InvestingApproach;
import com.quantora.backend.onboarding.enums.InvestingExperience;
import com.quantora.backend.onboarding.enums.InvestmentGoal;
import com.quantora.backend.onboarding.enums.InvestmentKnowledge;
import com.quantora.backend.onboarding.enums.RiskReaction;
import com.quantora.backend.onboarding.enums.TimeHorizon;
import com.quantora.backend.user.entity.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "onboarding_profiles")
public class OnboardingProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal")
    private InvestmentGoal goal;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_horizon")
    private TimeHorizon timeHorizon;

    @Enumerated(EnumType.STRING)
    @Column(name = "emergency_fund")
    private EmergencyFund emergencyFund;

    @Enumerated(EnumType.STRING)
    @Column(name = "high_interest_debt")
    private HighInterestDebt highInterestDebt;

    @Enumerated(EnumType.STRING)
    @Column(name = "contribution_plan")
    private ContributionPlan contributionPlan;

    @Column(name = "monthly_contribution", precision = 12, scale = 2)
    private BigDecimal monthlyContribution;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_reaction")
    private RiskReaction riskReaction;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience")
    private InvestingExperience experience;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(
            name = "onboarding_knowledge",
            joinColumns = @JoinColumn(name = "onboarding_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"onboarding_id", "topic"})
    )
    @Column(name = "topic", nullable = false)
    private Set<InvestmentKnowledge> knowledge = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "approach")
    private InvestingApproach approach;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
