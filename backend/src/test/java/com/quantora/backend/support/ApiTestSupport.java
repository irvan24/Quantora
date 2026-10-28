package com.quantora.backend.support;

import com.jayway.jsonpath.JsonPath;
import com.quantora.backend.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Shared plumbing for HTTP-level security tests: real filter chain, real Spring Security,
 * in-memory H2 database (see application-test.yaml).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestSupport {

    protected static final String PASSWORD = "Testpass1!";

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected JwtProperties jwtProperties;

    protected record Session(String accessToken, String refreshToken, String email) {
    }

    protected static String uniqueEmail(String prefix) {
        return prefix + "." + SEQUENCE.incrementAndGet() + "@quantora.test";
    }

    protected String json(Object value) {
        return objectMapper.writeValueAsString(value);
    }

    protected Map<String, Object> registerPayload(String email, String password) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("firstName", "Test");
        payload.put("lastName", "User");
        payload.put("email", email);
        payload.put("password", password);
        payload.put("termsAccepted", true);
        return payload;
    }

    protected Session register(String email) throws Exception {
        MvcResult result = mockMvc.perform(jsonPost("/api/auth/register", registerPayload(email, PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        return new Session(JsonPath.read(body, "$.accessToken"), JsonPath.read(body, "$.refreshToken"), email);
    }

    protected MockHttpServletRequestBuilder jsonPost(String path, Object payload) {
        return post(path).contentType(MediaType.APPLICATION_JSON).content(json(payload));
    }

    protected MockHttpServletRequestBuilder jsonPut(String path, Object payload) {
        return put(path).contentType(MediaType.APPLICATION_JSON).content(json(payload));
    }

    protected static RequestPostProcessor bearer(String token) {
        return request -> {
            request.addHeader("Authorization", "Bearer " + token);
            return request;
        };
    }

    protected static RequestPostProcessor fromIp(String ip) {
        return request -> {
            request.setRemoteAddr(ip);
            return request;
        };
    }

    /** Signs an arbitrary access token with the server key, to probe claim handling. */
    protected String signedToken(String subject, Map<String, Object> claims, long ttlMillis) {
        return signedToken(jwtProperties.secret(), subject, claims, ttlMillis);
    }

    protected static String signedToken(String secret, String subject, Map<String, Object> claims, long ttlMillis) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(subject)
                .claims(claims)
                .issuedAt(new Date(now))
                .expiration(new Date(now + ttlMillis))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    protected static Map<String, Object> accessClaims(String role) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("type", "access");
        claims.put("role", role);
        return claims;
    }
}
