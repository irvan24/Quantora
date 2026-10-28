package com.quantora.backend.mail.resend;

import com.quantora.backend.mail.MailClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Sends transactional email through the Resend API. Keep Resend request/response shapes inside
 * this package. A delivery failure is logged and swallowed: the caller's response to the user
 * must never depend on whether the email actually went out.
 */
public class ResendMailClient implements MailClient {

    private static final Logger log = LoggerFactory.getLogger(ResendMailClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String fromEmail;

    public ResendMailClient(RestClient restClient, String apiKey, String fromEmail) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
    }

    @Override
    public void sendPasswordReset(String to, String resetUrl) {
        Map<String, Object> body = Map.of(
                "from", fromEmail,
                "to", List.of(to),
                "subject", "Reset your Quantora password",
                "html", html(resetUrl),
                "text", text(resetUrl)
        );
        try {
            restClient.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("mail.password-reset.sent");
        } catch (RestClientException ex) {
            log.warn("mail.password-reset.failed", ex);
        }
    }

    private static String text(String resetUrl) {
        return "Reset your Quantora password: " + resetUrl
                + "\n\nIf you didn't request this, you can ignore this email.";
    }

    private static String html(String resetUrl) {
        return "<p>Reset your Quantora password by following this link:</p>"
                + "<p><a href=\"" + resetUrl + "\">" + resetUrl + "</a></p>"
                + "<p>If you didn't request this, you can ignore this email.</p>";
    }
}
