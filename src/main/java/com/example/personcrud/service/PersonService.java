package com.example.personcrud.service;

import com.example.personcrud.model.Person;
import com.example.personcrud.repository.PersonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PersonService {

    private final PersonRepository repository;

    public PersonService(PersonRepository repository) {
        this.repository = repository;
    }

    public List<Person> findAll() {
        return repository.findAll();
    }

    public Optional<Person> findById(Long id) {
        return repository.findById(id);
    }

    public List<Person> findByLastName(String lastName) {
        return repository.findByLastNameIgnoreCase(lastName);
    }

    public Person create(Person person) {
        person.setId(null);
        return repository.save(person);
    }

    public Optional<Person> update(Long id, Person person) {
        return repository.findById(id).map(existing -> {
            existing.setFirstName(person.getFirstName());
            existing.setLastName(person.getLastName());
            existing.setEmail(person.getEmail());
            return repository.save(existing);
        });
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
