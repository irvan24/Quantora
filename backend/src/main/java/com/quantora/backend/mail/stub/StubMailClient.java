package com.quantora.backend.mail.stub;

import com.quantora.backend.mail.MailClient;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Test-only fixture: records what would have been sent instead of calling a real provider. */
public class StubMailClient implements MailClient {

    public record SentMail(String to, String resetUrl) {
    }

    private final List<SentMail> sent = new CopyOnWriteArrayList<>();

    @Override
    public void sendPasswordReset(String to, String resetUrl) {
        sent.add(new SentMail(to, resetUrl));
    }

    public List<SentMail> sent() {
        return List.copyOf(sent);
    }

    /** Spring wires this as a singleton, so tests that assert on {@link #sent()} must reset it first. */
    public void clear() {
        sent.clear();
    }
}
