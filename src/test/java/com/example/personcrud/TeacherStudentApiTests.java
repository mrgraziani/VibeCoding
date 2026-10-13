package com.example.personcrud;

import com.example.personcrud.dto.PersonDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = PersonCrudApplication.class)
@AutoConfigureMockMvc
@org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
class TeacherStudentApiTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testTeacherCrudLifecycle() throws Exception {
        PersonDto dto = new PersonDto(null, "Linus", "Torvalds", "linus@kernel.org");

        // 1. Create teacher via semantic /api/teachers
        MvcResult res = mockMvc.perform(MockMvcRequestBuilders.post("/api/teachers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.personType").value("TEACHER"))
                .andExpect(jsonPath("$.firstName").value("Linus"))
                .andReturn();

        PersonDto created = objectMapper.readValue(res.getResponse().getContentAsString(), PersonDto.class);

        // 2. Get teacher by ID
        mockMvc.perform(MockMvcRequestBuilders.get("/api/teachers/{id}", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("linus@kernel.org"));

        // 3. Update teacher
        PersonDto updated = new PersonDto(created.id(), "Linus", "Torvalds", "torvalds@kernel.org", "TEACHER");
        mockMvc.perform(MockMvcRequestBuilders.put("/api/teachers/{id}", created.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("torvalds@kernel.org"));

        // 4. List teachers paginated
        mockMvc.perform(MockMvcRequestBuilders.get("/api/teachers?page=0&size=5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 5. Delete teacher
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/teachers/{id}", created.id()))
                .andExpect(status().isNoContent());
    }

    @Test
    void testStudentCrudLifecycle() throws Exception {
        PersonDto dto = new PersonDto(null, "Margaret", "Hamilton", "margaret@apollo.nasa.gov");

        // 1. Create student via semantic /api/students
        MvcResult res = mockMvc.perform(MockMvcRequestBuilders.post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.personType").value("STUDENT"))
                .andExpect(jsonPath("$.firstName").value("Margaret"))
                .andReturn();

        PersonDto created = objectMapper.readValue(res.getResponse().getContentAsString(), PersonDto.class);

        // 2. Get student by ID
        mockMvc.perform(MockMvcRequestBuilders.get("/api/students/{id}", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("margaret@apollo.nasa.gov"));

        // 3. Get student courses (initially empty)
        mockMvc.perform(MockMvcRequestBuilders.get("/api/students/{id}/courses", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // 4. Delete student
        mockMvc.perform(MockMvcRequestBuilders.delete("/api/students/{id}", created.id()))
                .andExpect(status().isNoContent());
    }
}
