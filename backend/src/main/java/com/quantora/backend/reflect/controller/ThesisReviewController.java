package com.quantora.backend.reflect.controller;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.reflect.dto.ThesisReviewRequest;
import com.quantora.backend.reflect.dto.ThesisReviewResponse;
import com.quantora.backend.reflect.service.ThesisReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/theses/{thesisId}/reviews")
public class ThesisReviewController {

    private final ThesisReviewService reviewService;

    public ThesisReviewController(ThesisReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ThesisReviewResponse> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long thesisId
    ) {
        return reviewService.list(requireUserId(principal), thesisId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ThesisReviewResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long thesisId,
            @Valid @RequestBody ThesisReviewRequest request
    ) {
        return reviewService.create(requireUserId(principal), thesisId, request);
    }

    private Long requireUserId(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
