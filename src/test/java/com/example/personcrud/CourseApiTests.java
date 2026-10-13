package com.example.personcrud;

import com.example.personcrud.dto.CourseDto;
import com.example.personcrud.model.Course;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.example.personcrud.repository.CourseRepository;
import com.example.personcrud.repository.PersonRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = PersonCrudApplication.class)
@AutoConfigureMockMvc
@org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
class CourseApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private CourseRepository courseRepository;

    @BeforeEach
    void cleanup() {
        courseRepository.deleteAll();
        personRepository.deleteAll();
    }

    @Test
    void testCreateGetUpdateDeleteCourse() throws Exception {
        // create teacher and students directly
        Teacher teacher = new Teacher("Mr", "Teach", "mr.teach@example.com");
        teacher = personRepository.save(teacher);

        Student s1 = new Student("Stu1", "One", "s1@example.com");
        Student s2 = new Student("Stu2", "Two", "s2@example.com");
        s1 = (Student) personRepository.save(s1);
        s2 = (Student) personRepository.save(s2);

        // create course
        CourseDto dto = new CourseDto(null, "Math 101", teacher.getId(), List.of(s1.getId(), s2.getId()));

        MvcResult post = mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Math 101"))
                .andReturn();

        CourseDto created = objectMapper.readValue(post.getResponse().getContentAsString(), CourseDto.class);
        assertThat(created.id()).isNotNull();
        assertThat(created.teacherId()).isEqualTo(teacher.getId());
        assertThat(created.studentIds()).containsExactlyInAnyOrder(s1.getId(), s2.getId());

        // get
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Math 101"));

        // update - change name and remove one student using immutable record
        CourseDto updated = new CourseDto(created.id(), "Advanced Math", created.teacherId(), List.of(s1.getId()));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/courses/{id}", updated.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Advanced Math"))
                .andExpect(jsonPath("$.studentIds[0]").value(s1.getId().intValue()));

        // list
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.[0].name").value("Advanced Math"));

        // delete
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/courses/{id}", created.id()))
                .andExpect(status().isNoContent());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}", created.id()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateCourseValidation() throws Exception {
        // missing name should cause 400
        CourseDto invalid = new CourseDto(null, "", null, List.of());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSequencedCollectionsAndStreamGatherersEndpoints() throws Exception {
        Teacher teacher = personRepository.save(new Teacher("Grace", "Hopper", "grace@example.com"));

        Student s1 = (Student) personRepository.save(new Student("Student1", "Last1", "s1@example.com"));
        Student s2 = (Student) personRepository.save(new Student("Student2", "Last2", "s2@example.com"));
        Student s3 = (Student) personRepository.save(new Student("Student3", "Last3", "s3@example.com"));
        Student s4 = (Student) personRepository.save(new Student("Student4", "Last4", "s4@example.com"));

        CourseDto dto = new CourseDto(null, "Computer Science", teacher.getId(),
                List.of(s1.getId(), s2.getId(), s3.getId(), s4.getId()));

        MvcResult post = mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        CourseDto created = objectMapper.readValue(post.getResponse().getContentAsString(), CourseDto.class);

        // Test Sequenced Collection: getFirst
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}/students/first", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(s1.getId()));

        // Test Sequenced Collection: getLast
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}/students/last", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(s4.getId()));

        // Test Stream Gatherers: cohorts (windows of size 2)
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}/cohorts", created.id())
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].length()").value(2))
                .andExpect(jsonPath("$[1].length()").value(2));

        // Test Audit Log with sealed classes & pattern matching
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/audit-log"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").isString());
    }

    @Test
    void testGetCourseNotFound() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateCourseNotFound() throws Exception {
        CourseDto dto = new CourseDto(99999L, "Nonexistent", null, List.of());
        mockMvc.perform(MockMvcRequestBuilders.put("/api/courses/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetFirstAndLastStudentNotFound() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/99999/students/first"))
                .andExpect(status().isNotFound());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/99999/students/last"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCannotAssignStudentAsTeacher() throws Exception {
        Student student = (Student) personRepository.save(new Student("StudentTeacher", "Test", "st@example.com"));
        CourseDto invalid = new CourseDto(null, "Physics", student.getId(), List.of());

        // GlobalExceptionHandler translates IllegalArgumentException into 400 Bad Request
        mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cannot assign student as teacher"));
    }

    @Test
    void testCourseAndDtoEdgeCases() {
        Teacher teacher = new Teacher("Teacher", "One", "t1@example.com");
        Course course = new Course("Math", teacher);
        assertThat(course.getTeacher()).isEqualTo(teacher);
        assertThat(course.getFirstEnrolledStudent()).isNull();
        assertThat(course.getLastEnrolledStudent()).isNull();

        course.setStudents(null);
        assertThat(course.getStudents()).isEmpty();

        course.setId(100L);
        assertThat(course.getId()).isEqualTo(100L);

        // CourseDto constructor edge cases
        CourseDto dto3 = new CourseDto(1L, "History", 2L);
        assertThat(dto3.studentIds()).isEmpty();

        CourseDto dtoNullStudents = new CourseDto(1L, "History", 2L, null);
        assertThat(dtoNullStudents.studentIds()).isEmpty();
    }

    @Test
    void testCannotAssignPlainPersonAsTeacher() throws Exception {
        com.example.personcrud.model.Person plain = personRepository.save(new com.example.personcrud.model.Person("Plain", "User", "plain@example.com"));
        CourseDto invalid = new CourseDto(null, "Chemistry", plain.getId(), List.of());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unknown person type"));
    }

    @Test
    void testTeacherFilteredOutFromStudentsList() throws Exception {
        Teacher teacher = personRepository.save(new Teacher("Prof", "Xavier", "x@mutants.edu"));
        Student student = (Student) personRepository.save(new Student("Cyclops", "Summers", "scott@mutants.edu"));

        // studentIds includes both a real student and the teacher
        CourseDto dto = new CourseDto(null, "Mutant Ethics", teacher.getId(), List.of(student.getId(), teacher.getId()));

        MvcResult post = mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        CourseDto created = objectMapper.readValue(post.getResponse().getContentAsString(), CourseDto.class);
        // Only the actual student should be enrolled
        assertThat(created.studentIds()).containsExactly(student.getId());
    }

    @Test
    void testListCoursesPaged() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));
    }
}
