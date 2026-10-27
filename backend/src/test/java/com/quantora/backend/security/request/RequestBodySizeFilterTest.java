package com.quantora.backend.security.request;

import com.quantora.backend.config.ApiSecurityProperties;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RequestBodySizeFilterTest {

    private static final long LIMIT = 16;

    private final RequestBodySizeFilter filter = new RequestBodySizeFilter(
            new ApiSecurityProperties(LIMIT, new ApiSecurityProperties.RateLimit(true, Duration.ofMinutes(1), 10, 10))
    );

    /** Simulates a chunked upload: no Content-Length announced, body streamed. */
    private static MockHttpServletRequest chunkedRequest(byte[] body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/onboarding") {
            @Override
            public long getContentLengthLong() {
                return -1;
            }

            @Override
            public int getContentLength() {
                return -1;
            }
        };
        request.setContent(body);
        return request;
    }

    @Test
    void rejectsDeclaredOversizedBodiesUpFront() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/onboarding");
        request.setContent(new byte[(int) LIMIT + 1]);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(413);
        assertThat(response.getContentAsString()).contains("Request body too large");
        assertThat(chain.getRequest()).isNull();
    }

    @Test
    void cutsOffStreamedBodiesThatExceedTheLimit() throws ServletException, IOException {
        MockHttpServletRequest request = chunkedRequest(new byte[(int) LIMIT * 4]);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        ServletRequest wrapped = chain.getRequest();
        assertThat(wrapped).isNotNull().isNotSameAs(request);
        InputStream body = wrapped.getInputStream();
        assertThatThrownBy(body::readAllBytes).isInstanceOf(RequestBodyTooLargeException.class);
    }

    @Test
    void letsSmallBodiesThrough() throws ServletException, IOException {
        MockHttpServletRequest request = chunkedRequest("{\"ok\":true}".getBytes());
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(new String(chain.getRequest().getInputStream().readAllBytes())).isEqualTo("{\"ok\":true}");
    }

    @Test
    void ignoresNonApiPaths() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        request.setContent(new byte[(int) LIMIT * 4]);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertThat(chain.getRequest()).isSameAs(request);
    }
}
