package com.quantora.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityConfigurationValidatorTest {

    private static JwtProperties withSecret(String secret) {
        return new JwtProperties(secret, 900_000, 604_800_000);
    }

    private static CorsProperties httpsOrigin() {
        return new CorsProperties(List.of("https://app.quantora.test"));
    }

    @Test
    void refusesTheDevelopmentSecretOutsideDevProfiles() {
        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");

        assertThatThrownBy(() -> SecurityConfigurationValidator.validate(
                withSecret(SecurityConfigurationValidator.DEV_JWT_SECRET), httpsOrigin(), prod))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void refusesTheDevelopmentSecretWhenNoProfileIsActive() {
        assertThatThrownBy(() -> SecurityConfigurationValidator.validate(
                withSecret(SecurityConfigurationValidator.DEV_JWT_SECRET), httpsOrigin(), new MockEnvironment()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void allowsTheDevelopmentSecretInDevAndTestProfiles() {
        MockEnvironment dev = new MockEnvironment();
        dev.setActiveProfiles("dev");
        MockEnvironment test = new MockEnvironment();
        test.setActiveProfiles("test");
        CorsProperties local = new CorsProperties(List.of("http://localhost:*"));

        assertThatCode(() -> SecurityConfigurationValidator.validate(
                withSecret(SecurityConfigurationValidator.DEV_JWT_SECRET), local, dev)).doesNotThrowAnyException();
        assertThatCode(() -> SecurityConfigurationValidator.validate(
                withSecret(SecurityConfigurationValidator.DEV_JWT_SECRET), local, test)).doesNotThrowAnyException();
    }

    @Test
    void allowsAProductionSecretAndHttpsOrigin() {
        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");

        assertThatCode(() -> SecurityConfigurationValidator.validate(
                withSecret("a-random-production-secret-of-sufficient-length-123"), httpsOrigin(), prod))
                .doesNotThrowAnyException();
    }

    @Test
    void refusesOpenOrHttpOriginsOutsideDev() {
        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");
        JwtProperties secret = withSecret("a-random-production-secret-of-sufficient-length-123");

        assertThatThrownBy(() -> SecurityConfigurationValidator.validate(
                secret, new CorsProperties(List.of("*")), prod))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CORS");

        assertThatThrownBy(() -> SecurityConfigurationValidator.validate(
                secret, new CorsProperties(List.of("http://localhost:*")), prod))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CORS");
    }

    @Test
    void classifiesUnsafeOrigins() {
        assertThat(SecurityConfigurationValidator.isUnsafeProductionOrigin("*")).isTrue();
        assertThat(SecurityConfigurationValidator.isUnsafeProductionOrigin("http://localhost:*")).isTrue();
        assertThat(SecurityConfigurationValidator.isUnsafeProductionOrigin("https://app.quantora.test")).isFalse();
        assertThat(SecurityConfigurationValidator.isUnsafeProductionOrigin("https://*.quantora.test")).isFalse();
    }
}
