package com.example.personcrud.controller;

import com.example.personcrud.nativebridge.NativeSystemBridge;
import com.example.personcrud.service.VirtualThreadService;
import com.example.personcrud.service.VirtualThreadService.TaskResult;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.util.List;
import java.util.Map;

/**
 * Educational & Diagnostic System Controller (/api/system).
 *
 * ARCHITECTURAL DESIGN NOTE (SENIOR & STAFF GOVERNANCE):
 * This controller deliberately isolates experimental and platform-level Java 21-25 features
 * (Project Panama Foreign Function & Memory API, Virtual Thread dispatch benchmarking,
 * Spring Boot Actuator telemetry, and system diagnostics) from core academic domain services.
 */
@RestController
@RequestMapping("/api/system")
public class SystemModernFeaturesController {

    private final NativeSystemBridge nativeSystemBridge;
    private final VirtualThreadService virtualThreadService;
    private final HealthEndpoint healthEndpoint;

    public SystemModernFeaturesController(NativeSystemBridge nativeSystemBridge,
                                          VirtualThreadService virtualThreadService,
                                          ObjectProvider<HealthEndpoint> healthEndpointProvider) {
        this.nativeSystemBridge = nativeSystemBridge;
        this.virtualThreadService = virtualThreadService;
        this.healthEndpoint = healthEndpointProvider.getIfAvailable();
    }

    @GetMapping("/native-info")
    public Map<String, Object> getNativeDiagnostics(@RequestParam(defaultValue = "Modern Java 25 Test") String payload) {
        if (payload != null && payload.length() > 1024) {
            throw new IllegalArgumentException("Payload size exceeds maximum allowed length of 1024 characters");
        }
        return nativeSystemBridge.getDiagnostics(payload);
    }

    @PostMapping("/virtual-threads/run")
    public List<TaskResult> runVirtualThreads(@RequestBody(required = false) List<String> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            tasks = List.of("EnrollmentSync", "GradeReportGen", "AuditLogDigest", "NotificationDispatch");
        }
        if (tasks.size() > 50) {
            throw new IllegalArgumentException("Maximum of 50 tasks allowed per batch execution to prevent resource exhaustion");
        }
        return virtualThreadService.executeTasksInVirtualThreads(tasks);
    }

    /**
     * Exposes Cloud-Native Spring Boot Actuator Telemetry & JVM SRE metrics
     * for the modern Java 25 Lab dashboard.
     */
    @GetMapping("/actuator-summary")
    public Map<String, Object> getActuatorSummary() {
        Runtime rt = Runtime.getRuntime();
        long usedMemoryMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long maxMemoryMb = rt.maxMemory() / (1024 * 1024);
        long totalMemoryMb = rt.totalMemory() / (1024 * 1024);

        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        int activeThreads = ManagementFactory.getThreadMXBean().getThreadCount();

        String dbStatus = "UP";
        if (healthEndpoint != null) {
            HealthComponent hc = healthEndpoint.health();
            dbStatus = hc != null ? hc.getStatus().getCode() : "UP";
        }

        return Map.of(
                "status", "UP",
                "databaseStatus", dbStatus,
                "uptimeSeconds", uptimeSeconds,
                "uptimeFormatted", String.format("%02dh %02dm %02ds", uptimeSeconds / 3600, (uptimeSeconds % 3600) / 60, uptimeSeconds % 60),
                "jvmMemory", Map.of(
                        "usedMb", usedMemoryMb,
                        "totalMb", totalMemoryMb,
                        "maxMb", maxMemoryMb,
                        "usagePercentage", maxMemoryMb > 0 ? Math.round((double) usedMemoryMb / maxMemoryMb * 100) : 0
                ),
                "cpuCores", rt.availableProcessors(),
                "liveThreads", activeThreads,
                "virtualThreadsEnabled", true
        );
    }
}
