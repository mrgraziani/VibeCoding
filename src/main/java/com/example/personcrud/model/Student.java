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
        super(firstName, lastName, email);
    }
}
