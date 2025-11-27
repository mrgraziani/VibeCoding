package com.example.personcrud.service;

import com.example.personcrud.model.Course;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.CourseRepository;
import com.example.personcrud.repository.PersonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final PersonRepository personRepository;

    public CourseService(CourseRepository courseRepository, PersonRepository personRepository) {
        this.courseRepository = courseRepository;
        this.personRepository = personRepository;
    }

    public List<Course> findAll() {
        return courseRepository.findAll();
    }

    public Optional<Course> findById(Long id) {
        return courseRepository.findById(id);
    }

    public Course create(Course course) {
        course.setId(null);
        // ensure teacher and students are managed
        if (course.getTeacher() != null && course.getTeacher().getId() != null) {
            personRepository.findById(course.getTeacher().getId())
                    .ifPresent(p -> course.setTeacher((Teacher) p));
        }
        if (course.getStudents() != null) {
            List<Student> managed = course.getStudents().stream()
                    .map(s -> personRepository.findById(s.getId()).map(p -> (Student) p).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toList());
            course.setStudents(managed);
        }
        return courseRepository.save(course);
    }

    public Optional<Course> update(Long id, Course course) {
        return courseRepository.findById(id).map(existing -> {
            existing.setName(course.getName());
            if (course.getTeacher() != null && course.getTeacher().getId() != null) {
                personRepository.findById(course.getTeacher().getId()).ifPresent(p -> existing.setTeacher((Teacher) p));
            }
            if (course.getStudents() != null) {
                List<Student> managed = course.getStudents().stream()
                        .map(s -> personRepository.findById(s.getId()).map(p -> (Student) p).orElse(null))
                        .filter(java.util.Objects::nonNull)
                        .collect(Collectors.toList());
                existing.setStudents(managed);
            }
            return courseRepository.save(existing);
        });
    }

    public void delete(Long id) {
        courseRepository.deleteById(id);
    }
}
