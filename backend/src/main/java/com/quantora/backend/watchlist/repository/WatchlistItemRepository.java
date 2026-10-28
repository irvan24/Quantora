package com.quantora.backend.watchlist.repository;

import com.quantora.backend.watchlist.entity.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    List<WatchlistItem> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<WatchlistItem> findByUserIdAndSymbol(Long userId, String symbol);

    long countByUserId(Long userId);

    void deleteByUserIdAndSymbol(Long userId, String symbol);
}
