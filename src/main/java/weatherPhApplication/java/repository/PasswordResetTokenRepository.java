package weatherPhApplication.java.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import weatherPhApplication.java.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    PasswordResetToken findByToken(String token);
}
