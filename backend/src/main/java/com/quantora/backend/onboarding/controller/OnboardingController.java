package com.quantora.backend.onboarding.controller;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.onboarding.dto.OnboardingRequest;
import com.quantora.backend.onboarding.dto.OnboardingResponse;
import com.quantora.backend.onboarding.service.OnboardingService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping
    public OnboardingResponse get(@AuthenticationPrincipal UserPrincipal principal) {
        return onboardingService.get(requireUserId(principal));
    }

    @PutMapping
    public OnboardingResponse save(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody OnboardingRequest request
    ) {
        return onboardingService.save(requireUserId(principal), request);
    }

    private Long requireUserId(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
