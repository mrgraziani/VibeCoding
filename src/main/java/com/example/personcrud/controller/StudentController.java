package com.example.personcrud.controller;

import com.example.personcrud.dto.CourseDto;
import com.example.personcrud.dto.PersonDto;
import com.example.personcrud.model.Student;
import com.example.personcrud.service.CourseService;
import com.example.personcrud.service.PersonService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dedicated REST Controller for Student entities (/api/students).
 * Enforces domain boundaries by eliminating generic personType query filters.
 */
@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final PersonService personService;
    private final CourseService courseService;

    public StudentController(PersonService personService, CourseService courseService) {
        this.personService = personService;
        this.courseService = courseService;
    }

    private PersonDto toDto(Student s) {
        return new PersonDto(s.getId(), s.getFirstName(), s.getLastName(), s.getEmail(), "STUDENT");
    }

    private Student toEntity(PersonDto d) {
        Student s = new Student(d.firstName(), d.lastName(), d.email());
        s.setId(d.id());
        return s;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null) {
            int pageSize = (size != null && size > 0 && size <= 100) ? size : 20;
            return ResponseEntity.ok(personService.findAllStudents(PageRequest.of(page, pageSize)).map(this::toDto));
        }
        return ResponseEntity.ok(personService.findAllStudents().stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonDto> get(@PathVariable Long id) {
        return personService.findStudentById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PersonDto> create(@Valid @RequestBody PersonDto dto) {
        Student created = personService.createStudent(toEntity(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonDto> update(@PathVariable Long id, @Valid @RequestBody PersonDto dto) {
        return personService.updateStudent(id, toEntity(dto))
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/courses")
    public List<CourseDto> getCourses(@PathVariable Long id) {
        return courseService.findByPersonId(id).stream()
                .map(c -> new CourseDto(
                        c.getId(),
                        c.getName(),
                        c.getTeacher() != null ? c.getTeacher().getId() : null,
                        c.getStudents().stream().map(Student::getId).toList()
                ))
                .toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        personService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
