package com.atomquest.modules.audit.repository;

import com.atomquest.modules.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByEntityIdOrderByChangedAtDesc(UUID entityId);
    Page<AuditLog> findByEntityTypeOrderByChangedAtDesc(String entityType, Pageable pageable);
    Page<AuditLog> findAllByOrderByChangedAtDesc(Pageable pageable);
    List<AuditLog> findByChangedByOrderByChangedAtDesc(UUID changedBy);
}
