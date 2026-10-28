package com.quantora.backend.reflect.repository;

import com.quantora.backend.reflect.entity.InvestmentThesis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvestmentThesisRepository extends JpaRepository<InvestmentThesis, Long> {

    List<InvestmentThesis> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<InvestmentThesis> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);
}
