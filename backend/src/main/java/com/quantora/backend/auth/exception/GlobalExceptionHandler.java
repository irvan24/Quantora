package com.quantora.backend.auth.exception;

import tools.jackson.databind.exc.InvalidFormatException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String cause = String.valueOf(ex.getMostSpecificCause().getMessage()).toLowerCase();
        if (cause.contains("email") || cause.contains("users_email")) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already in use"));
        }
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Unexpected error"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(HttpMessageNotReadableException ex) {
        if (ex.getMostSpecificCause() instanceof InvalidFormatException invalidFormat
                && invalidFormat.getTargetType() != null
                && invalidFormat.getTargetType().isEnum()) {
            String field = "value";
            if (!invalidFormat.getPath().isEmpty()) {
                String pathField = invalidFormat.getPath().getLast().getPropertyName();
                if (pathField != null) {
                    field = pathField;
                }
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("message", "Validation failed");
            body.put("errors", Map.of(field, "Invalid value"));
            return ResponseEntity.badRequest().body(body);
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Invalid request body"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        FieldError::getDefaultMessage,
                        (first, second) -> first,
                        LinkedHashMap::new
                ));

        ex.getBindingResult().getGlobalErrors().forEach(error ->
                fieldErrors.putIfAbsent(error.getObjectName(), error.getDefaultMessage())
        );

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Validation failed");
        body.put("errors", fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }
}
