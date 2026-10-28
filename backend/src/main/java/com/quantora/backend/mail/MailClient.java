package com.quantora.backend.mail;

/**
 * Vendor-agnostic mail port (resend today). Implementations must not throw on delivery
 * failure: the caller never changes its response based on whether the email actually sent.
 */
public interface MailClient {

    void sendPasswordReset(String to, String resetUrl);
}
