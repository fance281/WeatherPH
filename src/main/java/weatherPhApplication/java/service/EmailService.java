package weatherPhApplication.java.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    // Make the dependency final
    private final RestTemplate restTemplate;

    @Value("${brevo.api.url}")
    private String brevoApiUrl;

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    // Use constructor injection
    // @Autowired // This is often optional on constructors in recent Spring versions
    public EmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // ... rest of your sendApiEmail, sendVerificationEmail, sendPasswordResetEmail methods ...
    private void sendApiEmail(String toEmail, String subject, String body) {
        try {
            // 1. Set API Headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("api-key", brevoApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            // 2. Construct Sender and Recipient Objects
            Map<String, String> sender = new HashMap<>();
            sender.put("email", senderEmail);
            sender.put("name", senderName);

            Map<String, String> recipient = Map.of("email", toEmail);

            // 3. Construct the full JSON payload
            Map<String, Object> payload = Map.of(
                "sender", sender,
                "to", List.of(recipient),
                "subject", subject,
                "htmlContent", body.replace("\n", "<br>")
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            logger.info("Attempting to send email via Brevo API to: {}", toEmail);

            // 4. Send the Request (Uses the injected restTemplate)
            ResponseEntity<String> response = restTemplate.exchange(
                brevoApiUrl,
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Email sent successfully via Brevo API to: {}. Response: {}", toEmail, response.getBody());
            } else {
                logger.error("Brevo API failed for {}. Status: {}, Response: {}", toEmail, response.getStatusCode(), response.getBody());
                throw new RuntimeException("Brevo API failure: HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Failed to send email to: {}. Error: {}", toEmail, e.getMessage());
            throw new RuntimeException("Email sending failed via Brevo API", e);
        }
    }

    public void sendVerificationEmail(String to, String subject, String body) {
        sendApiEmail(to, subject, body);
    }

    public void sendPasswordResetEmail(String to, String subject, String body) {
        sendApiEmail(to, subject, body);
    }
}