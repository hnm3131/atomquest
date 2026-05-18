package com.atomquest.modules.notification.controller;

import com.atomquest.modules.notification.entity.Notification;
import com.atomquest.modules.notification.service.NotificationService;
import com.atomquest.modules.user.repository.UserRepository;
import com.atomquest.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private UUID resolveUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName()).orElseThrow().getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getAll(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getAll(resolveUserId(auth))));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnread(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnread(resolveUserId(auth))));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("count", notificationService.getUnreadCount(resolveUserId(auth)))
        ));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Marked as read"));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(resolveUserId(auth));
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }
}
