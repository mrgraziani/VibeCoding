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

@RestController
@RequestMapping("/api/persons")
public class PersonController {

    private final PersonService service;

    public PersonController(PersonService service) {
        this.service = service;
    }

    private PersonDto toDto(Person p) {
        // Pattern matching on entity type with unnamed patterns (_)
        String type = switch (p) {
            case Teacher _ -> "TEACHER";
            case Student _ -> "STUDENT";
            case Person _ -> "PERSON";
        };
        return new PersonDto(p.getId(), p.getFirstName(), p.getLastName(), p.getEmail(), type);
    }

    private Person toEntity(PersonDto d) {
        // Record Patterns and Pattern Matching for switch with unnamed patterns (_) and guards (when)
        Person p = switch (d) {
            case PersonDto(_, var first, var last, var email, var type) when "TEACHER".equals(type) ->
                    new Teacher(first, last, email);
            case PersonDto(_, var first, var last, var email, var type) when "STUDENT".equals(type) ->
                    new Student(first, last, email);
            case PersonDto(_, var first, var last, var email, _) ->
                    new Person(first, last, email);
        };
        p.setId(d.id());
        return p;
    }

    @GetMapping
    public List<PersonDto> list() {
        return service.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/search")
    public List<PersonDto> findByLastName(
            @RequestParam(required = false, defaultValue = "") String lastName,
            @RequestParam(required = false) String personType) {
        var stream = service.findByLastName(lastName).stream().map(this::toDto);
        if (personType != null && !personType.isBlank()) {
            stream = stream.filter(p -> personType.equalsIgnoreCase(p.personType()));
        }
        return stream.toList();
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
