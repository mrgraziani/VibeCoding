package com.example.personcrud.controller;

import com.example.personcrud.dto.CourseDto;
import com.example.personcrud.dto.PersonDto;
import com.example.personcrud.model.Course;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    private CourseDto toDto(Course c) {
        List<Long> studentIds = c.getStudents().stream().map(Student::getId).toList();
        Long teacherId = c.getTeacher() != null ? c.getTeacher().getId() : null;
        return new CourseDto(c.getId(), c.getName(), teacherId, studentIds);
    }

    private Course toEntity(CourseDto d) {
        Course c = new Course();
        c.setId(d.id());
        c.setName(d.name());

        if (d.teacherId() != null) {
            Teacher t = new Teacher();
            t.setId(d.teacherId());
            c.setTeacher(t);
        }

        if (d.studentIds() != null) {
            List<Student> students = d.studentIds().stream().map(id -> {
                Student s = new Student();
                s.setId(id);
                return s;
            }).toList();
            c.setStudents(students);
        }
        return c;
    }

    @GetMapping
    public List<CourseDto> list() {
        return service.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDto> get(@PathVariable Long id) {
        return service.findById(id).map(this::toDto).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CourseDto> create(@Valid @RequestBody CourseDto dto) {
        Course created = service.create(toEntity(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDto> update(@PathVariable Long id, @Valid @RequestBody CourseDto dto) {
        return service.update(id, toEntity(dto)).map(this::toDto).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // --- Modern Feature Endpoints ---

    /**
     * Exposes Stream Gatherers (cohort windows) over HTTP.
     */
    @GetMapping("/{id}/cohorts")
    public List<List<Long>> getCohorts(@PathVariable Long id, @RequestParam(defaultValue = "3") int size) {
        return service.getStudentCohorts(id, size).stream()
                .map(group -> group.stream().map(Student::getId).toList())
                .toList();
    }

    /**
     * Exposes Sequenced Collections (first, last, reversed).
     */
    @GetMapping("/{id}/students/first")
    public ResponseEntity<PersonDto> getFirstStudent(@PathVariable Long id) {
        return service.getFirstStudent(id)
                .map(s -> new PersonDto(s.getId(), s.getFirstName(), s.getLastName(), s.getEmail(), "STUDENT"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/students/last")
    public ResponseEntity<PersonDto> getLastStudent(@PathVariable Long id) {
        return service.getLastStudent(id)
                .map(s -> new PersonDto(s.getId(), s.getFirstName(), s.getLastName(), s.getEmail(), "STUDENT"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Exposes audit events described via Pattern Matching for switch with Record Patterns.
     */
    @GetMapping("/audit-log")
    public List<String> getAuditLog() {
        return service.getAuditLogDescriptions();
    }
}
