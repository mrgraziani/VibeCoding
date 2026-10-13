package com.example.personcrud.service;

import com.example.personcrud.model.Person;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.PersonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PersonService {

    private final PersonRepository repository;

    public PersonService(PersonRepository repository) {
        this.repository = repository;
    }

    public List<Person> findAll() {
        return repository.findAll();
    }

    public Page<Person> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Optional<Person> findById(Long id) {
        return repository.findById(id);
    }

    public List<Person> findByLastName(String lastName) {
        if (lastName == null || lastName.isBlank()) {
            return repository.findAll();
        }
        return repository.findByLastNameStartingWithIgnoreCase(lastName.trim());
    }

    public List<Person> findByLastNameAndType(String lastName, String personType) {
        Class<? extends Person> clazz = null;
        if (personType != null && !personType.isBlank()) {
            clazz = switch (personType.trim().toUpperCase()) {
                case "TEACHER" -> Teacher.class;
                case "STUDENT" -> Student.class;
                case "PERSON" -> Person.class;
                default -> null;
            };
        }

        boolean hasLastName = lastName != null && !lastName.isBlank();
        String prefix = hasLastName ? lastName.trim() : "";

        if (clazz != null) {
            return hasLastName
                    ? repository.findByLastNamePrefixAndType(prefix, clazz)
                    : repository.findAllByType(clazz);
        } else {
            return hasLastName
                    ? repository.findByLastNameStartingWithIgnoreCase(prefix)
                    : repository.findAll();
        }
    }

    @Transactional
    public Person create(Person person) {
        person.setId(null);
        return repository.save(person);
    }

    @Transactional
    public Optional<Person> update(Long id, Person person) {
        return repository.findById(id).map(existing -> {
            if (!existing.getClass().equals(person.getClass()) && person.getClass() != Person.class) {
                throw new IllegalArgumentException("Cannot change person type of an existing person");
            }
            existing.setFirstName(person.getFirstName());
            existing.setLastName(person.getLastName());
            existing.setEmail(person.getEmail());
            return repository.save(existing);
        });
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
