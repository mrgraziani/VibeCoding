package com.example.personcrud.config;

import com.example.personcrud.model.Course;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.CourseRepository;
import com.example.personcrud.repository.PersonRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Gatherers;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PersonRepository personRepository;
    private final CourseRepository courseRepository;

    public DataInitializer(PersonRepository personRepository, CourseRepository courseRepository) {
        this.personRepository = personRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // don't insert sample data if database already has persons
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
            savedTeachers.add((Teacher) personRepository.save(t));
        }

        // Create 20 students
        List<Student> students = new ArrayList<>();
        for (int i = 1; i <= 20; i++) {
            Student s = new Student("Student" + i, "Lastname" + i, "student" + i + "@example.com");
            students.add((Student) personRepository.save(s));
        }

        // Use Stream Gatherers (Gatherers.windowFixed) to partition students into 5 cohorts of 4 students each
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

        System.out.println("Seeded database with " + savedTeachers.size() + " teachers, " + students.size() + " students and " + courses.size() + " courses using Stream Gatherers.");
    }
}
