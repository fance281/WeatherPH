package weatherPhApplication.java.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // Import Value
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    // Inject the required sender email from the properties file
    @Value("${spring.mail.properties.mail.smtp.from}")
    private String senderEmail;
    
    public void sendVerificationEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(senderEmail); // <--- ADDED: Set the verified Brevo sender

            logger.info("Attempting to send verification email to: {}", to);
            mailSender.send(message);
            logger.info("Verification email sent successfully to: {}", to);

        } catch (Exception e) {
            logger.error("Failed to send verification email to: {}. Error: {}", to, e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(senderEmail); // <--- ADDED: Set the verified Brevo sender

            logger.info("Attempting to send password reset email to: {}", to);
            mailSender.send(message);
            logger.info("Password reset email sent successfully to: {}", to);
            
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}. Error: {}", to, e.getMessage());
        }
    }
}