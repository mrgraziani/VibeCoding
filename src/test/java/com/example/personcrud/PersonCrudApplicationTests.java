package com.example.personcrud;

import com.example.personcrud.dto.PersonDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
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
        assertThat(created.getId()).isNotNull();
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
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/{id}", created.getId()))
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

        // update
        created.setFirstName("Caroline");
        created.setEmail("caroline.king@example.com");

        mockMvc.perform(MockMvcRequestBuilders.put("/api/persons/{id}", created.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(created)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Caroline"))
                .andExpect(jsonPath("$.email").value("caroline.king@example.com"));
    }

    @Test
    void testFindByLastName() throws Exception {
        // create two persons
        PersonDto p1 = new PersonDto(null, "David", "Smith", "david.smith@example.com");
        PersonDto p2 = new PersonDto(null, "Eve", "Johnson", "eve.johnson@example.com");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p1)))
                .andExpect(status().isCreated());

        mockMvc.perform(MockMvcRequestBuilders.post("/api/persons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p2)))
                .andExpect(status().isCreated());

        // search by last name (case-insensitive)
        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/search")
                        .param("lastName", "smith"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("[0].lastName").value("Smith"));
    }

    @Test
    void testListPersons() throws Exception {
        // ensure at least one person exists
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

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/persons/{id}", created.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/persons/{id}", created.getId()))
                .andExpect(status().isNotFound());
    }

}
