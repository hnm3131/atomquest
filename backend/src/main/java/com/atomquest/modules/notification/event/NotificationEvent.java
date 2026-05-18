package com.atomquest.modules.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A domain event published to RabbitMQ for async notification processing.
 * Consumers can trigger email, WebSocket push, or Teams webhooks.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {

    private String eventType;          // e.g. GOAL_SUBMITTED, GOAL_APPROVED, CHECK_IN_SUBMITTED
    private UUID recipientUserId;
    private UUID actorUserId;
    private String title;
    private String message;
    private String deepLink;
    @Builder.Default
    private LocalDateTime occurredAt = LocalDateTime.now();
}
