package com.quantora.backend.auth.exception;

public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException() {
        super("Too many requests. Please try again later.");
    }
}
