package com.quantora.backend.onboarding.repository;

import com.quantora.backend.onboarding.entity.OnboardingProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OnboardingProfileRepository extends JpaRepository<OnboardingProfile, Long> {

    Optional<OnboardingProfile> findByUserId(Long userId);
}
