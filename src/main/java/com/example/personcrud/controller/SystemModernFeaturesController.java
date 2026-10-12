package com.example.personcrud.controller;

import com.example.personcrud.nativebridge.NativeSystemBridge;
import com.example.personcrud.service.VirtualThreadService;
import com.example.personcrud.service.VirtualThreadService.TaskResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing the modern Java 21-25 features for inspection & verification:
 * - Virtual Threads
 * - Foreign Function & Memory (FFM) API
 */
@RestController
@RequestMapping("/api/system")
public class SystemModernFeaturesController {

    private final NativeSystemBridge nativeSystemBridge;
    private final VirtualThreadService virtualThreadService;

    public SystemModernFeaturesController(NativeSystemBridge nativeSystemBridge,
                                          VirtualThreadService virtualThreadService) {
        this.nativeSystemBridge = nativeSystemBridge;
        this.virtualThreadService = virtualThreadService;
    }

    @GetMapping("/native-info")
    public Map<String, Object> getNativeDiagnostics(@RequestParam(defaultValue = "Modern Java 25 Test") String payload) {
        return nativeSystemBridge.getDiagnostics(payload);
    }

    @PostMapping("/virtual-threads/run")
    public List<TaskResult> runVirtualThreads(@RequestBody(required = false) List<String> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            tasks = List.of("EnrollmentSync", "GradeReportGen", "AuditLogDigest", "NotificationDispatch");
        }
        return virtualThreadService.executeTasksInVirtualThreads(tasks);
    }
}
