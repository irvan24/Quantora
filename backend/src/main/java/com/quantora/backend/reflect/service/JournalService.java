package com.quantora.backend.reflect.service;

import com.quantora.backend.auth.exception.UnauthorizedException;
import com.quantora.backend.reflect.dto.JournalEntryRequest;
import com.quantora.backend.reflect.dto.JournalEntryResponse;
import com.quantora.backend.reflect.entity.JournalEntry;
import com.quantora.backend.reflect.repository.JournalEntryRepository;
import com.quantora.backend.user.entity.User;
import com.quantora.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final UserRepository userRepository;

    public JournalService(JournalEntryRepository journalEntryRepository, UserRepository userRepository) {
        this.journalEntryRepository = journalEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> list(Long userId) {
        requireActiveUser(userId);
        return journalEntryRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(JournalEntryResponse::from)
                .toList();
    }

    @Transactional
    public JournalEntryResponse create(Long userId, JournalEntryRequest request) {
        User user = requireActiveUser(userId);
        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .body(request.body())
                .build();
        return JournalEntryResponse.from(journalEntryRepository.save(entry));
    }

    @Transactional
    public void delete(Long userId, Long entryId) {
        requireActiveUser(userId);
        JournalEntry entry = journalEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(UnauthorizedException::new);
        journalEntryRepository.delete(entry);
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.getDeletedAt() == null)
                .orElseThrow(UnauthorizedException::new);
    }
}
