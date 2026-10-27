package com.quantora.backend.instrument.controller;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.auth.security.UserPrincipal;
import com.quantora.backend.instrument.service.InstrumentService;
import com.quantora.backend.marketdata.model.CompanyProfile;
import com.quantora.backend.marketdata.model.CompanyStatements;
import com.quantora.backend.marketdata.model.InstrumentMatch;
import com.quantora.backend.marketdata.model.LogoImage;
import com.quantora.backend.marketdata.model.PricePoint;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/instruments")
public class InstrumentController {

    private final InstrumentService instrumentService;

    public InstrumentController(InstrumentService instrumentService) {
        this.instrumentService = instrumentService;
    }

    @GetMapping
    public List<InstrumentMatch> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "q", required = false) String query
    ) {
        requireUser(principal);
        return instrumentService.search(query);
    }

    @GetMapping("/{symbol}")
    public CompanyProfile get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String symbol
    ) {
        requireUser(principal);
        return instrumentService.getBySymbol(symbol);
    }

    @GetMapping("/{symbol}/statements")
    public CompanyStatements statements(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String symbol,
            @RequestParam(value = "period", required = false) String period
    ) {
        requireUser(principal);
        return instrumentService.statements(symbol, period);
    }

    @GetMapping("/{symbol}/logo")
    public ResponseEntity<byte[]> logo(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String symbol
    ) {
        requireUser(principal);
        return instrumentService.logo(symbol)
                .map(this::logoResponse)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{symbol}/prices")
    public List<PricePoint> prices(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String symbol
    ) {
        requireUser(principal);
        return instrumentService.prices(symbol);
    }

    private ResponseEntity<byte[]> logoResponse(LogoImage image) {
        MediaType type = MediaType.IMAGE_PNG;
        try {
            type = MediaType.parseMediaType(image.contentType());
        } catch (Exception ignored) {
            type = MediaType.IMAGE_PNG;
        }
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePrivate())
                .body(image.bytes());
    }

    private static void requireUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
    }
}
