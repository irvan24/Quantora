package com.quantora.backend.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Used when no mail provider is configured. Logs instead of sending so forgot-password still returns normally. */
public class UnavailableMailClient implements MailClient {

    private static final Logger log = LoggerFactory.getLogger(UnavailableMailClient.class);

    @Override
    public void sendPasswordReset(String to, String resetUrl) {
        log.warn("mail.unavailable reason=no-provider-configured");
    }
}
