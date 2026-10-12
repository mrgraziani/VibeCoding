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
     */
    public List<TaskResult> executeTasksInVirtualThreads(List<String> taskNames) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<TaskResult>> futures = taskNames.stream()
                    .map(name -> executor.submit(() -> {
                        Thread current = Thread.currentThread();
                        return new TaskResult(
                                name,
                                current.isVirtual(),
                                current.toString(),
                                "Completed successfully"
                        );
                    }))
                    .toList();

            return futures.stream().map(future -> {
                try {
                    return future.get(5, TimeUnit.SECONDS);
                } catch (Exception _) {
                    return new TaskResult("Failed task", false, "unknown", "Error in virtual thread execution");
                }
            }).toList();
        }
    }

    public record TaskResult(String taskName, boolean isVirtual, String threadInfo, String status) {}
}
