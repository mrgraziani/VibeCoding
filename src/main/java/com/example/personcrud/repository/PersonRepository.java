package com.example.personcrud.repository;

import com.example.personcrud.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    List<Person> findByLastNameIgnoreCase(String lastName);
}
