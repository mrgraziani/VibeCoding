package com.example.personcrud.controller;

import com.example.personcrud.dto.PersonDto;
import com.example.personcrud.model.Person;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.service.PersonService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/persons")
public class PersonController {

    private final PersonService service;

    public PersonController(PersonService service) {
        this.service = service;
    }

    private PersonDto toDto(Person p) {
        PersonDto dto = new PersonDto(p.getId(), p.getFirstName(), p.getLastName(), p.getEmail());
        if (p instanceof Teacher) dto.setPersonType("TEACHER");
        else if (p instanceof Student) dto.setPersonType("STUDENT");
        else dto.setPersonType("PERSON");
        return dto;
    }

    private Person toEntity(PersonDto d) {
        Person p;
        if ("TEACHER".equals(d.getPersonType())) {
            p = new Teacher(d.getFirstName(), d.getLastName(), d.getEmail());
        } else if ("STUDENT".equals(d.getPersonType())) {
            p = new Student(d.getFirstName(), d.getLastName(), d.getEmail());
        } else {
            p = new Person(d.getFirstName(), d.getLastName(), d.getEmail());
        }
        p.setId(d.getId());
        return p;
    }

    @GetMapping
    public List<PersonDto> list() {
        return service.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/search")
    public List<PersonDto> findByLastName(@RequestParam String lastName) {
        return service.findByLastName(lastName).stream().map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonDto> get(@PathVariable Long id) {
        return service.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PersonDto> create(@Valid @RequestBody PersonDto person) {
        Person created = service.create(toEntity(person));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonDto> update(@PathVariable Long id, @Valid @RequestBody PersonDto person) {
        return service.update(id, toEntity(person))
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
