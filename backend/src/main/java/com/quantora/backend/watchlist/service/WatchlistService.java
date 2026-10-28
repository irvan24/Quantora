package com.quantora.backend.watchlist.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.instrument.InstrumentSymbols;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import com.quantora.backend.watchlist.dto.WatchlistItemResponse;
import com.quantora.backend.watchlist.entity.WatchlistItem;
import com.quantora.backend.watchlist.repository.WatchlistItemRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WatchlistService {

    private final WatchlistItemRepository watchlistItemRepository;
    private final UserRepository userRepository;

    public WatchlistService(WatchlistItemRepository watchlistItemRepository, UserRepository userRepository) {
        this.watchlistItemRepository = watchlistItemRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<WatchlistItemResponse> list(Long userId) {
        requireActiveUser(userId);
        return watchlistItemRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(WatchlistItemResponse::from)
                .toList();
    }

    /**
     * Deliberately not {@code @Transactional}: see {@code CompanyVisitService.recordVisit}
     * for why the racing insert must fail and roll back in its own transaction rather than
     * one shared with the fallback read.
     */
    public WatchlistItemResponse add(Long userId, String rawSymbol) {
        User user = requireActiveUser(userId);
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        WatchlistItem existing = watchlistItemRepository.findByUserIdAndSymbol(userId, symbol).orElse(null);
        if (existing != null) {
            return WatchlistItemResponse.from(existing);
        }
        try {
            WatchlistItem item = watchlistItemRepository.saveAndFlush(
                    WatchlistItem.builder().user(user).symbol(symbol).build()
            );
            return WatchlistItemResponse.from(item);
        } catch (DataIntegrityViolationException raced) {
            // Two adds for the same symbol arrived at once; the other request already
            // won, so return the row it created instead of failing this one.
            return watchlistItemRepository.findByUserIdAndSymbol(userId, symbol)
                    .map(WatchlistItemResponse::from)
                    .orElseThrow(() -> raced);
        }
    }

    @Transactional
    public void remove(Long userId, String rawSymbol) {
        requireActiveUser(userId);
        String symbol = InstrumentSymbols.normalize(rawSymbol);
        watchlistItemRepository.deleteByUserIdAndSymbol(userId, symbol);
    }

    @Transactional(readOnly = true)
    public long count(Long userId) {
        requireActiveUser(userId);
        return watchlistItemRepository.countByUserId(userId);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
