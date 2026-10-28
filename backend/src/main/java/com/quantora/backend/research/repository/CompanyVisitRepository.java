package com.quantora.backend.research.repository;

import com.quantora.backend.research.entity.CompanyVisit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyVisitRepository extends JpaRepository<CompanyVisit, Long> {

    List<CompanyVisit> findAllByUserIdOrderByLastViewedAtDesc(Long userId);

    Optional<CompanyVisit> findByUserIdAndSymbol(Long userId, String symbol);

    long countByUserId(Long userId);
}
