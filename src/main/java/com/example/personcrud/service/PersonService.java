package com.example.personcrud.service;

import com.example.personcrud.model.Person;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.PersonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PersonService {

    private final PersonRepository repository;

    public PersonService(PersonRepository repository) {
        this.repository = repository;
    }

    public List<Person> findAll() {
        return repository.findAll();
    }

    public Page<Person> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Optional<Person> findById(Long id) {
        return repository.findById(id);
    }

    public List<Person> findByLastName(String lastName) {
        if (lastName == null || lastName.isBlank()) {
            return repository.findAll();
        }
        return repository.findByLastNameStartingWithIgnoreCase(lastName.trim());
    }

    public List<Person> findByLastNameAndType(String lastName, String personType) {
        Class<? extends Person> clazz = null;
        if (personType != null && !personType.isBlank()) {
            clazz = switch (personType.trim().toUpperCase()) {
                case "TEACHER" -> Teacher.class;
                case "STUDENT" -> Student.class;
                case "PERSON" -> Person.class;
                default -> null;
            };
        }

        boolean hasLastName = lastName != null && !lastName.isBlank();
        String prefix = hasLastName ? lastName.trim() : "";

        if (clazz != null) {
            return hasLastName
                    ? repository.findByLastNamePrefixAndType(prefix, clazz)
                    : repository.findAllByType(clazz);
        } else {
            return hasLastName
                    ? repository.findByLastNameStartingWithIgnoreCase(prefix)
                    : repository.findAll();
        }
    }

    @Transactional
    public Person create(Person person) {
        person.setId(null);
        return repository.save(person);
    }

    @Transactional
    public Optional<Person> update(Long id, Person person) {
        return repository.findById(id).map(existing -> {
            if (!existing.getClass().equals(person.getClass()) && person.getClass() != Person.class) {
                throw new IllegalArgumentException("Cannot change person type of an existing person");
            }
            existing.setFirstName(person.getFirstName());
            existing.setLastName(person.getLastName());
            existing.setEmail(person.getEmail());
            return repository.save(existing);
        });
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    // --- Dedicated Teacher domain operations ---

    public List<Teacher> findAllTeachers() {
        return repository.findAllByType(Teacher.class).stream()
                .filter(Teacher.class::isInstance)
                .map(Teacher.class::cast)
                .toList();
    }

    public Page<Teacher> findAllTeachers(Pageable pageable) {
        return repository.findAllByType(Teacher.class, pageable).map(p -> (Teacher) p);
    }

    public Optional<Teacher> findTeacherById(Long id) {
        return repository.findByIdAndType(id, Teacher.class).map(p -> (Teacher) p);
    }

    @Transactional
    public Teacher createTeacher(Teacher teacher) {
        teacher.setId(null);
        return (Teacher) repository.save(teacher);
    }

    @Transactional
    public Optional<Teacher> updateTeacher(Long id, Teacher teacher) {
        return findTeacherById(id).map(existing -> {
            existing.setFirstName(teacher.getFirstName());
            existing.setLastName(teacher.getLastName());
            existing.setEmail(teacher.getEmail());
            return (Teacher) repository.save(existing);
        });
    }

    // --- Dedicated Student domain operations ---

    public List<Student> findAllStudents() {
        return repository.findAllByType(Student.class).stream()
                .filter(Student.class::isInstance)
                .map(Student.class::cast)
                .toList();
    }

    public Page<Student> findAllStudents(Pageable pageable) {
        return repository.findAllByType(Student.class, pageable).map(p -> (Student) p);
    }

    public Optional<Student> findStudentById(Long id) {
        return repository.findByIdAndType(id, Student.class).map(p -> (Student) p);
    }

    @Transactional
    public Student createStudent(Student student) {
        student.setId(null);
        return (Student) repository.save(student);
    }

    @Transactional
    public Optional<Student> updateStudent(Long id, Student student) {
        return findStudentById(id).map(existing -> {
            existing.setFirstName(student.getFirstName());
            existing.setLastName(student.getLastName());
            existing.setEmail(student.getEmail());
            return (Student) repository.save(existing);
        });
    }
}
