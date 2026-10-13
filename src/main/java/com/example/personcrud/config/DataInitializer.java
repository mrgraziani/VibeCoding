package com.example.personcrud.config;

import com.example.personcrud.model.Course;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.CourseRepository;
import com.example.personcrud.repository.PersonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Gatherers;

/**
 * Development & local environment data seeder.
 * Excluded from production via @Profile("!prod") to guarantee data integrity.
 */
@Component
@Profile("!prod")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final PersonRepository personRepository;
    private final CourseRepository courseRepository;

    public DataInitializer(PersonRepository personRepository, CourseRepository courseRepository) {
        this.personRepository = personRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Don't insert sample data if database already contains records
        if (personRepository.count() > 0) return;

        // Create 4 teachers
        List<Teacher> teachers = Arrays.asList(
                new Teacher("Ada", "Lovelace", "ada.lovelace@example.com"),
                new Teacher("Alan", "Turing", "alan.turing@example.com"),
                new Teacher("Grace", "Hopper", "grace.hopper@example.com"),
                new Teacher("Katherine", "Johnson", "katherine.johnson@example.com")
        );

        List<Teacher> savedTeachers = new ArrayList<>();
        for (Teacher t : teachers) {
            if (personRepository.save(t) instanceof Teacher saved) {
                savedTeachers.add(saved);
            }
        }

        // Create 20 students
        List<Student> students = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            Student s = new Student("Student" + i, "Lastname" + i, "student" + i + "@example.com");
            if (personRepository.save(s) instanceof Student saved) {
                students.add(saved);
            }
        }

        // Use Stream Gatherers (Gatherers.windowFixed) to partition students into cohorts
        List<List<Student>> cohorts = students.stream()
                .gather(Gatherers.windowFixed(4))
                .toList();

        List<Course> courses = new ArrayList<>();
        for (int i = 0; i < cohorts.size(); i++) {
            Course c = new Course();
            c.setName("Course " + (i + 1));
            // Round-robin teacher assignment
            Teacher t = savedTeachers.get(i % savedTeachers.size());
            c.setTeacher(t);
            c.setStudents(new ArrayList<>(cohorts.get(i)));
            courses.add(c);
        }

        courseRepository.saveAll(courses);

        log.info("Seeded database with {} teachers, {} students, and {} courses using Stream Gatherers.",
                savedTeachers.size(), students.size(), courses.size());
    }
}

