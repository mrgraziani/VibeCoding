package com.example.personcrud.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.*;

/**
 * Demonstrates Java 21+ Virtual Threads (JEP 444).
 */
@Service
public class VirtualThreadService {

    /**
     * Executes parallel workloads using a new Virtual Thread per task executor.
     * Simulates realistic parallel I/O and processing across lightweight Virtual Threads.
     */
    public List<TaskResult> executeTasksInVirtualThreads(List<String> taskNames) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<TaskResult>> futures = taskNames.stream()
                    .map(name -> executor.submit(() -> {
                        long start = System.currentTimeMillis();
                        Thread current = Thread.currentThread();
                        // Simulate realistic parallel I/O workload (non-blocking in Virtual Threads)
                        int sleepMs = 1200 + ThreadLocalRandom.current().nextInt(500);
                        try {
                            Thread.sleep(sleepMs);
                        } catch (InterruptedException _) {
                            Thread.currentThread().interrupt();
                        }
                        long duration = System.currentTimeMillis() - start;
                        return new TaskResult(
                                name,
                                current.isVirtual(),
                                current.toString(),
                                "Completed successfully",
                                duration
                        );
                    }))
                    .toList();

            return futures.stream().map(future -> {
                try {
                    return future.get(10, TimeUnit.SECONDS);
                } catch (Exception _) {
                    return new TaskResult("Failed task", false, "unknown", "Error in virtual thread execution", 0L);
                }
            }).toList();
        }
    }

    public record TaskResult(String taskName, boolean isVirtual, String threadInfo, String status, long durationMs) {
        public TaskResult(String taskName, boolean isVirtual, String threadInfo, String status) {
            this(taskName, isVirtual, threadInfo, status, 0L);
        }
    }
}
