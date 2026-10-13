package com.example.personcrud.service;

import com.example.personcrud.event.AcademicEvent;
import com.example.personcrud.event.AcademicEvent.CourseCreatedEvent;
import com.example.personcrud.event.AcademicEvent.StudentEnrolledEvent;
import com.example.personcrud.event.AcademicEvent.TeacherAssignedEvent;
import org.springframework.stereotype.Service;

import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AcademicAuditService {

    private static final int MAX_AUDIT_LOG_SIZE = 1000;
    private final Deque<AcademicEvent> auditLog = new ConcurrentLinkedDeque<>();
    private final AtomicInteger currentSize = new AtomicInteger(0);

    public void recordEvent(AcademicEvent event) {
        if (event == null) return;
        auditLog.addLast(event);
        if (currentSize.incrementAndGet() > MAX_AUDIT_LOG_SIZE) {
            if (auditLog.pollFirst() != null) {
                currentSize.decrementAndGet();
            }
        }
    }

    public List<AcademicEvent> getAuditLog() {
        return List.copyOf(auditLog);
    }

    /**
     * Demonstrates Pattern Matching for switch, Record Patterns,
     * and Unnamed Variables/Patterns (_).
     */
    public String describeEvent(AcademicEvent event) {
        return switch (event) {
            case StudentEnrolledEvent(var courseId, var studentId, var courseName) ->
                    "Student #" + studentId + " was enrolled in '" + courseName + "' (course #" + courseId + ")";

            case TeacherAssignedEvent(var courseId, var teacherId, _) ->
                    "Teacher #" + teacherId + " assigned to course #" + courseId;

            case CourseCreatedEvent(var courseId, var name, _) ->
                    "Course created: '" + name + "' (course #" + courseId + ")";
        };
    }
}
