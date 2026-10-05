package com.happening.exception;

public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException() {
        super("You do not have permission to change this event");
    }

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
