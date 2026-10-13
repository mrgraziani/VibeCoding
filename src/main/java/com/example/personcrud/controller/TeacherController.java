package com.example.personcrud.controller;

import com.example.personcrud.dto.PersonDto;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.service.PersonService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dedicated REST Controller for Teacher entities (/api/teachers).
 * Enforces domain boundaries by eliminating generic personType query filters.
 */
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final PersonService personService;

    public TeacherController(PersonService personService) {
        this.personService = personService;
    }

    private PersonDto toDto(Teacher t) {
        return new PersonDto(t.getId(), t.getFirstName(), t.getLastName(), t.getEmail(), "TEACHER");
    }

    private Teacher toEntity(PersonDto d) {
        Teacher t = new Teacher(d.firstName(), d.lastName(), d.email());
        t.setId(d.id());
        return t;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null) {
            int pageSize = (size != null && size > 0 && size <= 100) ? size : 20;
            return ResponseEntity.ok(personService.findAllTeachers(PageRequest.of(page, pageSize)).map(this::toDto));
        }
        return ResponseEntity.ok(personService.findAllTeachers().stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonDto> get(@PathVariable Long id) {
        return personService.findTeacherById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PersonDto> create(@Valid @RequestBody PersonDto dto) {
        Teacher created = personService.createTeacher(toEntity(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonDto> update(@PathVariable Long id, @Valid @RequestBody PersonDto dto) {
        return personService.updateTeacher(id, toEntity(dto))
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        personService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
