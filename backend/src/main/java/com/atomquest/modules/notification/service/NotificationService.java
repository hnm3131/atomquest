package com.atomquest.modules.notification.service;

import com.atomquest.config.RabbitMQConfig;
import com.atomquest.modules.notification.entity.Notification;
import com.atomquest.modules.notification.event.NotificationEvent;
import com.atomquest.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Core dispatch method:
     * 1. Persists notification to DB.
     * 2. Pushes in-app notification via WebSocket.
     * 3. Publishes async event to RabbitMQ for email/Teams delivery.
     */
    public void sendNotification(UUID userId, String type, String title, String message, String link) {
        // 1. Persist
        Notification notification = Notification.builder()
                .userId(userId).type(type).title(title).message(message).link(link).build();
        notification = notificationRepository.save(notification);

        // 2. WebSocket push to user's private queue
        try {
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    notification
            );
        } catch (Exception e) {
            log.warn("WebSocket push failed for user {}: {}", userId, e.getMessage());
        }

        // 3. Publish to RabbitMQ for async email / Teams webhook processing
        NotificationEvent event = NotificationEvent.builder()
                .eventType(type)
                .recipientUserId(userId)
                .title(title)
                .message(message)
                .deepLink(link)
                .build();
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "notification.send", event);
        } catch (Exception e) {
            log.warn("RabbitMQ publish failed for notification to user {}: {}", userId, e.getMessage());
        }

        log.debug("Notification dispatched: type={}, userId={}", type, userId);
    }

    public List<Notification> getUnread(UUID userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getAll(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
