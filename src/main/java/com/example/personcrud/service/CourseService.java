package com.example.personcrud.service;

import com.example.personcrud.event.AcademicEvent.CourseCreatedEvent;
import com.example.personcrud.event.AcademicEvent.StudentEnrolledEvent;
import com.example.personcrud.event.AcademicEvent.TeacherAssignedEvent;
import com.example.personcrud.model.Course;
import com.example.personcrud.model.Person;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.CourseRepository;
import com.example.personcrud.repository.PersonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.SequencedCollection;
import java.util.stream.Collectors;
import java.util.stream.Gatherers;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;
    private final PersonRepository personRepository;
    private final AcademicAuditService auditService;

    public CourseService(CourseRepository courseRepository,
                         PersonRepository personRepository,
                         AcademicAuditService auditService) {
        this.courseRepository = courseRepository;
        this.personRepository = personRepository;
        this.auditService = auditService;
    }

    public List<Course> findAll() {
        return courseRepository.findAll();
    }

    public Page<Course> findAll(Pageable pageable) {
        return courseRepository.findAll(pageable);
    }

    public Optional<Course> findById(Long id) {
        return courseRepository.findById(id);
    }

    @Transactional
    public Course create(Course course) {
        course.setId(null);
        resolveTeacherAndStudents(course);
        Course saved = courseRepository.save(course);

        // Record domain events
        Long teacherId = saved.getTeacher() != null ? saved.getTeacher().getId() : null;
        auditService.recordEvent(new CourseCreatedEvent(saved.getId(), saved.getName(), teacherId));

        if (saved.getTeacher() != null) {
            auditService.recordEvent(new TeacherAssignedEvent(saved.getId(), saved.getTeacher().getId(), saved.getName()));
        }
        for (Student s : saved.getStudents()) {
            auditService.recordEvent(new StudentEnrolledEvent(saved.getId(), s.getId(), saved.getName()));
        }

        return saved;
    }

    @Transactional
    public Optional<Course> update(Long id, Course course) {
        return courseRepository.findById(id).map(existing -> {
            existing.setName(course.getName());
            resolveTeacherAndStudents(course);
            existing.setTeacher(course.getTeacher());
            existing.getStudents().clear();
            if (course.getStudents() != null) {
                existing.getStudents().addAll(course.getStudents());
            }
            return courseRepository.save(existing);
        });
    }

    @Transactional
    public void delete(Long id) {
        courseRepository.deleteById(id);
    }

    /**
     * Resolves entities using single batch queries, eliminating the N+1 SELECT problem,
     * while preserving order and strictly validating person subtypes using Pattern Matching.
     */
    private void resolveTeacherAndStudents(Course course) {
        if (course.getTeacher() != null && course.getTeacher().getId() != null) {
            Person p = personRepository.findById(course.getTeacher().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Teacher with ID " + course.getTeacher().getId() + " not found"));
            switch (p) {
                case Teacher t -> course.setTeacher(t);
                case Student _ -> throw new IllegalArgumentException("Cannot assign student as teacher");
                case Person _ -> throw new IllegalArgumentException("Unknown person type");
            }
        }

        if (course.getStudents() != null) {
            List<Long> ids = course.getStudents().stream()
                    .map(Student::getId)
                    .filter(Objects::nonNull)
                    .toList();

            if (!ids.isEmpty()) {
                // Batch query IN (...) eliminating N+1 loop queries
                List<Person> found = personRepository.findAllById(ids);
                Map<Long, Student> studentMap = found.stream()
                        .filter(Student.class::isInstance)
                        .map(Student.class::cast)
                        .collect(Collectors.toMap(Student::getId, s -> s));

                List<Student> managed = ids.stream()
                        .map(studentMap::get)
                        .filter(Objects::nonNull)
                        .toList();
                course.setStudents(managed);
            } else {
                course.setStudents(List.of());
            }
        }
    }

    // --- Stream Gatherers (JEP 461 / JEP 473) ---

    /**
     * Uses Stream Gatherers (Gatherers.windowFixed) to partition course students into cohort batches.
     */
    public List<List<Student>> getStudentCohorts(Long courseId, int cohortSize) {
        if (cohortSize <= 0) {
            throw new IllegalArgumentException("Cohort size must be greater than zero");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new com.example.personcrud.exception.ResourceNotFoundException("Course not found: " + courseId));
        return course.getStudents().stream()
                .gather(Gatherers.windowFixed(cohortSize))
                .toList();
    }

    public List<Course> findByPersonId(Long personId) {
        List<Course> asTeacher = courseRepository.findByTeacherId(personId);
        List<Course> asStudent = courseRepository.findByStudentId(personId);
        if (asTeacher.isEmpty()) return asStudent;
        if (asStudent.isEmpty()) return asTeacher;
        List<Course> combined = new java.util.ArrayList<>(asTeacher);
        combined.addAll(asStudent);
        return combined.stream().distinct().toList();
    }

    // --- Sequenced Collections (JEP 431) ---

    public Optional<Student> getFirstStudent(Long courseId) {
        return courseRepository.findById(courseId).map(Course::getFirstEnrolledStudent);
    }

    public Optional<Student> getLastStudent(Long courseId) {
        return courseRepository.findById(courseId).map(Course::getLastEnrolledStudent);
    }

    public SequencedCollection<Student> getStudentsReversed(Long courseId) {
        return courseRepository.findById(courseId)
                .map(Course::getStudentsReversed)
                .orElse(List.of());
    }

    public List<String> getAuditLogDescriptions() {
        return auditService.getAuditLog().stream()
                .map(auditService::describeEvent)
                .toList();
    }
}
