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
        super(firstName, lastName, email);
    }
}
