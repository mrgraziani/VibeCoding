package com.example.personcrud.repository;

import com.example.personcrud.model.AcademicAuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicAuditLogRepository extends JpaRepository<AcademicAuditLogEntry, Long> {
    Page<AcademicAuditLogEntry> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<AcademicAuditLogEntry> findTop50ByOrderByCreatedAtDesc();
    List<AcademicAuditLogEntry> findByCourseIdOrderByCreatedAtDesc(Long courseId);
}
