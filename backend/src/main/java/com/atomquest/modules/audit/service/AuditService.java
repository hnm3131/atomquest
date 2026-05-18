package com.atomquest.modules.audit.service;

import com.atomquest.modules.audit.entity.AuditLog;
import com.atomquest.modules.audit.repository.AuditLogRepository;
import com.atomquest.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void log(UUID entityId, String entityType, String action, String fieldName,
                    String oldValue, String newValue, UUID changedBy) {
        String changedByName = userRepository.findById(changedBy)
                .map(u -> u.getName()).orElse("Unknown");
        AuditLog log = AuditLog.builder()
                .entityId(entityId).entityType(entityType).action(action)
                .fieldName(fieldName).oldValue(oldValue).newValue(newValue)
                .changedBy(changedBy).changedByName(changedByName).build();
        auditLogRepository.save(log);
    }

    public List<AuditLog> getByEntity(UUID entityId) {
        return auditLogRepository.findByEntityIdOrderByChangedAtDesc(entityId);
    }

    public Page<AuditLog> getAll(Pageable pageable) {
        return auditLogRepository.findAllByOrderByChangedAtDesc(pageable);
    }
}
