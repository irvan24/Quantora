package com.quantora.backend.research.controller;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.research.dto.CompanyVisitRequest;
import com.quantora.backend.research.dto.CompanyVisitResponse;
import com.quantora.backend.research.service.CompanyVisitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/research/visits")
public class CompanyVisitController {

    private final CompanyVisitService companyVisitService;

    public CompanyVisitController(CompanyVisitService companyVisitService) {
        this.companyVisitService = companyVisitService;
    }

    @GetMapping
    public List<CompanyVisitResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return companyVisitService.list(requireUserId(principal));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyVisitResponse record(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompanyVisitRequest request
    ) {
        return companyVisitService.recordVisit(requireUserId(principal), request.symbol(), request.section());
    }

    private Long requireUserId(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
