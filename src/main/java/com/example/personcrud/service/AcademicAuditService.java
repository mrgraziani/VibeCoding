package com.example.personcrud.service;

import com.example.personcrud.event.AcademicEvent;
import com.example.personcrud.event.AcademicEvent.CourseCreatedEvent;
import com.example.personcrud.event.AcademicEvent.StudentEnrolledEvent;
import com.example.personcrud.event.AcademicEvent.TeacherAssignedEvent;
import com.example.personcrud.model.AcademicAuditLogEntry;
import com.example.personcrud.repository.AcademicAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AcademicAuditService {

    private final AcademicAuditLogRepository auditRepository;

    public AcademicAuditService(AcademicAuditLogRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    @Transactional
    public void recordEvent(AcademicEvent event) {
        if (event == null) return;
        String desc = describeEvent(event);
        String eventType = event.getClass().getSimpleName();
        AcademicAuditLogEntry entry = new AcademicAuditLogEntry(
                event.courseId(),
                eventType,
                desc,
                event.toString()
        );
        auditRepository.save(entry);
    }

    public List<AcademicAuditLogEntry> getAuditLog() {
        return auditRepository.findTop50ByOrderByCreatedAtDesc();
    }

    public List<String> getAuditLogDescriptions() {
        return auditRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(AcademicAuditLogEntry::getDescription)
                .toList();
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
