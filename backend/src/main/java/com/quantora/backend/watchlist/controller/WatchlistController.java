package com.quantora.backend.watchlist.controller;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.watchlist.dto.WatchlistItemRequest;
import com.quantora.backend.watchlist.dto.WatchlistItemResponse;
import com.quantora.backend.watchlist.service.WatchlistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    @GetMapping
    public List<WatchlistItemResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return watchlistService.list(requireUserId(principal));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WatchlistItemResponse add(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody WatchlistItemRequest request
    ) {
        return watchlistService.add(requireUserId(principal), request.symbol());
    }

    @DeleteMapping("/{symbol}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal UserPrincipal principal, @PathVariable String symbol) {
        watchlistService.remove(requireUserId(principal), symbol);
    }

    private Long requireUserId(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return principal.getId();
    }
}
