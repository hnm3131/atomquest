package com.atomquest.modules.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Branded HTML email service for AtomQuest notifications.
 * Uses Gmail SMTP via spring-boot-starter-mail.
 *
 * IMPORTANT: This service NEVER throws exceptions — email failures are
 * logged as warnings and the calling thread continues normally.
 * This prevents email errors from disrupting the RabbitMQ listener.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    /**
     * Returns true if a valid from-address (Gmail) is configured.
     */
    private boolean isConfigured() {
        return fromAddress != null && !fromAddress.isBlank() && fromAddress.contains("@");
    }

    /**
     * Sends a branded HTML notification email asynchronously.
     * Silently skips if mail is not configured or if send fails.
     */
    @Async
    public void sendNotificationEmail(String toEmail, String recipientName,
                                      String subject, String body, String deepLink) {
        if (!isConfigured()) {
            log.debug("Email not configured (MAIL_USERNAME empty) — skipping email to {}", toEmail);
            return;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.debug("No recipient email — skipping notification for: {}", subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, "AtomQuest Portal");
            helper.setTo(toEmail);
            helper.setSubject("[AtomQuest] " + subject);
            helper.setText(buildHtmlEmail(recipientName, subject, body, deepLink), true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", toEmail, subject);
        } catch (MessagingException e) {
            log.warn("Email composition failed for {}: {}", toEmail, e.getMessage());
        } catch (MailException e) {
            log.warn("Email send failed for {} (check SMTP credentials): {}", toEmail, e.getMessage());
        } catch (Exception e) {
            log.warn("Unexpected email error for {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildHtmlEmail(String name, String subject, String body, String deepLink) {
        String actionButton = (deepLink != null && !deepLink.isBlank())
                ? "<a href='http://localhost:5173" + deepLink + "' "
                + "style='display:inline-block;padding:12px 28px;"
                + "background:linear-gradient(135deg,#6366f1,#4f46e5);"
                + "color:white;text-decoration:none;border-radius:8px;"
                + "font-weight:600;margin-top:20px;'>View in AtomQuest</a>"
                : "";
        return """
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background:#0f0a2a;font-family:Inter,sans-serif;color:#f1f5f9;">
                  <div style="max-width:600px;margin:40px auto;background:rgba(30,27,75,0.95);
                              border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:40px;">
                    <!-- Header -->
                    <div style="display:flex;align-items:center;margin-bottom:32px;">
                      <div style="width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#0ea5e9);
                                  border-radius:10px;display:flex;align-items:center;justify-content:center;margin-right:12px;">
                        <span style="color:white;font-weight:bold;font-size:18px;">A</span>
                      </div>
                      <span style="font-size:20px;font-weight:700;
                                   background:linear-gradient(135deg,#818cf8,#38bdf8);
                                   -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                        AtomQuest
                      </span>
                    </div>
                    <!-- Body -->
                    <h2 style="color:#f1f5f9;margin:0 0 8px;">Hi %s,</h2>
                    <h3 style="color:#818cf8;margin:0 0 20px;">%s</h3>
                    <p style="color:#94a3b8;line-height:1.6;margin:0 0 20px;">%s</p>
                    %s
                    <hr style="border:1px solid rgba(99,102,241,0.1);margin:32px 0;">
                    <p style="color:#64748b;font-size:12px;">
                      This is an automated notification from AtomQuest Goal Portal.
                      Please do not reply to this email.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(name, subject, body, actionButton);
    }
}
