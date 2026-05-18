package com.atomquest.modules.cycle.controller;

import com.atomquest.modules.cycle.entity.Cycle;
import com.atomquest.modules.cycle.repository.CycleRepository;
import com.atomquest.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cycles")
@RequiredArgsConstructor
public class CycleController {

    private final CycleRepository cycleRepository;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Cycle>> getActive() {
        Cycle cycle = cycleRepository.findByIsActiveTrue()
                .orElseThrow(() -> new RuntimeException("No active cycle"));
        return ResponseEntity.ok(ApiResponse.success(cycle));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Cycle>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(cycleRepository.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Cycle>> create(@RequestBody Cycle cycle) {
        return ResponseEntity.ok(ApiResponse.success(cycleRepository.save(cycle)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Cycle>> update(@PathVariable UUID id, @RequestBody Cycle cycle) {
        cycle.setId(id);
        return ResponseEntity.ok(ApiResponse.success(cycleRepository.save(cycle)));
    }
}
