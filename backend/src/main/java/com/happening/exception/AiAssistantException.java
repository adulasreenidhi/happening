package com.happening.exception;

public class AiAssistantException extends RuntimeException {
    private final int status;

    public AiAssistantException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
