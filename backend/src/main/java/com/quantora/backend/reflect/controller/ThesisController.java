package com.quantora.backend.reflect.controller;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.reflect.dto.ThesisRequest;
import com.quantora.backend.reflect.dto.ThesisResponse;
import com.quantora.backend.reflect.service.ThesisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/theses")
public class ThesisController {

    private final ThesisService thesisService;

    public ThesisController(ThesisService thesisService) {
        this.thesisService = thesisService;
    }

    @GetMapping
    public List<ThesisResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return thesisService.list(requireUserId(principal));
    }

    @GetMapping("/summary")
    public Map<String, Long> summary(@AuthenticationPrincipal UserPrincipal principal) {
        long count = thesisService.count(requireUserId(principal));
        return Map.of("count", count);
    }

    @GetMapping("/{id}")
    public ThesisResponse get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return thesisService.get(requireUserId(principal), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ThesisResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ThesisRequest request
    ) {
        return thesisService.create(requireUserId(principal), request);
    }

    @PutMapping("/{id}")
    public ThesisResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ThesisRequest request
    ) {
        return thesisService.update(requireUserId(principal), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        thesisService.delete(requireUserId(principal), id);
    }

    private Long requireUserId(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
