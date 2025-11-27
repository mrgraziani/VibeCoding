package com.example.personcrud;

import com.example.personcrud.dto.CourseDto;
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

@SpringBootTest
@AutoConfigureMockMvc
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
        assertThat(created.getId()).isNotNull();
        assertThat(created.getTeacherId()).isEqualTo(teacher.getId());
        assertThat(created.getStudentIds()).containsExactlyInAnyOrder(s1.getId(), s2.getId());

        // get
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}", created.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Math 101"));

        // update - change name and remove one student
        created.setName("Advanced Math");
        created.setStudentIds(List.of(s1.getId()));

        mockMvc.perform(MockMvcRequestBuilders.put("/api/courses/{id}", created.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Advanced Math"))
                .andExpect(jsonPath("$.studentIds[0]").value(s1.getId().intValue()));

        // list
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.[0].name").value("Advanced Math"));

        // delete
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/courses/{id}", created.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/{id}", created.getId()))
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
}
