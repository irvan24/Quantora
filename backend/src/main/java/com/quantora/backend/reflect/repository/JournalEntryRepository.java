package com.quantora.backend.reflect.repository;

import com.quantora.backend.reflect.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);
}
