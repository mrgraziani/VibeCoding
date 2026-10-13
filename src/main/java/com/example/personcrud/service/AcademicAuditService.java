package com.example.personcrud.service;

import com.example.personcrud.event.AcademicEvent;
import com.example.personcrud.event.AcademicEvent.CourseCreatedEvent;
import com.example.personcrud.event.AcademicEvent.StudentEnrolledEvent;
import com.example.personcrud.event.AcademicEvent.TeacherAssignedEvent;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AcademicAuditService {

    private static final int MAX_AUDIT_LOG_SIZE = 1000;
    private final List<AcademicEvent> auditLog = new CopyOnWriteArrayList<>();

    public void recordEvent(AcademicEvent event) {
        if (event == null) return;
        while (auditLog.size() >= MAX_AUDIT_LOG_SIZE) {
            auditLog.remove(0);
        }
        auditLog.add(event);
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
