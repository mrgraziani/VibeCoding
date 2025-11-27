package com.example.personcrud.controller;

import com.example.personcrud.dto.CourseDto;
import com.example.personcrud.model.Course;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.service.CourseService;
import com.example.personcrud.repository.PersonRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;
    private final PersonRepository personRepository;

    public CourseController(CourseService service, PersonRepository personRepository) {
        this.service = service;
        this.personRepository = personRepository;
    }

    private CourseDto toDto(Course c) {
        List<Long> studentIds = c.getStudents().stream().map(Student::getId).collect(Collectors.toList());
        Long teacherId = c.getTeacher() != null ? c.getTeacher().getId() : null;
        return new CourseDto(c.getId(), c.getName(), teacherId, studentIds);
    }

    private Course toEntity(CourseDto d) {
        Course c = new Course();
        c.setId(d.getId());
        c.setName(d.getName());
        if (d.getTeacherId() != null) {
            personRepository.findById(d.getTeacherId()).ifPresent(p -> c.setTeacher((Teacher) p));
        }
        if (d.getStudentIds() != null) {
            List<Student> students = d.getStudentIds().stream()
                    .map(id -> personRepository.findById(id).map(p -> (Student) p).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            c.setStudents(students);
        }
        return c;
    }

    @GetMapping
    public List<CourseDto> list() {
        return service.findAll().stream().map(this::toDto).collect(Collectors.toList());
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
}
