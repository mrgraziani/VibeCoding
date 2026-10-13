package com.example.personcrud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_audit_log", indexes = {
        @Index(name = "idx_audit_course_id", columnList = "course_id"),
        @Index(name = "idx_audit_created_at", columnList = "created_at")
})
public class AcademicAuditLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "payload_json", length = 2048)
    private String payloadJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public AcademicAuditLogEntry() {
    }

    public AcademicAuditLogEntry(Long courseId, String eventType, String description, String payloadJson) {
        this.courseId = courseId;
        this.eventType = eventType;
        this.description = description;
        this.payloadJson = payloadJson;
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
