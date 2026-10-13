package com.example.personcrud;

import com.example.personcrud.dto.CourseDto;
import com.example.personcrud.dto.PersonDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = PersonCrudApplication.class)
@AutoConfigureMockMvc
class SecurityIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testPublicEndpointsAccessibleWithoutAuth() throws Exception {
        // Public read endpoints should be 200 OK without any auth
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons"))
                .andExpect(status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/teachers"))
                .andExpect(status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/students"))
                .andExpect(status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses"))
                .andExpect(status().isOk());

        mockMvc.perform(MockMvcRequestBuilders.get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void testAnonymousMutationReturns401Unauthorized() throws Exception {
        PersonDto dto = new PersonDto(null, "Hacker", "Unauthenticated", "hack@evil.com");
        mockMvc.perform(MockMvcRequestBuilders.post("/api/teachers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized: Authentication required"));
    }

    @Test
    void testStudentRoleForbiddenOnMutationsReturns403() throws Exception {
        CourseDto course = new CourseDto(null, "Restricted Course", null, List.of());
        mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .with(httpBasic("student", "student123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(course)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden: Insufficient privileges for this operation"));
    }

    @Test
    void testTeacherRoleCanCreateCourse() throws Exception {
        CourseDto course = new CourseDto(null, "Distributed Systems 101", null, List.of());
        mockMvc.perform(MockMvcRequestBuilders.post("/api/courses")
                        .with(httpBasic("teacher", "teacher123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(course)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Distributed Systems 101"));
    }

    @Test
    void testTeacherRoleForbiddenOnAdminSystemLab() throws Exception {
        // Only ROLE_ADMIN can execute system diagnostics and batch tasks
        mockMvc.perform(MockMvcRequestBuilders.post("/api/system/virtual-threads/run")
                        .with(httpBasic("teacher", "teacher123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("Batch1"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void testAdminRoleCanExecuteSystemLab() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/system/virtual-threads/run")
                        .with(httpBasic("admin", "admin123"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("AdminBatch"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].taskName").value("AdminBatch"));
    }
}
