package com.quantora.backend.reflect.repository;

import com.quantora.backend.reflect.entity.ThesisReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ThesisReviewRepository extends JpaRepository<ThesisReview, Long> {

    List<ThesisReview> findAllByThesisIdOrderByCreatedAtDesc(Long thesisId);

    List<ThesisReview> findAllByThesisIdInOrderByCreatedAtDesc(List<Long> thesisIds);
}
