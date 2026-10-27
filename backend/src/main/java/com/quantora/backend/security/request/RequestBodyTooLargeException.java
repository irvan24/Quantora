package com.quantora.backend.security.request;

import java.io.IOException;

/**
 * Raised while reading a request body that exceeds the configured limit. Extends
 * {@link IOException} so that Spring surfaces it through {@code HttpMessageNotReadableException}.
 */
public class RequestBodyTooLargeException extends IOException {

    public RequestBodyTooLargeException(long maxBytes) {
        super("Request body exceeds the maximum allowed size of " + maxBytes + " bytes");
    }
}
