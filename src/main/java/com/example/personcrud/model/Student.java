package com.example.personcrud.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("STUDENT")
public class Student extends Person {

    public Student() {
        super();
    }

    public Student(String firstName, String lastName, String email) {
        // Flexible Constructor Body: validation and pre-formatting before super(...)
        if (email != null && !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email format for Student: " + email);
        }
        String sanitizedFirst = firstName != null ? firstName.strip() : "";
        String sanitizedLast = lastName != null ? lastName.strip() : "";
        String sanitizedEmail = email != null ? email.strip().toLowerCase() : "";
        super(sanitizedFirst, sanitizedLast, sanitizedEmail);
    }
}
