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
    }

    @Test
    void testCourseServiceNotFoundEdgeCases() {
        assertThat(courseService.findById(99999L)).isEmpty();
        assertThat(courseService.update(99999L, new Course())).isEmpty();
        assertThat(courseService.getStudentsReversed(99999L)).isEmpty();

        assertThatThrownBy(() -> courseService.getStudentCohorts(99999L, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Course not found");
    }
}
