package com.quantora.backend.config;

import com.quantora.backend.mail.MailClient;
import com.quantora.backend.mail.UnavailableMailClient;
import com.quantora.backend.mail.resend.ResendMailClient;
import com.quantora.backend.mail.stub.StubMailClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class MailConfiguration {

    private static final Logger log = LoggerFactory.getLogger(MailConfiguration.class);

    @Bean
    public MailClient mailClient(MailProperties properties) {
        String provider = properties.provider().trim().toLowerCase();
        return switch (provider) {
            case "stub" -> new StubMailClient();
            case "resend" -> resendClient(properties);
            default -> throw new IllegalStateException(
                    "Unknown mail provider '" + properties.provider() + "'. Supported values: resend, stub."
            );
        };
    }

    private static MailClient resendClient(MailProperties properties) {
        if (!properties.resend().apiKeyConfigured()) {
            log.warn("quantora.mail: RESEND_API_KEY is missing; password-reset emails are disabled");
            return new UnavailableMailClient();
        }
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(4));
        factory.setReadTimeout(Duration.ofSeconds(8));
        RestClient restClient = RestClient.builder()
                .baseUrl(trimTrailingSlash(properties.resend().baseUrl()))
                .requestFactory(factory)
                .build();
        return new ResendMailClient(restClient, properties.resend().apiKey().trim(), properties.resend().fromEmail());
    }

    private static String trimTrailingSlash(String baseUrl) {
        if (baseUrl.endsWith("/")) {
            return baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }
}
