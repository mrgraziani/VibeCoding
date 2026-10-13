package com.example.personcrud.exception;

/**
 * Thrown when a requested resource (person, course, etc.) is not found.
 * Inherits from IllegalArgumentException to preserve contract compatibility
 * while signaling a 404 Not Found at the HTTP boundary.
 */
public class ResourceNotFoundException extends IllegalArgumentException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
