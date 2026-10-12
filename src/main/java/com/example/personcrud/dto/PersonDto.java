package com.example.personcrud.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Immutable Person data transfer record.
 */
public record PersonDto(
        Long id,

        @NotBlank(message = "First name is required")
        @Size(max = 50)
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 50)
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        @Size(max = 100)
        String email,

        String personType
) {
    // 4-arg constructor for convenience/backward compatibility
    public PersonDto(Long id, String firstName, String lastName, String email) {
        this(id, firstName, lastName, email, null);
    }
}
