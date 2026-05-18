package com.atomquest.modules.notification.service;

import com.atomquest.modules.notification.event.NotificationEvent;
import com.atomquest.modules.user.entity.User;
import com.atomquest.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

import static com.atomquest.config.RabbitMQConfig.NOTIFICATION_QUEUE;

/**
 * Consumes notification events from RabbitMQ.
 * Responsible for email dispatch and Teams webhook forwarding.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final EmailService emailService;
    private final UserRepository userRepository;

    @RabbitListener(queues = NOTIFICATION_QUEUE)
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("Processing notification event: type={}, recipient={}", event.getEventType(), event.getRecipientUserId());

        Optional<User> recipient = userRepository.findById(event.getRecipientUserId());
        if (recipient.isEmpty()) {
            log.warn("Recipient not found for notification event, skipping email.");
            return;
        }

        try {
            emailService.sendNotificationEmail(
                    recipient.get().getEmail(),
                    recipient.get().getName(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getDeepLink()
            );
        } catch (Exception e) {
            log.error("Email dispatch failed for event type {} to {}: {}", event.getEventType(), recipient.get().getEmail(), e.getMessage());
            // Don't rethrow — failed email should not cause message requeue
        }
    }
}
