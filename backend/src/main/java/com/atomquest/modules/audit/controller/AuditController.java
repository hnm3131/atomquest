package com.atomquest.modules.audit.controller;

import com.atomquest.modules.audit.entity.AuditLog;
import com.atomquest.modules.audit.service.AuditService;
import com.atomquest.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAll(PageRequest.of(page, size))));
    }

    @GetMapping("/entity/{entityId}")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getByEntity(@PathVariable UUID entityId) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getByEntity(entityId)));
    }
}
