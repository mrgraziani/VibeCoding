package com.example.personcrud.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("TEACHER")
public class Teacher extends Person {

    public Teacher() {
        super();
    }

    public Teacher(String firstName, String lastName, String email) {
        // Flexible Constructor Body: validation and pre-formatting before super(...)
        if (email != null && !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email format for Teacher: " + email);
        }
        String sanitizedFirst = firstName != null ? firstName.strip() : "";
        String sanitizedLast = lastName != null ? lastName.strip() : "";
        String sanitizedEmail = email != null ? email.strip().toLowerCase() : "";
        super(sanitizedFirst, sanitizedLast, sanitizedEmail);
    }
}
