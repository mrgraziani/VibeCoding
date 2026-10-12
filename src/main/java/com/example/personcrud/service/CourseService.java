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

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.SequencedCollection;
import java.util.stream.Gatherers;

@Service
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

    public Optional<Course> findById(Long id) {
        return courseRepository.findById(id);
    }

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

    public void delete(Long id) {
        courseRepository.deleteById(id);
    }

    /**
     * Resolves entities using Pattern Matching for switch and Unnamed Patterns (_),
     * avoiding dangerous unchecked downcasts.
     */
    private void resolveTeacherAndStudents(Course course) {
        if (course.getTeacher() != null && course.getTeacher().getId() != null) {
            personRepository.findById(course.getTeacher().getId()).ifPresent(p -> {
                switch (p) {
                    case Teacher t -> course.setTeacher(t);
                    case Student _ -> throw new IllegalArgumentException("A student cannot be assigned as teacher");
                    case Person _ -> throw new IllegalArgumentException("Target person must be a Teacher");
                }
            });
        }

        if (course.getStudents() != null) {
            List<Student> managed = course.getStudents().stream()
                    .map(s -> personRepository.findById(s.getId())
                            .map(p -> switch (p) {
                                case Student st -> st;
                                case Person _ -> null;
                            })
                            .orElse(null))
                    .filter(Objects::nonNull)
                    .toList();
            course.setStudents(managed);
        }
    }

    // --- Stream Gatherers (JEP 461 / JEP 473) ---

    /**
     * Uses Stream Gatherers (Gatherers.windowFixed) to partition course students into cohort batches.
     */
    public List<List<Student>> getStudentCohorts(Long courseId, int cohortSize) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseId));
        return course.getStudents().stream()
                .gather(Gatherers.windowFixed(cohortSize))
                .toList();
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
}
