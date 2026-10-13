package com.example.personcrud;

import com.example.personcrud.event.AcademicEvent.*;
import com.example.personcrud.model.Course;
import com.example.personcrud.nativebridge.NativeSystemBridge;
import com.example.personcrud.service.AcademicAuditService;
import com.example.personcrud.service.CourseService;
import com.example.personcrud.service.VirtualThreadService;
import com.example.personcrud.service.VirtualThreadService.TaskResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;
import java.util.SequencedCollection;
import java.util.stream.Gatherers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = PersonCrudApplication.class)
@AutoConfigureMockMvc
@org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
class ModernFeaturesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VirtualThreadService virtualThreadService;

    @Autowired
    private NativeSystemBridge nativeSystemBridge;

    @Autowired
    private AcademicAuditService auditService;

    @Autowired
    private CourseService courseService;

    @Test
    void testVirtualThreadsExecution() {
        List<String> taskNames = List.of("TaskA", "TaskB", "TaskC", "TaskD");
        List<TaskResult> results = virtualThreadService.executeTasksInVirtualThreads(taskNames);

        assertThat(results).hasSize(4);
        for (TaskResult r : results) {
            assertThat(r.isVirtual()).as("Task should run on a Virtual Thread").isTrue();
            assertThat(r.status()).isEqualTo("Completed successfully");
            assertThat(r.taskName()).isNotBlank();
            assertThat(r.threadInfo()).isNotBlank();
        }
    }

    @Test
    void testForeignFunctionAndMemoryAPI() {
        // Test Foreign Function (downcall to libc getpid)
        long pid = nativeSystemBridge.getNativeProcessId();
        assertThat(pid).isPositive();

        // Test Foreign Memory (Arena + off-heap MemorySegment checksum)
        String checksum1 = nativeSystemBridge.calculateOffHeapDigest("Student Certificate #101");
        String checksum2 = nativeSystemBridge.calculateOffHeapDigest("Student Certificate #101");
        String checksumDiff = nativeSystemBridge.calculateOffHeapDigest("Student Certificate #102");
        String checksumNull = nativeSystemBridge.calculateOffHeapDigest(null);

        assertThat(checksum1).isNotBlank();
        assertThat(checksum1).isEqualTo(checksum2);
        assertThat(checksum1).isNotEqualTo(checksumDiff);
        assertThat(checksumNull).isNotBlank();

        var diag = nativeSystemBridge.getDiagnostics("test-payload");
        assertThat(diag).containsKey("nativeProcessId");
        assertThat(diag).containsKey("offHeapDigest");
    }

    @Test
    void testSealedClassesAndPatternMatching() {
        var created = new CourseCreatedEvent(1L, "Math", 10L);
        var teacher = new TeacherAssignedEvent(1L, 10L, "Math");
        var enrolled = new StudentEnrolledEvent(1L, 20L, "Math");

        assertThat(auditService.describeEvent(created)).contains("Course created: 'Math'");
        assertThat(auditService.describeEvent(teacher)).contains("Teacher #10");
        assertThat(auditService.describeEvent(enrolled)).contains("Student #20 was enrolled");
    }

    @Test
    void testStreamGatherersDirectly() {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7);
        List<List<Integer>> windows = numbers.stream()
                .gather(Gatherers.windowFixed(3))
                .toList();

        assertThat(windows).containsExactly(
                List.of(1, 2, 3),
                List.of(4, 5, 6),
                List.of(7)
        );
    }

    @Test
    void testSequencedCollectionsDirectly() {
        SequencedCollection<String> list = new java.util.ArrayList<>(List.of("alpha", "beta", "gamma"));

        assertThat(list.getFirst()).isEqualTo("alpha");
        assertThat(list.getLast()).isEqualTo("gamma");
        assertThat(list.reversed()).containsExactly("gamma", "beta", "alpha");
    }

    @Test
    void testSystemModernFeaturesEndpoints() throws Exception {
        // GET /api/system/native-info
        mockMvc.perform(MockMvcRequestBuilders.get("/api/system/native-info")
                        .param("payload", "IntegrationTest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nativeProcessId").isNumber())
                .andExpect(jsonPath("$.offHeapDigest").isString());

        // POST /api/system/virtual-threads/run with custom tasks
        mockMvc.perform(MockMvcRequestBuilders.post("/api/system/virtual-threads/run")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of("EnrollmentSync", "GradeCalc"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].isVirtual").value(true));

        // POST /api/system/virtual-threads/run without payload (defaults)
        mockMvc.perform(MockMvcRequestBuilders.post("/api/system/virtual-threads/run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));

        // GET /api/system/actuator-summary
        mockMvc.perform(MockMvcRequestBuilders.get("/api/system/actuator-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.jvmMemory.usedMb").isNumber())
                .andExpect(jsonPath("$.virtualThreadsEnabled").value(true));
    }

    @Test
    void testCourseServiceNotFoundEdgeCases() {
        assertThat(courseService.findById(99999L)).isEmpty();
        assertThat(courseService.update(99999L, new Course())).isEmpty();
        assertThat(courseService.getStudentsReversed(99999L)).isEmpty();

        assertThatThrownBy(() -> courseService.getStudentCohorts(99999L, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Course not found");

        assertThatThrownBy(() -> courseService.getStudentCohorts(99999L, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cohort size must be greater than zero");
    }

    @Test
    void testConcurrentAuditLoggingThreadSafety() throws Exception {
        int threadCount = 50;
        try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
            java.util.List<java.util.concurrent.Future<?>> futures = new java.util.ArrayList<>();
            for (int i = 0; i < threadCount; i++) {
                final long id = i;
                futures.add(executor.submit(() -> {
                    auditService.recordEvent(new CourseCreatedEvent(id, "Course" + id, id));
                }));
            }
            for (var f : futures) {
                f.get();
            }
        }
        assertThat(auditService.getAuditLog()).isNotEmpty();
    }

    @Test
    void testSecurityLimitsAndInputValidation() throws Exception {
        // Exceeding virtual thread task limit (51 tasks)
        List<String> tooManyTasks = java.util.Collections.nCopies(51, "Task");
        mockMvc.perform(MockMvcRequestBuilders.post("/api/system/virtual-threads/run")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(tooManyTasks)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Maximum of 50 tasks allowed")));

        // Invalid cohort size in controller
        mockMvc.perform(MockMvcRequestBuilders.get("/api/courses/1/cohorts")
                        .param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Cohort size must be between 1 and 100")));

        // Native info payload size limit (> 1024 chars)
        String oversizedPayload = "A".repeat(1025);
        mockMvc.perform(MockMvcRequestBuilders.get("/api/system/native-info")
                        .param("payload", oversizedPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Payload size exceeds maximum allowed length")));
    }
}
