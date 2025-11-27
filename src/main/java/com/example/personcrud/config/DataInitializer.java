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

        // Create 5 courses with specific student distribution: 5,5,4,3,3
        int[] sizes = {5, 5, 4, 3, 3};
        List<Course> courses = new ArrayList<>();
        int studentIndex = 0;
        for (int i = 0; i < sizes.length; i++) {
            Course c = new Course();
            c.setName("Course " + (i + 1));

            // assign teacher round-robin (so first teacher gets first course)
            Teacher t = savedTeachers.get(i % savedTeachers.size());
            c.setTeacher(t);

            int size = sizes[i];
            int end = Math.min(studentIndex + size, students.size());
            List<Student> sub = students.subList(studentIndex, end);
            c.setStudents(new ArrayList<>(sub));
            studentIndex = end;

            courses.add(c);
        }

        courseRepository.saveAll(courses);

        System.out.println("Seeded database with " + savedTeachers.size() + " teachers, " + students.size() + " students and " + courses.size() + " courses.");
    }
}
