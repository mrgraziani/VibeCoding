package com.example.personcrud;

import com.example.personcrud.dto.PersonDto;
import com.example.personcrud.model.Student;
import com.example.personcrud.model.Teacher;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = PersonCrudApplication.class)
@AutoConfigureMockMvc
class PersonCrudApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreatePerson() throws Exception {
        PersonDto dto = new PersonDto(null, "Alice", "Walker", "alice.walker@example.com");

        MvcResult result = mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.firstName").value("Alice"))
                .andExpect(jsonPath("$.lastName").value("Walker"))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        PersonDto created = objectMapper.readValue(content, PersonDto.class);
        assertThat(created.id()).isNotNull();
    }

    @Test
    void testGetPersonById() throws Exception {
        // create
        PersonDto dto = new PersonDto(null, "Bob", "Marley", "bob.marley@example.com");
        MvcResult post = mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        PersonDto created = objectMapper.readValue(post.getResponse().getContentAsString(), PersonDto.class);

        // get
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/{id}", created.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("bob.marley@example.com"));
    }

    @Test
    void testUpdatePerson() throws Exception {
        PersonDto dto = new PersonDto(null, "Carol", "King", "carol.king@example.com");
        MvcResult post = mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        PersonDto created = objectMapper.readValue(post.getResponse().getContentAsString(), PersonDto.class);

        // update using immutable record
        PersonDto updated = new PersonDto(
                created.id(),
                "Caroline",
                created.lastName(),
                "caroline.king@example.com",
                created.personType()
        );

        mockMvc.perform(MockMvcRequestBuilders.put("/api/persons/{id}", created.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Caroline"))
                .andExpect(jsonPath("$.email").value("caroline.king@example.com"));
    }

    @Test
    void testFindByLastName() throws Exception {
        PersonDto p1 = new PersonDto(null, "David", "Smith", "david.smith@example.com");
        PersonDto p2 = new PersonDto(null, "Eve", "Johnson", "eve.johnson@example.com");
        PersonDto p3 = new PersonDto(null, "Bob", "Smithson", "bob.smithson@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p1)))
                .andExpect(status().isCreated());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p2)))
                .andExpect(status().isCreated());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p3)))
                .andExpect(status().isCreated());

        // Exact full match should work
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "smith"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2)); // Matches "Smith" and "Smithson"

        // Prefix match (LIKE prefix%) case-insensitive should work
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "smi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "John"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("[0].lastName").value("Johnson"));
    }

    @Test
    void testSearchTeachersByLastNamePrefix() throws Exception {
        PersonDto t1 = new PersonDto(null, "Ada", "Lovelace", "ada.lovelace.prefix@example.com", "TEACHER");
        PersonDto t2 = new PersonDto(null, "Howard", "Lovecraft", "howard.lovecraft@example.com", "TEACHER");
        PersonDto t3 = new PersonDto(null, "Alan", "Turing", "alan.turing.prefix@example.com", "TEACHER");
        PersonDto s1 = new PersonDto(null, "Sam", "Lovering", "sam.lovering@example.com", "STUDENT");

        for (PersonDto p : List.of(t1, t2, t3, s1)) {
            mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(p)))
                    .andExpect(status().isCreated());
        }

        // Search with prefix "love" without type filter returns all persons matching prefix (teachers + student)
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "love"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        // Search with prefix "love" and personType=TEACHER returns only the 2 teachers
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "love")
                        .param("personType", "TEACHER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].personType").value("TEACHER"))
                .andExpect(jsonPath("$[1].personType").value("TEACHER"));

        // Search with prefix "Tur" and personType=TEACHER matches Turing
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "Tur")
                        .param("personType", "TEACHER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("[0].lastName").value("Turing"))
                .andExpect(jsonPath("[0].personType").value("TEACHER"));
    }

    @Test
    void testListPersons() throws Exception {
        PersonDto dto = new PersonDto(null, "Frank", "Ocean", "frank.ocean@example.com");
        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.[0]").exists());
    }

    @Test
    void testDeletePerson() throws Exception {
        PersonDto dto = new PersonDto(null, "Grace", "Hopper", "grace.hopper@example.com");
        MvcResult post = mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        PersonDto created = objectMapper.readValue(post.getResponse().getContentAsString(), PersonDto.class);

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/persons/{id}", created.id()))
                .andExpect(status().isNoContent());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/{id}", created.id()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testFlexibleConstructorBodiesValidation() {
        // Validation in Teacher constructor before super()
        assertThatThrownBy(() -> new Teacher("Ada", "Lovelace", "invalid-email"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid email format for Teacher");

        // Validation in Student constructor before super()
        assertThatThrownBy(() -> new Student("Alan", "Turing", "invalid-email"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid email format for Student");

        // Sanitization trims and lowercases email before super()
        Teacher teacher = new Teacher("  Ada  ", "  Lovelace  ", "  ADA@EXAMPLE.COM  ");
        assertThat(teacher.getFirstName()).isEqualTo("Ada");
        assertThat(teacher.getEmail()).isEqualTo("ada@example.com");

        // Null email branch & default constructor
        Teacher teacherNullEmail = new Teacher("Ada", "Lovelace", null);
        assertThat(teacherNullEmail.getEmail()).isEmpty();
        assertThat(new Teacher()).isNotNull();

        Student studentNullEmail = new Student("Alan", "Turing", null);
        assertThat(studentNullEmail.getEmail()).isEmpty();
        assertThat(new Student()).isNotNull();
    }

    @Test
    void testGetPersonNotFound() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdatePersonNotFound() throws Exception {
        PersonDto dto = new PersonDto(99999L, "Ghost", "User", "ghost@example.com");
        mockMvc.perform(MockMvcRequestBuilders.put("/api/persons/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateTeacherAndStudentExplicitTypes() throws Exception {
        PersonDto teacherDto = new PersonDto(null, "Prof", "Oak", "oak@pokemon.edu", "TEACHER");
        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacherDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.personType").value("TEACHER"));

        PersonDto studentDto = new PersonDto(null, "Ash", "Ketchum", "ash@pokemon.edu", "STUDENT");
        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.personType").value("STUDENT"));
    }

    @Test
    void testCannotChangePersonTypeOnUpdate() throws Exception {
        PersonDto studentDto = new PersonDto(null, "Gary", "Oak", "gary@pokemon.edu", "STUDENT");
        MvcResult res = mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentDto)))
                .andExpect(status().isCreated())
                .andReturn();

        PersonDto created = objectMapper.readValue(res.getResponse().getContentAsString(), PersonDto.class);

        // Attempt to illegally change STUDENT to TEACHER
        PersonDto illegalUpdate = new PersonDto(created.id(), "Gary", "Oak", "gary@pokemon.edu", "TEACHER");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/persons/{id}", created.id())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(illegalUpdate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cannot change person type of an existing person"));
    }

    @Test
    void testValidationErrorsHandledGracefully() throws Exception {
        // Missing firstName, lastName, and invalid email
        PersonDto invalidDto = new PersonDto(null, "", "", "not-an-email", "STUDENT");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Validation failed")))
                .andExpect(jsonPath("$.details").isMap());
    }

    @Test
    void testGetCoursesForPerson() throws Exception {
        PersonDto teacherDto = new PersonDto(null, "Prof", "Sprout", "sprout@hogwarts.edu", "TEACHER");
        MvcResult res = mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacherDto)))
                .andExpect(status().isCreated())
                .andReturn();
        PersonDto createdTeacher = objectMapper.readValue(res.getResponse().getContentAsString(), PersonDto.class);

        // Fetch courses for teacher (initially empty)
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/{id}/courses", createdTeacher.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testApplicationClassInstantiation() {
        assertThat(new PersonCrudApplication()).isNotNull();
        PersonCrudApplication.main(new String[]{"--spring.main.web-application-type=none"});
    }
}
